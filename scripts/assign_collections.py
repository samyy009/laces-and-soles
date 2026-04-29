"""
Reassigns products to collections with one brand per collection
so each anthology shows ONLY that brand's unique images.

Collection → Brand mapping (1:1):
  urban-explorer   → Nike        (10 products)
  performance-pro  → Adidas      (10 products)
  vintage-luxe     → Reebok      (10 products)
  summer-breeze    → Puma        (10 products)
  winter-shield    → Asics       (10 products)
  junior-series    → Jordan      (10 products)
  
Remaining brands (New Balance, Under Armour) get distributed
to the closest matching collection.
"""
import pymysql

conn = pymysql.connect(
    host='localhost',
    user='root',
    password='root@123',
    database='laces_and_soles',
    charset='utf8mb4'
)
cursor = conn.cursor()

# Strict 1:1 brand → collection mapping
BRAND_COLLECTION_MAP = {
    'nike':          'urban-explorer',
    'adidas':        'performance-pro',
    'reebok':        'vintage-luxe',
    'puma':          'summer-breeze',
    'asics':         'winter-shield',
    'new balance':   'winter-shield',   # secondary in winter-shield
    'jordan':        'junior-series',
    'converse':      'junior-series',   # secondary in junior-series
    'vans':          'junior-series',   # secondary in junior-series
    'under armour':  'performance-pro', # secondary in performance-pro
}

cursor.execute("SELECT id, brand FROM products")
products = cursor.fetchall()
print(f"Found {len(products)} products.")

assigned = {}
for (pid, brand) in products:
    brand_key = (brand or '').lower().strip()
    collection = BRAND_COLLECTION_MAP.get(brand_key, 'junior-series')
    cursor.execute("UPDATE products SET collection=%s WHERE id=%s", (collection, pid))
    assigned[collection] = assigned.get(collection, 0) + 1

conn.commit()

print("Collection breakdown after reassignment:")
for coll, count in sorted(assigned.items()):
    print(f"  {coll}: {count} products")

# Also update the image_url for New Balance — fix the filename prefix
cursor.execute("SELECT id, image_url FROM products WHERE brand LIKE '%New Balance%'")
nb_products = cursor.fetchall()
print(f"\nNew Balance products: {len(nb_products)}")
for pid, img in nb_products[:3]:
    print(f"  id={pid}, image={img}")

cursor.close()
conn.close()
print("\nDone!")
