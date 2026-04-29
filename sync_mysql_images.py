"""
Syncs product image_url and gallery fields from MySQL (old DB)
to PostgreSQL (new DB) for all 80 shoe products.
"""
import os
import sys
import urllib.parse

# ─── MySQL connection (old database) ────────────────────────────────────────
MYSQL_HOST     = 'localhost'
MYSQL_USER     = 'root'
MYSQL_PASSWORD = 'root@123'
MYSQL_DB       = 'laces_and_soles'
MYSQL_PORT     = 3306

# ─── PostgreSQL connection (new database) ───────────────────────────────────
PG_HOST     = 'localhost'
PG_USER     = 'postgres'
PG_PASSWORD = 'root@123'
PG_DB       = 'laces_and_soles'

backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend')
sys.path.append(backend_dir)

from flask import Flask
from dotenv import load_dotenv
load_dotenv(os.path.join(backend_dir, '.env'))
from backend.models import db, Product

# ─── Step 1: Read all image data from MySQL ──────────────────────────────────
print("Connecting to MySQL...")
try:
    import pymysql
    mysql_conn = pymysql.connect(
        host=MYSQL_HOST,
        user=MYSQL_USER,
        password=MYSQL_PASSWORD,
        database=MYSQL_DB,
        port=MYSQL_PORT,
        charset='utf8mb4'
    )
    cursor = mysql_conn.cursor()
    cursor.execute("SELECT id, image_url, gallery FROM products ORDER BY id")
    rows = cursor.fetchall()
    mysql_conn.close()
    print(f"  Read {len(rows)} products from MySQL.")
except Exception as e:
    print(f"  ERROR connecting to MySQL: {e}")
    print("\n  Make sure MySQL/Workbench is running and the 'laces_and_soles' DB exists.")
    exit(1)

# Filter only products that actually have images
images_data = {
    row[0]: {'image_url': row[1], 'gallery': row[2]}
    for row in rows
    if row[1] and str(row[1]).strip()
}
print(f"  Found {len(images_data)} products with images in MySQL.\n")

# ─── Step 2: Update PostgreSQL with those image values ───────────────────────
print("Connecting to PostgreSQL...")
app = Flask(__name__)
encoded_pw = urllib.parse.quote_plus(PG_PASSWORD)
app.config['SQLALCHEMY_DATABASE_URI'] = f'postgresql://{PG_USER}:{encoded_pw}@{PG_HOST}/{PG_DB}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

with app.app_context():
    updated = 0
    skipped = 0

    pg_products = Product.query.order_by(Product.id).all()

    for p in pg_products:
        mysql_img = images_data.get(p.id)

        if not mysql_img:
            print(f"[{p.id:>3}] SKIP -- No MySQL image for: {p.title}")
            skipped += 1
            continue

        img_url = mysql_img['image_url']
        gallery = mysql_img['gallery']

        # Use the MySQL image_url; if gallery is empty, repeat the main image 4x
        p.image_url = img_url
        p.gallery   = gallery if gallery and gallery.strip() else f"{img_url},{img_url},{img_url},{img_url}"

        print(f"[{p.id:>3}] SYNCED -- {p.title}")
        print(f"         image: {img_url[:60]}...")
        updated += 1

        if updated % 10 == 0:
            db.session.commit()
            print(f"\n  [Checkpoint] Committed {updated} products.\n")

    db.session.commit()

print(f"\n========================================")
print(f"  Synced:  {updated} products with MySQL images")
print(f"  Skipped: {skipped} products (no MySQL image)")
print(f"========================================")
