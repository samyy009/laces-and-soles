from app import app, db
from models import User

with app.app_context():
    u = User.query.filter_by(role='admin').first()
    if u:
        print(f"Admin Email: {u.email}")
    else:
        print("No Admin found")
    
    d = User.query.filter_by(role='driver').first()
    if d:
        print(f"Driver Email: {d.email}")
    else:
        print("No Driver found")

    c = User.query.filter_by(role='user').first()
    if c:
        print(f"Customer Email: {c.email}")
