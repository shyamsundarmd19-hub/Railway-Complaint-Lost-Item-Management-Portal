# 🚆 RailAlert — Cloud-Based Railway Complaint & Lost Item Management Portal

A full-stack, enterprise-grade railway grievance and lost property recovery platform built with **React.js**, **Tailwind CSS (Pale Green / Mint Sage aesthetic)**, **FastAPI (Python)**, **SQLAlchemy ORM**, **PostgreSQL / SQLite**, **Native AWS S3 Image Vault (SSE-S3 AES256)**, **AWS SES Transactional Notifications**, and **AWS Free Tier Direct Hosting (No Docker)**.

---

## 🌟 Key Features

### Authentication & Role-Based Access Control (RBAC)
- **Master Authentication & Password Security**: User accounts protected by direct Bcrypt password hashing with unique salts.
- **PyJWT Session Authorization**: Stateless, secure Bearer token authentication safeguarding all passenger portals, staff consoles, and API routes.
- **Role-Based Workflows**: Tailored, isolated views and authorization scopes for **Passengers**, **Railway Staff**, and **Administrators**.
- **Instant Demo Login**: One-click instant demo account access on the login page for rapid feature testing and evaluation.

### Passenger Grievance & Lost Property Vault
- **Comprehensive Grievance Lifecycle**: Complete support for filing, tracking, and resolving complaints across Cleanliness, Pantry/Catering, Electrical, Security, and other train coach issues.
- **Direct S3 Vault Photo Evidence**: Secure image uploads leveraging AWS S3 Presigned URLs with Server-Side Encryption (`SSE-S3: AES256`), bypassing server memory overhead.
- **Lost & Found Custody Registry**: Detailed lost personal property logging including train number, coach, berth, station, and distinguishing characteristics.
- **Real-Time Status Tracking**: Live responsive status badges with distinct visual cues:
  - **Resolved / Found / Handed Over**: `bg-emerald-100 text-emerald-800 border-emerald-200`
  - **In Progress / Claim Pending**: `bg-amber-100 text-amber-800 border-amber-200`
  - **Registered / Reported / Pending**: `bg-rose-100 text-rose-800 border-rose-200`

### Railway Staff Operations & Division Dispatch
- **Live Operations Queue**: Multi-criteria filtering toolbar allowing division controllers to filter complaints by train number, coach, category, priority, and current status.
- **Grievance Inspection & Status Modal**: Detailed passenger information view with full AWS S3 photo evidence preview and status mutation controls.
- **Automated SES Resolution Alerts**: Dispatches transactional confirmation emails via Amazon SES directly to the passenger when an issue is marked as **Resolved**.
- **Lost Property Custody Management**: Quick custody status transitions (`reported` &rarr; `found` &rarr; `handed_over`).

### Division Telemetry, Analytics & Cloud Architecture
- **Real-Time Analytics Dashboard**: Visual KPI cards tracking Total Complaints, Resolution Rate %, In-Flight Issues, and Lost Property Restored.
- **Category Breakdown Diagnostics**: Visual progress distribution bars identifying train departments requiring operational reinforcement.
- **Immutable Security Audit Trail**: Comprehensive timestamped audit logging capturing registrations, logins, grievance submissions, and staff status mutations.
- **AWS Free Tier Direct Hosting (No Docker)**: Micro-optimized architecture utilizing Python `venv` + Gunicorn (2 Uvicorn workers) under `systemd` + Nginx reverse proxy with gzip compression and static caching.
- **Enterprise Infrastructure Blueprint**: Complete configurations for EC2 Launch Templates, Application Load Balancers (ALB), Auto Scaling Groups (ASG), and CloudWatch Alarms.
- **High-Concurrency Load Testing**: Python Locust test suite simulating 100 to 1000 simultaneous passengers with automated HTML and CSV telemetry export.

---

## 📂 Project Structure

