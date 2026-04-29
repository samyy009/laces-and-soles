from app import app, db
from models import User

with app.app_context():
    user = User.query.filter_by(email='sameer.sam@gmail.com').first()
    if user:
        user.role = 'admin'
        db.session.commit()
        print(f"User {user.email} promoted to ADMIN successfully.")
    else:
        print("User not found.")
