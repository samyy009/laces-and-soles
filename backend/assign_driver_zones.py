"""
assign_driver_zones.py
Assigns random Hubli delivery zone pincodes to driver-role users.
Run: python assign_driver_zones.py
"""
import sys
import os
import random

sys.path.insert(0, os.path.dirname(__file__))

# Hubli area pincodes from hubli_locations.json
HUBLI_ZONES = [
    {"pincode": "580028", "location": "Adaragunchi"},
    {"pincode": "580025", "location": "Amragol"},
    {"pincode": "580024", "location": "Anchatageri"},
    {"pincode": "580023", "location": "Byahatti"},
    {"pincode": "580030", "location": "Gokul"},
    {"pincode": "580023", "location": "Gopankoppa"},
    {"pincode": "580028", "location": "Hubli Bankapur Chowki"},
    {"pincode": "580023", "location": "Hubli Bengeri"},
    {"pincode": "580029", "location": "Hubli Bharat Mill"},
    {"pincode": "580020", "location": "Hubli City"},
    {"pincode": "580031", "location": "Hubli Eng College"},
    {"pincode": "580030", "location": "Hubli Gandhi Nagar"},
    {"pincode": "580020", "location": "Hubli"},
    {"pincode": "580023", "location": "Hubli Keshwapur"},
    {"pincode": "580021", "location": "Hubli KMC"},
    {"pincode": "580028", "location": "Hubli Moorsavirmath"},
    {"pincode": "580025", "location": "Hubli Navanagar"},
    {"pincode": "580024", "location": "Hubli Nekarnagar"},
    {"pincode": "580020", "location": "Hubli Sarafkatta"},
    {"pincode": "580026", "location": "Hubli Tarihal Indl. Estate"},
    {"pincode": "580029", "location": "Hubli Traffic Island"},
    {"pincode": "580030", "location": "Hubli Udyamnagar"},
    {"pincode": "580031", "location": "Hubli Unkal"},
    {"pincode": "580021", "location": "Hubli Vidyanagar"},
    {"pincode": "580032", "location": "Hubli Vijayanagar"},
    {"pincode": "580020", "location": "Hubli Vinobanagar"},
    {"pincode": "580024", "location": "Old Hubli"},
    {"pincode": "580023", "location": "Kusugal"},
    {"pincode": "580023", "location": "Mantur"},
    {"pincode": "580028", "location": "Nulvi"},
]

# Driver range categories
DRIVER_RANGES = ['short', 'mid', 'long']

from app import app
from extensions import db
from models import User

def assign_zones():
    with app.app_context():
        drivers = User.query.filter_by(role='driver').all()

        if not drivers:
            print(f"\nNo drivers found in database.")
            print("   Creating 3 sample drivers with zones...")
            
            from werkzeug.security import generate_password_hash
            sample_drivers = [
                {"full_name": "Ravi Kumar", "email": "driver1@lacesandsoles.in"},
                {"full_name": "Suresh Patil", "email": "driver2@lacesandsoles.in"},
                {"full_name": "Mohan Das", "email": "driver3@lacesandsoles.in"},
            ]
            for d in sample_drivers:
                existing = User.query.filter_by(email=d['email']).first()
                if not existing:
                    u = User(
                        full_name=d['full_name'],
                        email=d['email'],
                        password_hash=generate_password_hash("Driver@123"),
                        role='driver'
                    )
                    db.session.add(u)
            db.session.commit()
            drivers = User.query.filter_by(role='driver').all()

        print(f"\nFound {len(drivers)} driver(s). Assigning random delivery zones...\n")

        for i, driver in enumerate(drivers):
            # Assign 2-4 random non-overlapping zones
            num_zones = random.randint(2, 4)
            chosen = random.sample(HUBLI_ZONES, min(num_zones, len(HUBLI_ZONES)))
            
            # Build comma-separated pincode string
            zones_str = ",".join(z["pincode"] for z in chosen)
            zone_names = ", ".join(f"{z['location']} ({z['pincode']})" for z in chosen)
            
            driver.delivery_zones = zones_str
            driver.driver_range = DRIVER_RANGES[i % len(DRIVER_RANGES)]

            print(f"  Driver: {driver.full_name} (ID: {driver.id})")
            print(f"     Range   : {driver.driver_range}")
            print(f"     Zones   : {zone_names}")
            print(f"     Pincodes: {zones_str}\n")

        db.session.commit()
        print("All driver zones assigned and saved to database!")

if __name__ == '__main__':
    assign_zones()
