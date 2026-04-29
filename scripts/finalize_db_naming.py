import os
import sys
import json
from dotenv import load_dotenv

load_dotenv('backend/.env')
sys.path.append('backend')

from app import app
from models import db, Product

names_map = {
    "Nike": [
        "Air Force 1 '07", "Air Max 270", "Dunk Low Retro", "Air Max Excee", "Court Vision Low",
        "Air Zoom Pegasus 40", "Blazer Mid '77", "Waffle Debut", "React Vision", "Air Max Pulse",
        "Air Zoom Alphafly", "Metcon 9", "SB Force 58", "Air Max DN", "Revolution 7",
        "Downshifter 12", "P-6000", "Phoenix Waffle", "Court Legacy", "Venture Runner"
    ],
    "Adidas": [
        "Superstar Classic", "Stan Smith", "Ultraboost Light", "NMD_R1 V3", "Gazelle Bold",
        "Samba OG", "Forum Low", "Ozweego", "Continental 80", "Response CL",
        "Adistar 2.0", "Terrex Free Hiker", "Galaxy 6", "Lite Racer 3.0", "Questar",
        "Duramo Speed", "Adilette 22", "Pureboost 22", "X_PLR Phase", "Retropy E5"
    ],
    "Jordan": [
        "Air Jordan 1 Retro High", "Air Jordan 4 Craft", "Jordan Stay Loyal 2", "Jordan Max Aura 5", "Air Jordan 1 Zoom CMFT",
        "Jordan Stadium 90", "Air Jordan 6 Retro", "Jordan Westbrook One Take", "Delta 3 Low", "Jordan Sophia",
        "Jumpman Two 3", "Jordan Series ES", "Luka 2", "Zion 3", "Tatum 1",
        "Jordan Nu Retro 1", "Air Jordan 1 Mid", "Air Jordan 1 Low G", "Jordan Granville Pro", "Jordan System.23"
    ],
    "Puma": [
        "Suede Classic", "RS-X Efekt", "Cali Dream", "Future Rider", "Smash v2",
        "Softride Enzo", "Velocity Nitro 2", "Mayze Stack", "Palermo OG", "Morphic",
        "All-Pro NITRO", "Slipstream", "Deviate Nitro", "CA Pro Classic", "Trinity",
        "Rebound LayUp", "X-Ray Speed", "Jada Renew", "Carina Street", "Pwrframe"
    ],
    "Reebok": [
        "Club C 85", "Classic Leather", "Nano X3", "Instapump Fury", "Floatride Energy 5",
        "Zig Kinetica 3", "BB 4000 II", "Glide Ripple", "Court Advance", "LPC Classic",
        "Question Mid", "Workout Plus", "Aztrek 96", "NPC II", "Royal Glide",
        "Vector Runner", "Flexagon Force", "Energylux 2.0", "Liquifect 180", "Nano X2"
    ],
    "Asics": [
        "Gel-Kayano 30", "Gel-Nimbus 25", "GT-2000 12", "Novablast 4", "Gel-Lyte III",
        "Gel-Quantum 360", "Magic Speed 3", "MetaSpeed Sky", "Excite 10", "Pulse 14",
        "Gel-Resolution 9", "Solution Speed FF", "Tiger Runner 2", "Japan S", "Lyte Classic",
        "Gel-Contend 8", "Jolt 4", "Gel-Pique", "Hyper Speed 3", "Dynablast 3"
    ],
    "New Balance": [
        "574 Core", "327 Lifestyle", "990v6 Made in USA", "2002R Protection Pack", "550 Basketball",
        "1906R Cordura", "Fresh Foam 1080v13", "FuelCell Rebel v4", "480 Low", "610v1",
        "Hierro v7", "More v4", "Ving Low", "CT302", "XC-72",
        "9060 Cherry Blossom", "530 White Silver", "880v13", "608v5", "410v7"
    ],
    "Under Armour": [
        "HOVR Phantom 3", "Curry 10", "Charged Pursuit 3", "UA Flow Velociti", "Project Rock 5",
        "Infinite Pro", "Sonic 6", "Machina 3", "Apparition", "Slipspeed",
        "Tribase Reign 5", "Charged Assert 10", "Micro G Kilchis", "Fov Low", "Spawn 5",
        "Jet '23", "Heat Seeker", "Lockdown 6", "BGS Curry", "UA Forge"
    ]
}

def finalize_naming():
    with app.app_context():
        # Correct Brand Mismatch for ID 14 specifically (already done in content.json but good to be sure in DB)
        p14 = db.session.get(Product, 14)
        if p14:
            p14.brand = 'Jordan'
            p14.title = 'Jordan Air Jordan 1 Mid GS'
            p14.description = "Iconic style meets legendary comfort. The Air Jordan 1 Mid GS brings the original spirit of 1985 to a new generation."

        # Fetch all products that still have 'Edition' in their name
        edition_prods = Product.query.filter(Product.title.like('%Edition%')).all()
        print(f"Found {len(edition_prods)} products to professionalize.")
        
        counter = 0
        for p in edition_prods:
            brand = p.brand
            models = names_map.get(brand, [])
            if models:
                # Use a pseudo-random index based on ID to pick a name
                idx = (p.id) % len(models)
                new_title = f"{brand} {models[idx]}"
                p.title = new_title
                p.description = f"Experience the pinnacle of {brand} craftsmanship with the {new_title}. Designed for style, engineered for performance."
                counter += 1
        
        db.session.commit()
        print(f"Successfully professionalized {counter} Database records.")

if __name__ == "__main__":
    finalize_naming()
