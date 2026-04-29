from app import app, db
from models import User
from werkzeug.security import generate_password_hash

with app.app_context():
    u = User.query.filter_by(email='admin@laces.com').first()
    if u:
        u.password_hash = generate_password_hash('Admin@123')
        db.session.commit()
        print("Admin password reset successfully.")
    else:
        print("Admin not found.")
