<div align="center">
  <h1>Laces & Soles 👟</h1>
  <p><strong>A Next-Level Full-Stack E-commerce Platform</strong></p>
  <img src="./public/readme-image.png" alt="Desktop Demo" width="100%"/>
</div>

## 🚀 Project Overview
**Laces & Soles** is a conceptual e-commerce platform designed for sneaker enthusiasts, built as a Final Year Project capable application. 
It features a polished React frontend integrated with a robust Python/Flask and MySQL backend. The platform provides a complete shopping experience including JWT authentication, wishlists, cart persistence, a dynamic product catalog, and a comprehensive admin dashboard with Recharts analytics.

## ✨ Key Features
### 🛒 Customer Experience
- **Smart Filtering & Search**: Filter products by brands (Nike, Adidas, Puma), price ranges, and search queries instantly.
- **Cart & Wishlist Persistence**: Data syncs securely to the database across sessions.
- **Micro-interactions**: Hover effects, beautiful toast notifications, and loading states for a premium feel.
- **Seamless Checkout Flow**: Fully operational frontend UI for shopping tasks.

### 🛡️ Security & Authentication
- **Strong Authentication**: Secure `flask-jwt-extended` flow with cookie/local storage token management.
- **Password Hashing**: `werkzeug.security` implementation ensures secure password storage.
- **Rate Limiting**: Integrated `Flask-Limiter` protects against brute-force login attacks.

### 📊 Admin Control Center
- **Analytics Dashboard**: Visual charts powered by `recharts` for tracking revenue and orders over time.
- **Inventory Management**: Create, view, and delete products easily via UI.
- **User Management**: Monitor registered users and their roles securely.

## 🛠️ Tech Stack
- **Frontend**: React (Vite), Tailwind CSS, Lucide React icons, Axios, Recharts, React-Toastify.
- **Backend**: Python, Flask, Flask-SQLAlchemy, Flask-JWT-Extended, Flask-Limiter.
- **Database**: MySQL.

---

## 💻 Setup & Installation (Local Development)

### 1. Database Setup
1. Create a MySQL database named `laces_and_soles`.
2. Open `backend/schema.sql` and run the script in your MySQL interface (e.g. Workbench) to construct the structure.

### 2. Backend Setup
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a python virtual environment (Optional but Recommended):
   ```bash
   python -m venv venv
   source venv/Scripts/activate 
   # or `venv\Scripts\activate` on Windows
   ```
3. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create the **Environments configuration**: Rename `.env.example` to `.env` and fill in your DB credentials:
   ```env
   DB_USER=root
   DB_PASSWORD=root
   DB_HOST=localhost
   DB_NAME=laces_and_soles
   SECRET_KEY=your_secret_key
   JWT_SECRET_KEY=your_jwt_secret
   ```
5. Run the server:
   ```bash
   python app.py
   ```
   *(The backend runs on `http://localhost:5000`)*

### 3. Frontend Setup
1. Open a new terminal instance and navigate to the root directory.
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *(The frontend runs on `http://localhost:5173`)*

---

## 📦 Deployment Ready
The application has been structured to easily deploy on modern PaaS platforms:
- **Backend**: Ready for Render, Railway, or AWS. Include the `requirements.txt` and map environment variables accordingly. 
- **Frontend**: Ready for Vercel or Netlify via `npm run build`.

## 📄 License
This project is licensed under the MIT License.
