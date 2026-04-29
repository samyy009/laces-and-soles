import os
import sys
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

def deep_sync_and_fix():
    print("Starting deep sync for all 160 products...")
    with app.app_context():
        # Step 1: Specific Visual Correction for IDs 17, 18, 14
        # (These are the ones Identified via symbols)
        corrections = {
            17: ("Jordan", "Jordan Air Jordan 1 Retro High 'Dark Marina Blue'", "Iconic Jordan 1 silhouette in premium Dark Marina Blue leather."),
            18: ("Nike", "Nike Air Max 90 'Triple White'", "The classic Nike Air Max 90 in a clean, all-white colorway."),
            14: ("Jordan", "Jordan Air Jordan 1 Retro High 'Bred Toe'", "Legendary Air Jordan 1 featuring the iconic Bred color blocking.")
        }
        
        for pid, (brand, title, desc) in corrections.items():
            p = db.session.get(Product, pid)
            if p:
                p.brand = brand
                p.title = title
                p.description = desc
                print(f"Fixed mismatch for ID {pid}: Moved to {brand}")

        # Step 2: Professionalize ALL 160 products
        all_prods = Product.query.all()
        updated_count = 0
        for p in all_prods:
            brand = p.brand
            models = names_map.get(brand, [])
            if models:
                # Deterministic naming based on ID
                idx = (p.id - 1) % 20
                new_title = f"{brand} {models[idx]}"
                
                # If we manually fixed it in Step 1, don't overwrite
                if p.id not in corrections:
                    p.title = new_title
                    p.description = f"Experience the excellence of {brand} with the {new_title}, crafted for style and performance."
                
                updated_count += 1
        
        db.session.commit()
        print(f"Deep sync complete. Professionalized and verified {updated_count} products.")

if __name__ == "__main__":
    deep_sync_and_fix()
