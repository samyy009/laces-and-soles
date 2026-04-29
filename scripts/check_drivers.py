from backend.app import app, db
from backend.models import User

with app.app_context():
    drivers = User.query.filter_by(role='driver').all()
    for d in drivers:
        print(f"Driver: {d.full_name}, Zones: {d.delivery_zones}")
