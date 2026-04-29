import os
import json
import requests
import time
from duckduckgo_search import DDGS

ASSETS_DIR = "public/assets/products"
os.makedirs(ASSETS_DIR, exist_ok=True)

with open('master_products.json', 'r') as f:
    products = json.load(f)

print(f"Beginning fresh download of REAL shoe images for {len(products)} products...")

def download_image(query, filepath):
    if os.path.exists(filepath):
        return True
    
    print(f"Searching for: {query}")
    try:
        results = DDGS().images(query, max_results=10)
        for res in results:
            img_url = res.get('image')
            if not img_url:
                continue
            
            try:
                response = requests.get(img_url, timeout=5)
                if response.status_code == 200:
                    with open(filepath, 'wb') as f:
                        f.write(response.content)
                    print(f" -> Downloaded: {filepath}")
                    return True
            except:
                continue
    except Exception as e:
        print(f"Search failed for {query}: {e}")
    
    return False

# Download for all 80 products
success_count = 0
for p in products:
    brand = p['brand']
    p_type = p.get('type', 'sneakers')
    p_category = p.get('category', 'men')
    
    query = f"{brand} {p_type} shoe product photography white background high resolution"
    
    filename = p['image'].split('/')[-1]
    filepath = os.path.join(ASSETS_DIR, filename)
    
    if download_image(query, filepath):
        success_count += 1
    
    time.sleep(1) # Be gentle to DDG

print(f"Completed! Downloaded {success_count} / {len(products)} products.")

# Also download placeholder images for missing collections / categories
print("Fixing Home page categories and Anthologies...")
COLLECTIONS_DIR = "public"
collections = [
    {"query": "men footwear fashion editorial", "file": "collection-1.jpg"},
    {"query": "women footwear heels elegant photography", "file": "collection-2.jpg"},
    {"query": "sports running shoes action shot", "file": "collection-3.jpg"},
    {"query": "sneaker collection hypebeast banner", "file": "special-banner.jpg"},
    {"query": "adidas summer sale banner", "file": "cta-1.jpg"},
    {"query": "nike sporty lifestyle dark background", "file": "cta-2.jpg"},
    {"query": "shoe store premium hero banner", "file": "store_hero.png"},
    {"query": "luxury sneaker boutique banner", "file": "hero-banner.png"}
]

for col in collections:
    filepath = os.path.join(COLLECTIONS_DIR, col['file'])
    if os.path.exists(filepath):
         # remove the old ones so we replace the dummy/blank ones
         try:
             os.remove(filepath)
         except:
             pass
    print(f"Replacing {col['file']}...")
    download_image(col['query'], filepath)
    time.sleep(1)

print("All fixes complete!")
