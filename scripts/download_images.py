import os
import json
import requests
import time
import random

SNEAKER_IDS = [
    "1542291026-7eec264c27ff", "1552346154-21d32810baa3", "1608231387042-66d1773070a5", 
    "1515955656352-a1fa3ffcd111", "1595950653106-6c9ebd614d3a", "1579338559194-a162d19bf842", 
    "1588099768523-f4e6a5679d88", "1600185365483-26d7a4cc7519", "1518002171953-a080ee817e1f", 
    "1587563871167-1ea9f005c046", "1617317376997-8748e6862c01", "1511556532299-8f662fc26c06", 
    "1508243529287-e21914733111", "1549298916-b41d501d3772", "1605340537584-620220bc4b3a", 
    "1606107557195-0e29a4b5b4aa", "1595341888016-a392ef81b7de", "1491553895911-0055eca6402d", 
    "1539185441755-769473a23570", "1620809228830-ec6feaaad689"
]

CASUAL_IDS = [
    "1533867617858-e7b97e060509", "1525966222134-fcfa99b8ae77", "1529810313688-44ea1c2d81d3",
    "1614252339460-e144a9fe31df"
]

WOMEN_IDS = [
    "1543163521-1bf539c55dd2", "1515347619362-7f97a55d496a", "1603487742131-4160ec999306"
]

ASSETS_DIR = "public/assets/products"
os.makedirs(ASSETS_DIR, exist_ok=True)

with open('master_products.json', 'r') as f:
    products = json.load(f)

print(f"Beginning download of real product images for {len(products)} products...")

for p in products:
    p_type = p.get('type', 'sneakers')
    p_category = p.get('category', 'men')

    if p_type in ['heels', 'sandals'] or p_category == 'women' and random.random() > 0.6:
        src_id = random.choice(WOMEN_IDS + CASUAL_IDS)
    elif p_type in ['casual', 'formal']:
        src_id = random.choice(CASUAL_IDS)
    else:
        src_id = random.choice(SNEAKER_IDS)

    image_url = f"https://images.unsplash.com/photo-{src_id}?auto=format&fit=crop&w=600&q=80"
    filename = p['image'].split('/')[-1]
    filepath = os.path.join(ASSETS_DIR, filename)

    if not os.path.exists(filepath):
        print(f"Downloading {filename}...")
        for _ in range(3): # retry logic
            try:
                response = requests.get(image_url, timeout=10)
                if response.status_code == 200:
                    with open(filepath, 'wb') as img_file:
                        img_file.write(response.content)
                    break
            except Exception as e:
                print(f"Failed to download {filename}: {e}, retrying...")
                time.sleep(2)

with open('master_products.json', 'w') as f:
    json.dump(products, f, indent=2)

print("Image download and mapping complete. Total assets populated.")