```text
railway-complaint-cloud/
├── .github/
│   └── workflows/
│       └── deploy.yml                # CI/CD automated SSH deployment pipeline to AWS EC2
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py             # Pydantic environment settings (DB, JWT, AWS S3/SES)
│   │   │   ├── database.py           # SQLAlchemy connection pool optimized for Free Tier
│   │   │   └── security.py           # Direct Bcrypt hashing, PyJWT tokens, and RBAC guard
│   │   ├── models/
│   │   │   ├── user.py               # User authentication & role database model
│   │   │   ├── train.py              # Train routes & schedules database model
│   │   │   ├── complaint.py          # Grievance vault database model
│   │   │   ├── lost_item.py          # Lost property custody database model
│   │   │   ├── audit_log.py          # Security audit trail database model
│   │   │   └── __init__.py           # Unified model exports
│   │   ├── schemas/
│   │   │   └── __init__.py           # Pydantic v2 validation schemas
│   │   ├── routers/
│   │   │   ├── auth.py               # Registration, login & user profile endpoints
│   │   │   ├── trains.py             # Train route listings & auto-seeding
│   │   │   ├── complaints.py         # Grievance CRUD, staff queue & SES alert trigger
│   │   │   ├── lost_items.py         # Lost & found custody endpoints
│   │   │   ├── documents.py          # AWS S3 Presigned URL generator
│   │   │   ├── admin.py              # Division analytics & security audit logs
│   │   │   └── __init__.py           # Router bundle
│   │   ├── services/
│   │   │   ├── s3_service.py         # Boto3 S3 Vault engine with SSE-S3 AES256
│   │   │   ├── ses_service.py        # AWS SES transactional email dispatcher
│   │   │   └── notifications.py      # Grievance resolution alert notification service
│   │   └── main.py                   # FastAPI application factory, CORS & lifespan
│   ├── .env.example                  # Environment variables template
│   └── requirements.txt              # Backend dependencies
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js             # Axios client with Bearer auth interceptor & S3 uploader
│   │   ├── context/
│   │   │   └── AuthContext.jsx       # Global authentication & user role state provider
│   │   ├── components/
│   │   │   ├── Navbar.jsx            # White & emerald header with role-aware navigation
│   │   │   ├── StatusBadge.jsx       # Standardized status badge component
│   │   │   ├── ComplaintModal.jsx    # Photo preview, details & status update modal
│   │   │   └── ProtectedRoute.jsx    # Authentication & RBAC route guard
│   │   ├── pages/
│   │   │   ├── Login.jsx             # Sign in view with demo autofill buttons
│   │   │   ├── Register.jsx          # User registration view with role selection
│   │   │   ├── Dashboard.jsx         # Passenger portal (active grievances & lost items)
│   │   │   ├── FileComplaint.jsx     # Grievance filing with train selector & S3 uploader
│   │   │   ├── ReportLostItem.jsx    # Lost property report form & image attachment
│   │   │   ├── StaffQueue.jsx        # Railway staff operations queue & custody manager
│   │   │   └── Analytics.jsx         # Division analytics dashboard & audit trail
│   │   ├── App.jsx                   # React Router layout & application routing
│   │   ├── index.css                 # Pale Green / Mint Sage design tokens & typography
│   │   └── main.jsx                  # React application entrypoint
│   ├── index.html                    # HTML5 shell with Plus Jakarta Sans typography
│   ├── tailwind.config.js            # Tailwind CSS configuration extending sage & mint colors
│   ├── vite.config.js                # Vite build configuration with /api proxy
│   └── package.json                  # Frontend dependencies & scripts
├── docs/
│   └── AWS_INFRASTRUCTURE_BLUEPRINT.md # Launch Template, ALB, ASG, S3 & IAM policies, CloudWatch
├── scripts/
│   ├── railalert.service             # Systemd service unit for Gunicorn/Uvicorn
│   ├── nginx.conf                    # Nginx reverse proxy & React SPA static hosting
│   ├── setup_ec2.sh                  # 1-click initial provisioning script for Ubuntu EC2
│   └── deploy.sh                     # Zero-downtime native deployment script
├── locustfile.py                     # Performance & load testing script (100 to 1000 users)
├── .gitignore                        # Git ignore rules for virtualenv, database & node_modules
├── LICENSE                           # MIT License
└── README.md                         # Project documentation
```

---

## 💻 Installation & Setup

### Prerequisites
- **Python**: v3.10 or higher installed.
- **Node.js**: v18.0.0 or higher installed.
- **Git**: Installed and configured.

---

### 1. Clone Repository
```bash
git clone https://github.com/shyamsundarmd19-hub/railway-complaint-cloud.git
cd railway-complaint-cloud
```

---

### 2. Backend Setup
Navigate into the `backend/` directory, set up your Python virtual environment, and install dependencies:

```bash
cd backend

# Create and activate virtual environment
python -m venv venv

# On Linux / macOS:
source venv/bin/activate
# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1

# Install backend dependencies
pip install -r requirements.txt
```

---

### 3. Configure Environment Variables
Create a `.env` file in the `backend/` directory (or copy from `.env.example`):

```ini
# Environment
ENVIRONMENT=development
DEBUG=True
SECRET_KEY=railalert-production-secret-change-me-with-openssl-rand-hex-32
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Database (SQLite for zero-config local run, or PostgreSQL RDS)
DATABASE_URL=sqlite:///./railalert.db
# For AWS RDS PostgreSQL:
# DATABASE_URL=postgresql://railalert_user:password@your-rds-endpoint:5432/railalert_db

# CORS Allowed Origins
BACKEND_CORS_ORIGINS=["http://localhost:5173","http://127.0.0.1:5173","http://localhost:3000"]

# AWS Credentials (Optional in local dev - automatic mock fallback enabled)
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET_NAME=railalert-vault-storage
S3_SSE_ALGORITHM=AES256

# AWS SES Transactional Email
AWS_SES_SENDER_EMAIL=no-reply@railalert.internal
```

---

