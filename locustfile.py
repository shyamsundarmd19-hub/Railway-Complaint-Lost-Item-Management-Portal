"""
RailAlert Cloud Performance & Load Testing Suite
Simulates 100 to 1000 simultaneous passengers and railway staff.

Requirements:
    pip install locust

Execution Commands for Project Evaluation:

1. Interactive Web Dashboard:
    locust -f locustfile.py --host http://localhost:8000

2. Headless Stress Test (100 Users, Ramp-up 10/sec, 2 Minutes):
    locust -f locustfile.py --headless -u 100 -r 10 --run-time 2m \
        --host http://localhost:8000 \
        --html report_100_users.html \
        --csv reports/run_100

3. Peak Capacity Stress Test (500 Users, Ramp-up 25/sec, 5 Minutes):
    locust -f locustfile.py --headless -u 500 -r 25 --run-time 5m \
        --host http://localhost:8000 \
        --html report_500_users.html \
        --csv reports/run_500

4. EC2 Production ALB Load Test (1000 Users):
    locust -f locustfile.py --headless -u 1000 -r 50 --run-time 5m \
        --host http://YOUR_ALB_DNS_NAME \
        --html report_1000_users.html
"""

import random
import uuid
from locust import HttpUser, task, between, tag


class PassengerUser(HttpUser):
    """
    Simulates standard railway passenger actions:
    Browsing train routes, logging grievances, uploading photo metadata,
    and monitoring complaint status.
    """
    weight = 9  # 90% of overall traffic
    wait_time = between(1, 3)

    def on_start(self):
        """Register a unique passenger user and save authorization token."""
        self.user_uuid = uuid.uuid4().hex[:8]
        self.email = f"passenger_{self.user_uuid}@loadtest.railalert"
        self.password = "TestPassword@123"
        self.token = None
        self.headers = {"Content-Type": "application/json"}

        # Attempt to register
        reg_payload = {
            "name": f"Passenger {self.user_uuid}",
            "email": self.email,
            "phone": "9876543210",
            "password": self.password,
            "role": "passenger"
        }
        res = self.client.post("/api/v1/auth/register", json=reg_payload)
        if res.status_code == 201:
            data = res.json()
            self.token = data.get("access_token")
            self.headers["Authorization"] = f"Bearer {self.token}"
        else:
            # Fallback to login if already exists
            login_res = self.client.post("/api/v1/auth/login/json", json={
                "email": self.email,
                "password": self.password
            })
            if login_res.status_code == 200:
                self.token = login_res.json().get("access_token")
                self.headers["Authorization"] = f"Bearer {self.token}"

        self.sample_trains = ["12002", "12301", "22436", "12951", "12626"]
        self.categories = ["cleanliness", "pantry", "electrical", "security", "other"]

    @task(4)
    @tag("read", "trains")
    def view_train_routes(self):
        """Fetch registered trains and stations list."""
        self.client.get("/api/v1/trains/", name="/api/v1/trains/")

    @task(5)
    @tag("read", "complaints")
    def check_my_complaints(self):
        """Passenger periodically checks complaint history & status updates."""
        if self.token:
            self.client.get(
                "/api/v1/complaints/",
                headers=self.headers,
                name="/api/v1/complaints/ [History]"
            )

    @task(3)
    @tag("write", "complaints")
    def file_new_complaint(self):
        """Passenger submits an onboard grievance with seat details."""
        if not self.token:
            return

        payload = {
            "train_number": random.choice(self.sample_trains),
            "coach_number": f"B{random.randint(1, 10)}",
            "seat_number": str(random.randint(1, 72)),
            "category": random.choice(self.categories),
            "priority": random.choice(["Low", "Medium", "High"]),
            "description": f"Automated stress test grievance logged at seat {random.randint(1, 72)} - prompt assistance needed.",
            "photo_url": f"https://railalert-vault-storage.s3.ap-south-1.amazonaws.com/complaints/mock_{uuid.uuid4().hex[:6]}.jpg"
        }

        self.client.post(
            "/api/v1/complaints/",
            json=payload,
            headers=self.headers,
            name="/api/v1/complaints/ [Create]"
        )

    @task(2)
    @tag("write", "s3")
    def request_s3_presigned_upload(self):
        """Generates S3 presigned upload URL without loading EC2 bandwidth."""
        if not self.token:
            return

        payload = {
            "filename": f"evidence_{uuid.uuid4().hex[:6]}.jpg",
            "file_type": "image/jpeg",
            "folder": "complaints"
        }
        self.client.post(
            "/api/v1/documents/upload-url",
            json=payload,
            headers=self.headers,
            name="/api/v1/documents/upload-url [Presigned]"
        )

    @task(2)
    @tag("write", "lost_items")
    def report_lost_property(self):
        """Passenger logs a lost personal item."""
        if not self.token:
            return

        payload = {
            "item_name": "Leather Laptop Bag",
            "train_number": random.choice(self.sample_trains),
            "coach_number": "A1",
            "seat_number": "24",
            "description": "Black Dell laptop bag misplaced on overhead luggage rack.",
            "photo_url": None
        }
        self.client.post(
            "/api/v1/lost-items/",
            json=payload,
            headers=self.headers,
            name="/api/v1/lost-items/ [Report]"
        )

    @task(1)
    @tag("monitoring", "health")
    def health_check(self):
        """Simulates AWS ALB / Route 53 health ping."""
        self.client.get("/health", name="/health")


class StaffUser(HttpUser):
    """
    Simulates Railway Division Staff and Control Room Operators:
    Filtering open grievances, inspecting queue items, and marking complaints as resolved.
    """
    weight = 1  # 10% of overall traffic
    wait_time = between(2, 5)

    def on_start(self):
        """Login as staff user."""
        self.email = "staff@railalert.internal"
        self.password = "Staff@123"
        self.token = None
        self.headers = {"Content-Type": "application/json"}

        # Attempt to create or login staff
        reg_payload = {
            "name": "Division Controller",
            "email": self.email,
            "phone": "9999900000",
            "password": self.password,
            "role": "railway_staff"
        }
        res = self.client.post("/api/v1/auth/register", json=reg_payload)
        if res.status_code == 201:
            self.token = res.json().get("access_token")
            self.headers["Authorization"] = f"Bearer {self.token}"
        else:
            login_res = self.client.post("/api/v1/auth/login/json", json={
                "email": self.email,
                "password": self.password
            })
            if login_res.status_code == 200:
                self.token = login_res.json().get("access_token")
                self.headers["Authorization"] = f"Bearer {self.token}"

    @task(5)
    @tag("staff", "queue")
    def inspect_complaints_queue(self):
        """Staff queries the active registered complaints queue."""
        if self.token:
            self.client.get(
                "/api/v1/complaints/all?status=registered",
                headers=self.headers,
                name="/api/v1/complaints/all [Staff Queue]"
            )

    @task(3)
    @tag("staff", "lost_items")
    def check_lost_property_vault(self):
        """Staff inspects lost property inventory."""
        if self.token:
            self.client.get(
                "/api/v1/lost-items/all",
                headers=self.headers,
                name="/api/v1/lost-items/all [Staff Registry]"
            )

    @task(2)
    @tag("staff", "analytics")
    def view_analytics_dashboard(self):
        """Staff / Admin queries aggregated telemetry & resolution rate."""
        if self.token:
            self.client.get(
                "/api/v1/admin/analytics",
                headers=self.headers,
                name="/api/v1/admin/analytics"
            )
