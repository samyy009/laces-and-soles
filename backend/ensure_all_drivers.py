import sys
import os
import random
from werkzeug.security import generate_password_hash

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app
from extensions import db
from models import User
from assign_driver_zones import HUBLI_ZONES, DRIVER_RANGES

def ensure_drivers():
    with app.app_context():
        print("Ensuring all 4 driver accounts exist in the database...")
        
        drivers_to_create = [
            {"full_name": "Ravi Kumar (Driver 1)", "email": "driver1@lacesandsoles.in", "pwd": "Driver@123"},
            {"full_name": "Suresh Patil (Driver 2)", "email": "driver2@lacesandsoles.in", "pwd": "Driver@123"},
            {"full_name": "Mohan Das (Driver 3)", "email": "driver3@lacesandsoles.in", "pwd": "Driver@123"},
            {"full_name": "Flash Speed (Driver)", "email": "driver@laces.com", "pwd": "driver123"}
        ]
        
        for d in drivers_to_create:
            user = User.query.filter_by(email=d['email']).first()
            if not user:
                print(f"Creating driver: {d['full_name']} ({d['email']})")
                user = User()
                user.full_name = d['full_name']
                user.email = d['email']
                user.password_hash = generate_password_hash(d['pwd'])
                user.role = 'driver'
                db.session.add(user)
            else:
                print(f"Driver already exists, updating role/pwd: {d['full_name']}")
                user.role = 'driver'
                user.password_hash = generate_password_hash(d['pwd'])
        
        db.session.commit()
        
        # Now assign zones to all drivers in the system
        all_drivers = User.query.filter_by(role='driver').all()
        print(f"\nAssigning Hubli zones to {len(all_drivers)} drivers...")
        
        for i, driver in enumerate(all_drivers):
            # Assign 3-5 random zones to give them a good coverage
            num_zones = random.randint(3, 5)
            chosen = random.sample(HUBLI_ZONES, min(num_zones, len(HUBLI_ZONES)))
            
            zones_str = ",".join(z["pincode"] for z in chosen)
            zone_names = ", ".join(f"{z['location']} ({z['pincode']})" for z in chosen)
            
            driver.delivery_zones = zones_str
            driver.driver_range = DRIVER_RANGES[i % len(DRIVER_RANGES)]
            
            print(f"  Driver: {driver.full_name}")
            print(f"     Email   : {driver.email}")
            print(f"     Range   : {driver.driver_range}")
            print(f"     Zones   : {zone_names}")
            print(f"     Pincodes: {zones_str}\n")
            
        db.session.commit()
        print("Successfully created and configured all drivers!")

if __name__ == '__main__':
    ensure_drivers()