### 4. Database Setup & Automated Seeding
The backend automatically creates all required tables and seeds default train routes upon startup. To populate sample demo passenger, staff, and admin accounts along with active test grievances:

```bash
# Run FastAPI Backend Server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
Interactive Swagger Documentation will be accessible at: **[http://localhost:8000/docs](http://localhost:8000/docs)**

---

### 5. Frontend Setup
In a separate terminal, navigate to the `frontend/` directory, install packages, and launch the Vite development server:

```bash
cd frontend
npm install
npm run dev
```
Open your browser and visit: **[http://localhost:5173](http://localhost:5173)**

---

## 🌐 Live Access & Endpoints

- **Repository URL**: [https://github.com/shyamsundarmd19-hub/railway-complaint-cloud.git](https://github.com/shyamsundarmd19-hub/railway-complaint-cloud.git)
- **Frontend Passenger & Staff Portal**: [http://localhost:5173](http://localhost:5173)
- **Backend API & Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Check Endpoint**: [http://localhost:8000/health](http://localhost:8000/health)

---

## 🔑 Default Accounts & Sample Tracking Data (Created Automatically)

| Role / Entity | Identifier / Email | Default Password | Features Accessible |
| :--- | :--- | :--- | :--- |
| **Passenger** | `passenger@railalert.internal` | `Passenger@123` | File grievances, S3 photo evidence upload, lost property reporting, live status tracking |
| **Railway Staff** | `staff@railalert.internal` | `Staff@123` | Division operations queue, grievance review modal, status mutations, lost property custody, SES triggers |
| **Administrator** | `admin@railalert.internal` | `Admin@123` | Full division telemetry, resolution rates %, category distribution diagnostics, security audit logs |
| **Custom User** | Any valid email | User-defined (6+ chars) | Private passenger profile, isolated grievance records, real-time ticket tracking |
| **Pre-Seeded Data** | Trains: 12002, 12301, 22436, 12951 | Multi-category tickets | Cleanliness, electrical, pantry complaints + S3 encrypted photo samples |

---

## 🔒 Security & Cloud Best Practices Implemented

- **Native AES-256-GCM / SSE-S3 Encryption**: All photo evidence uploaded to the AWS S3 Image Vault is encrypted at rest using Server-Side Encryption (`SSE-S3: AES256`).
- **Direct-to-S3 Presigned URLs**: Files are uploaded directly from the passenger's browser to S3 via pre-authenticated presigned URLs, keeping EC2 memory consumption under 200MB.
- **Bcrypt Password Security**: Master user passwords are salted and hashed with direct Bcrypt routines, ensuring raw credentials are never exposed.
- **PyJWT Role-Based Access Control (RBAC)**: All protected API endpoints validate Bearer tokens and enforce role hierarchies (`passenger`, `railway_staff`, `admin`) with strict HTTP 403 access control.
- **SQL Injection Prevention**: Robust SQLAlchemy ORM parameterized queries across all database operations.
- **TLS 1.2+ Transit Enforcement**: S3 bucket policies reject unencrypted HTTP requests (`aws:SecureTransport: false`), enforcing HTTPS at all levels.
- **Production Hardened Reverse Proxy**: Nginx configuration with gzip compression, security headers (`X-Frame-Options`, `X-Content-Type-Options`, `X-XSS-Protection`), and static asset caching.

---

## ⚡ Performance & Load Testing (Locust)

RailAlert includes a pre-configured Locust load testing suite simulating **100 to 1000 simultaneous passengers and railway staff**:

```bash
# Install Locust
pip install locust

# 1. Interactive Web Dashboard (http://localhost:8089)
locust -f locustfile.py --host http://localhost:8000

# 2. Headless Stress Test (100 Users, Ramp 10/s, 2 min - outputs HTML report)
locust -f locustfile.py --headless -u 100 -r 10 --run-time 2m \
    --host http://localhost:8000 \
    --html report_100_users.html \
    --csv reports/run_100

# 3. Peak Stress Test (500 to 1000 Users)
locust -f locustfile.py --headless -u 500 -r 25 --run-time 5m \
    --host http://localhost:8000 \
    --html report_500_users.html
```

---

## ☁️ AWS EC2 Native Deployment (No Docker)

For production deployment on an AWS Free Tier `t2.micro` or `t3.micro` EC2 instance:

```bash
# 1. Initial 1-Click Provisioning (Installs Nginx, Python3-venv, systemd, creates 2GB swap):
sudo bash scripts/setup_ec2.sh

# 2. Zero-Downtime Native Updates (Pulls git, rebuilds React SPA, restarts service):
bash scripts/deploy.sh
```

See [`docs/AWS_INFRASTRUCTURE_BLUEPRINT.md`](file:///d:/projects/railway%20complient/docs/AWS_INFRASTRUCTURE_BLUEPRINT.md) for complete details on Launch Templates, Application Load Balancers, Auto Scaling Groups, IAM policies, and CloudWatch alarms.

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.
