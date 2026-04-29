from app import app, db, User
from werkzeug.security import generate_password_hash

with app.app_context():
    admin = User.query.filter_by(role='admin').first()
    if not admin:
        print("No admin found. Creating default admin account...")
        new_admin = User(
            full_name="System Administrator",
            email="admin@lacesandsoles.com",
            password_hash=generate_password_hash("admin123"),
            role="admin"
        )
        db.session.add(new_admin)
        db.session.commit()
        print("Default admin created: admin@lacesandsoles.com / admin123")
    else:
        print(f"Admin already exists: {admin.email}")
