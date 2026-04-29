from app import app, db
from models import User
from werkzeug.security import generate_password_hash

with app.app_context():
    u = User.query.filter_by(email='samsam.123samyy@gmail.com').first()
    if u:
        u.password_hash = generate_password_hash('Password123')
        db.session.commit()
        print("User password reset successfully.")
    else:
        print("User not found.")
