# RailAlert — Cloud-Based Railway Complaint & Lost Item Management Portal

An enterprise-grade, cloud-native railway grievance and lost property recovery portal optimized specifically for **AWS Free Tier (No Docker direct-host architecture)**.

---

## 🏛️ System Architecture

- **UI Theme & Design System**: Light Pale Green / Sage Mint aesthetic (`bg-emerald-50/40`, emerald-600 primary, soft green cards)
- **Frontend SPA**: React.js with Tailwind CSS, Axios, Lucide-react
- **Backend API**: Python FastAPI with SQLAlchemy ORM, Pydantic v2, PyJWT, Passlib (bcrypt), and Boto3
- **Direct Hosting (No Docker)**:
  - Python 3.10+ Virtualenv (`venv`)
  - Gunicorn process manager with 2 Uvicorn workers (`systemd`)
  - Nginx reverse proxy serving static React files on port 80 & proxying `/api/` to port 8000
- **Database**: PostgreSQL (AWS RDS `db.t3.micro` or local PostgreSQL)
- **Cloud Storage**: AWS S3 Image Vault with Server-Side Encryption (`SSE-S3: AES256`)
- **Email Notifications**: AWS Simple Email Service (SES) for grievance confirmations
- **CI/CD Pipeline**: GitHub Actions with SSH-based automated deployment

---

## 📂 Project Structure

```text
railalert/
├── .github/
│   └── workflows/
│       └── deploy.yml            # CI/CD Automated SSH deployment pipeline
├── frontend/                     # React SPA (Tailwind CSS, Sage/Pale Green Theme)
│   ├── src/
│   │   ├── api/client.js         # Axios with Bearer token interceptor & S3 presigned uploader
│   │   ├── context/AuthContext   # Global Auth & Role state
│   │   ├── components/           # Navbar, StatusBadge, ComplaintModal, ProtectedRoute
│   │   └── pages/                # Login, Register, Dashboard, FileComplaint, StaffQueue, Analytics
│   ├── tailwind.config.js        # Pale Green / Mint Sage design system tokens
│   └── package.json
├── backend/                      # FastAPI Backend
│   ├── app/
│   │   ├── core/                 # Config, Database engine, JWT & Passlib security, RBAC
│   │   ├── models/               # SQLAlchemy ORM (User, Train, Complaint, LostItem, AuditLog)
│   │   ├── schemas/              # Pydantic v2 request/response schemas
│   │   ├── routers/              # API Endpoints (auth, trains, complaints, lost_items, documents, admin)
│   │   ├── services/             # Cloud Integrations (S3 Vault, SES Email, Notifications)
│   │   └── main.py               # Application factory & CORS
│   ├── .env.example              # Environment variables template
│   └── requirements.txt          # Python dependencies
├── docs/
│   └── AWS_INFRASTRUCTURE_BLUEPRINT.md  # Launch Template, ALB, ASG, S3 & IAM policies, CloudWatch alarms
├── scripts/                      # Deployment automation
│   ├── railalert.service         # Systemd service unit for Gunicorn/Uvicorn
│   ├── nginx.conf                # Nginx reverse proxy & static SPA config
│   ├── setup_ec2.sh              # 1-click initial provisioning script for Ubuntu EC2
│   └── deploy.sh                 # Zero-downtime native deployment script
├── locustfile.py                 # Load testing script (100 to 1000 concurrent passengers)
└── README.md
```

---

## ⚙️ AWS Free Tier Cost Optimization Guide

| Component | AWS Resource | Free Tier Allowance | Optimization Strategy |
| :--- | :--- | :--- | :--- |
| **Compute** | EC2 `t2.micro` or `t3.micro` | 750 hrs/month | Direct hosting with Gunicorn 2-worker pool + 2GB swap file to prevent OOM without Docker overhead |
| **Reverse Proxy** | Nginx | Included on EC2 | Gzip compression enabled; static asset caching (30 days) to minimize bandwidth |
| **Database** | RDS PostgreSQL `db.t3.micro` / `db.t4g.micro` | 750 hrs/month + 20GB SSD | SQLAlchemy connection pool restricted (`pool_size=5`, `max_overflow=10`) |
| **Image Vault** | AWS S3 | 5 GB Standard Storage + 20,000 GETs | Client uploads images directly to S3 with `AES256` SSE-S3 via Presigned URLs |
| **Alerts** | AWS SES | 62,000 emails/month | Free tier when dispatched directly from an EC2 instance |

---

## 🚀 Quick Start (Local Development)

### 1. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env

# Run FastAPI development server
uvicorn app.main:app --reload --port 8000
```

FastAPI Interactive Swagger Docs: `http://localhost:8000/docs`

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend application runs at `http://localhost:5173`.

---

## ⚡ Load & Stress Testing (Locust)

Simulate 100 to 1000 concurrent passengers and railway staff:

```bash
pip install locust

# Headless load test generating HTML performance report
locust -f locustfile.py --headless -u 100 -r 10 --run-time 2m \
    --host http://localhost:8000 \
    --html report_100_users.html
```

---

## ☁️ EC2 Production Deployment

See [`docs/AWS_INFRASTRUCTURE_BLUEPRINT.md`](file:///d:/projects/railway%20complient/docs/AWS_INFRASTRUCTURE_BLUEPRINT.md) for full Launch Template, ALB, ASG, S3 Bucket Policies, IAM Least Privilege, and CloudWatch Alarms.
