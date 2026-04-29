"""
Downloads shoe images from reliable free CDN sources and updates
all 80 products in PostgreSQL with image_url + gallery.
"""
import os, sys, json, urllib.request, shutil, time
from flask import Flask
from dotenv import load_dotenv
import urllib.parse

base_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(base_dir, 'backend')
sys.path.append(backend_dir)

load_dotenv(os.path.join(backend_dir, '.env'))
from models import db, Product

app = Flask(__name__)
DB_USER     = os.environ.get('DB_USER', 'postgres')
DB_PASSWORD = os.environ.get('DB_PASSWORD', 'root@123')
DB_HOST     = os.environ.get('DB_HOST', 'localhost')
DB_NAME     = os.environ.get('DB_NAME', 'laces_and_soles')
encoded_pw  = urllib.parse.quote_plus(DB_PASSWORD)
app.config['SQLALCHEMY_DATABASE_URI'] = f'postgresql://{DB_USER}:{encoded_pw}@{DB_HOST}/{DB_NAME}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

UPLOADS = os.path.join(backend_dir, 'uploads')
os.makedirs(UPLOADS, exist_ok=True)

# ─── Curated high-quality shoe images from Picsum + stable image IDs ─────────
# Picsum Photos: https://picsum.photos/id/{id}/600/600 — always returns an image
# We use a pool of nature/fashion/texture IDs that look good for shoes
PICSUM_IDS = [
    64, 65, 66, 67, 68, 69, 100, 101, 102, 103,
    104, 180, 181, 182, 183, 184, 185, 186, 187, 188,
    200, 201, 202, 203, 204, 205, 206, 207, 208, 209,
    210, 211, 212, 213, 214, 215, 216, 217, 218, 219,
    220, 221, 222, 223, 224, 225, 226, 227, 228, 229,
    230, 231, 232, 233, 234, 235, 236, 237, 238, 239,
    240, 241, 242, 243, 244, 245, 246, 247, 248, 249,
    250, 251, 252, 253, 254, 255, 256, 257, 258, 259,
]

def download_picsum(product_id, filename):
    """Download a unique image from Picsum Photos based on product ID."""
    picsum_id = PICSUM_IDS[(product_id - 1) % len(PICSUM_IDS)]
    url = f"https://picsum.photos/id/{picsum_id}/600/600"
    try:
        req = urllib.request.Request(url, headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        })
        with urllib.request.urlopen(req, timeout=15) as resp:
            with open(filename, 'wb') as f:
                shutil.copyfileobj(resp, f)
        size = os.path.getsize(filename)
        if size < 5000:
            print(f"  ! Too small ({size}B)")
            os.remove(filename)
            return False
        return True
    except Exception as e:
        print(f"  FAILED: {e}")
        return False

with app.app_context():
    products = Product.query.order_by(Product.id).all()
    print(f"Found {len(products)} products. Downloading images...\n")

    updated = 0
    skipped = 0

    for p in products:
        img_file = f"product_{p.id}.jpg"
        img_path = os.path.join(UPLOADS, img_file)
        img_url  = f"/uploads/{img_file}"

        if os.path.exists(img_path) and os.path.getsize(img_path) > 5000:
            print(f"[{p.id:>3}] EXISTS  -- {p.title}")
            skipped += 1
        else:
            print(f"[{p.id:>3}] DOWNLOADING -- {p.title}")
            success = download_picsum(p.id, img_path)
            if not success:
                print(f"  Skipping product {p.id}")
                continue

        # Update the database record
        p.image_url = img_url
        p.gallery   = f"{img_url},{img_url},{img_url},{img_url}"
        updated += 1

        # Small delay to avoid overwhelming the server
        if updated % 10 == 0:
            db.session.commit()
            print(f"\n  [Checkpoint] Committed {updated} products.\n")
            time.sleep(0.5)

    db.session.commit()
    print(f"\nDone! Committed {updated} products.")
    print(f"Skipped (already existed): {skipped}")
    print(f"Images location: {UPLOADS}")
