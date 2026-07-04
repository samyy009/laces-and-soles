<div align="center">
  <h1>Laces & Soles 👟</h1>
  <p><strong>A Next-Level Full-Stack Sneaker E-Commerce & Last-Mile Logistics Orchestration Platform</strong></p>
</div>

## 🚀 Project Overview
**Laces & Soles** is a full-stack e-commerce and last-mile logistics tracking platform designed for the premium sneaker market. The platform separates the user storefront from the backend API services and databases to achieve fast loading speeds and better security.

It integrates three distinct user interfaces:
1. **Customer Storefront**: Real-time inventory browsing, custom color modifications in the Design Lab, shopping cart merges, Razorpay checkout verification, and WebSockets-based delivery route maps.
2. **Driver Logistics Dashboard**: Assignment queue queues, status management (Packed → Out for Delivery → Delivered), real-time coordinate streaming, and doorstep OTP verification.
3. **Admin Control Panel**: Real-time sales trend graphs powered by Recharts, inventory controls (CRUD), user role updates, and system logs.

---

## ✨ Technical Stack
* **Frontend**: React 18 (Vite 6), Tailwind CSS v4, Lucide Icons, Axios, Leaflet.js maps, Recharts graphs.
* **Backend**: Python 3.10+, Flask 2.2+, Flask-SQLAlchemy, Flask-JWT-Extended, Flask-Limiter, Flask-SocketIO (Eventlet WSGI).
* **Database**: PostgreSQL (Neon serverless instance for cloud database storage).
* **External APIs**: Razorpay API (payment sandbox checkout), Brevo SMTP API (transactional delivery OTP email notifications).

---

## 💻 Local Installation & Setup

### 1. Database Configuration
1. Install and run **PostgreSQL** locally (or create a free serverless database instance on [Neon.tech](https://neon.tech)).
2. Create a database named `laces_and_soles`:
   ```sql
   CREATE DATABASE laces_and_soles;
   ```

### 2. Backend Setup
1. Open a terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Create and activate a python virtual environment:
   ```bash
   python -m venv venv
   source venv/Scripts/activate # Windows: venv\Scripts\activate
   ```
3. Install package dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file in the backend root directory using the credentials below:
   ```env
   DATABASE_URL=postgresql://postgres:<password>@localhost:5432/laces_and_soles
   SECRET_KEY=your_secret_key
   JWT_SECRET_KEY=your_jwt_secret
   BREVO_API_KEY=your_brevo_api_key
   ```
5. Initialize the database schema and populate initial catalog products:
   ```bash
   python pg_init.py
   python seed_db.py
   ```
6. Start the development API server:
   ```bash
   python app.py
   ```
   *(The backend API service runs on `http://localhost:5000`)*

### 3. Frontend Storefront Setup
1. Open a new terminal instance and navigate to the root directory.
2. Install package dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *(The frontend interface runs on `http://localhost:5173`)*

---

## 🛡️ Security Features
* **Rate Limiting**: Enforced via Flask-Limiter to defend authentication pages from brute-force attempts.
* **Password Hashing**: Passwords are hashed using Werkzeug's security libraries before database writes.
* **Role-Based JWTs**: Tokens contain user roles, which are validated on backend routes to protect driver and admin dashboards.
* **SQL Injection Prevention**: Parameterized queries via the SQLAlchemy ORM block database injection vulnerabilities.

---

## 📦 Deployment Guide

### 1. Backend Web Service (Render.com)
1. Create a **Web Service** on Render and link your project repository.
2. Set the build command: `pip install -r requirements.txt`.
3. Set the start command:
   ```bash
   gunicorn --bind 0.0.0.0:$PORT app:app --worker-class eventlet -w 1
   ```
4. Add environment variables: `DATABASE_URL`, `SECRET_KEY`, `JWT_SECRET_KEY`, `BREVO_API_KEY`.

### 2. Database Instance (Neon.tech)
1. Register on Neon.tech and create a free serverless PostgreSQL database.
2. Copy the database connection string and save it as `DATABASE_URL` in your Render configuration.

### 3. Frontend App (Firebase Hosting)
1. Compile the React codebase into static assets:
   ```bash
   npm run build
   ```
2. Deployed the compiled `dist/` folder using:
   ```bash
   npx firebase-tools deploy
   ```
3. Custom routing rules are pre-configured in `firebase.json` to handle React Router client side routing.

---

## 📄 License
This project is licensed under the MIT License. Refer to the `LICENSE` file for details.
