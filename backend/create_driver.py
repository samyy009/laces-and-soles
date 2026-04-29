from app import app, db, User
from werkzeug.security import generate_password_hash

with app.app_context():
    # Check if driver exists
    email = 'driver@laces.com'
    existing = User.query.filter_by(email=email).first()
    
    if not existing:
        driver = User(
            full_name='Flash Speed',
            email=email,
            password_hash=generate_password_hash('driver123'),
            role='driver'
        )
        db.session.add(driver)
        db.session.commit()
        print(f"Driver account created! Email: {email}, Password: driver123")
    else:
        existing.role = 'driver'
        existing.password_hash = generate_password_hash('driver123')
        db.session.commit()
        print(f"Updated existing user {email} to driver role with password: driver123")
