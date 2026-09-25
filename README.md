# LabTrack — Lab Equipment Reservation & Management System

A full-stack web application for managing lab equipment reservations.

**Stack:** Django REST Framework · React.js + Vite · MySQL · JWT Auth · Tailwind CSS

---

## Quick Start

### Prerequisites

| Tool    | Minimum version |
|---------|----------------|
| Python  | 3.10+           |
| Node.js | 18+             |
| MySQL   | 8.0+            |

---

## 1 · Database Setup

Create the database in MySQL:

```sql
CREATE DATABASE labtrack_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

---

## 2 · Backend Setup

```bash
cd backend

# 1. Create and activate a virtual environment
python -m venv venv

# Windows:
venv\Scripts\activate
# macOS / Linux:
source venv/bin/activate

# 2. Install Python dependencies
pip install -r requirements.txt

# 3. Configure the database
#    Open backend/labtrack/settings.py and update the DATABASES block:
#
#    DATABASES = {
#        'default': {
#            'ENGINE': 'django.db.backends.mysql',
#            'NAME': 'labtrack_db',      ← your DB name
#            'USER': 'root',             ← your MySQL user
#            'PASSWORD': 'yourpassword', ← your MySQL password
#            'HOST': 'localhost',
#            'PORT': '3306',
#        }
#    }

# 4. Run migrations
python manage.py makemigrations api
python manage.py migrate

# 5. Seed sample data (creates admin + testuser + 5 equipment items)
python manage.py seed_data

# 6. Start the Django development server
python manage.py runserver
```

- **API base URL:** http://localhost:8000/api/
- **Django Admin:** http://localhost:8000/admin/

---

## 3 · Frontend Setup

```bash
cd frontend

# 1. Install Node dependencies
npm install

# 2. Start the Vite dev server
npm run dev
```

- **Frontend URL:** http://localhost:5173

> The Vite dev server automatically proxies `/api/*` requests to `localhost:8000`, so no extra CORS configuration is needed during development.

---

## Demo Credentials

| Role          | Username   | Password    |
|---------------|------------|-------------|
| Administrator | `admin`    | `Admin@123` |
| Lab User      | `testuser` | `User@123`  |

---

## Project Structure

```
LabTech/
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── labtrack/
│   │   ├── settings.py          # DB, JWT, CORS config
│   │   └── urls.py              # Root URL routing
│   └── api/
│       ├── models.py            # CustomUser, Equipment, Reservation
│       ├── serializers.py       # DRF serializers + conflict-checking
│       ├── views.py             # Auth, Equipment, Reservation views
│       ├── permissions.py       # IsAdmin, IsAdminOrReadOnly
│       ├── urls.py              # /api/* URL patterns
│       ├── admin.py             # Django admin configuration
│       └── management/commands/
│           └── seed_data.py     # Demo data seeder
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── App.jsx              # Router + route definitions
        ├── main.jsx             # React entry point
        ├── index.css            # Global Tailwind styles
        ├── api/
        │   └── axios.js         # Axios client + JWT interceptors
        ├── context/
        │   └── AuthContext.jsx  # Auth state + login/logout
        ├── components/
        │   ├── Navbar.jsx
        │   ├── ProtectedRoute.jsx
        │   └── StatusBadge.jsx
        └── pages/
            ├── Login.jsx
            ├── Signup.jsx
            ├── UserDashboard.jsx
            ├── MyReservations.jsx
            ├── ReserveEquipment.jsx
            └── AdminDashboard.jsx
```

---

## API Reference

### Auth

| Method | Endpoint            | Auth | Description            |
|--------|---------------------|------|------------------------|
| POST   | `/api/auth/signup/` | No   | Register a new user    |
| POST   | `/api/auth/login/`  | No   | Obtain JWT token pair  |
| POST   | `/api/auth/refresh/`| No   | Refresh access token   |
| GET    | `/api/auth/me/`     | Yes  | Get current user info  |

### Equipment

| Method | Endpoint                           | Role  | Description              |
|--------|------------------------------------|-------|--------------------------|
| GET    | `/api/equipment/`                  | Any   | List all equipment       |
| POST   | `/api/equipment/`                  | Admin | Create equipment         |
| GET    | `/api/equipment/{id}/`             | Any   | Get single equipment     |
| PUT    | `/api/equipment/{id}/`             | Admin | Update equipment         |
| DELETE | `/api/equipment/{id}/`             | Admin | Delete equipment         |
| PATCH  | `/api/equipment/{id}/update_status/` | Admin | Change status only    |

### Reservations

| Method | Endpoint                        | Role            | Description                  |
|--------|---------------------------------|-----------------|------------------------------|
| GET    | `/api/reservations/`            | Admin: all, User: own | List reservations      |
| POST   | `/api/reservations/`            | Any             | Create (conflict-checked)    |
| GET    | `/api/reservations/{id}/`       | Any             | Get single reservation       |
| PATCH  | `/api/reservations/{id}/cancel/`| Any             | Cancel a reservation         |

---

## Key Features

- **JWT Authentication** — 24-hour access tokens with 7-day refresh, auto-rotated
- **Role-based Access Control** — Admin vs Lab User enforced on both backend and frontend
- **Conflict-checking** — Overlapping reservations for the same equipment are rejected using a proper time-range overlap check (`A.start < B.end AND B.start < A.end`)
- **Live Status Updates** — Reservation statuses auto-advance (pending → active → completed) on each API call
- **Admin CRUD** — Add, edit, delete equipment; cancel any reservation; update equipment status inline
- **Responsive UI** — Tailwind CSS dark-mode design, mobile-friendly with collapsible navbar

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `mysqlclient` install fails on Windows | Install from wheel: `pip install mysqlclient --find-links https://github.com/cgohlke/mysqlclient-windows/releases` |
| `Access denied for user 'root'@'localhost'` | Check MySQL credentials in `settings.py` |
| Frontend shows CORS error | Make sure Django server is running on port 8000 and Vite proxy is configured |
| `python manage.py migrate` fails | Verify the `labtrack_db` database exists in MySQL |

## LabTrack V3 — Experiment Registry

V3 adds a complete experiment workflow while preserving the existing authentication, equipment, and reservation behavior.

### Experiment capabilities
- Any authenticated lab user can register a new experiment.
- Experiment cards expand to show the full description, outcome/findings, linked equipment, timeline, record ID, and attached research file.
- PDF and TXT experiment files can be uploaded (maximum 10 MB per file).
- Equipment can be linked to an experiment from the available equipment catalogue.
- Administrators have full experiment authority from the Admin Dashboard: create, edit, and delete.
- Existing Django admin experiment management includes the new fields as well.

### V3 backend setup
After replacing the project with V3, run the new migration before starting the backend:

```bash
cd backend
python manage.py migrate
python manage.py runserver
```

Uploaded experiment files are stored under `backend/media/experiment_files/` during development.

### Frontend

```bash
cd frontend
npm install
npm run dev
```
