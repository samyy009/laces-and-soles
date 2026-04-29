import os
import json
import urllib.request
import re

API_URL = "https://api.escuelajs.co/api/v1/products/?categoryId=4"  # Category 4 is Shoes
OUT_DIR = r"d:\OneDrive\Desktop\Laces_and_Soles\public\assets\products"
os.makedirs(OUT_DIR, exist_ok=True)

print("Fetching premium images from EscurlaJS API...")
req = urllib.request.Request(API_URL, headers={'User-Agent': 'Mozilla/5.0'})
try:
    res = urllib.request.urlopen(req)
    data = json.loads(res.read().decode('utf-8'))
except Exception as e:
    print(f"Error fetching: {e}")
    exit(1)

downloaded = 0
for product in data:
    if downloaded >= 6:
        break
    
    # Clean the image URL (Platzi API sometimes returns weird formats like '["https://placeimg.com/..."]')
    images = product.get('images', [])
    if not images: continue
    
    url = str(images[0])
    # Extract actual URL if it's trapped in a stringified array
    match = re.search(r'https?://[^\s\"\'\]]+', url)
    if match:
        url = match.group(0)
    
    print(f"Downloading from {url}...")
    try:
        req_img = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        img_res = urllib.request.urlopen(req_img, timeout=10)
        with open(os.path.join(OUT_DIR, f"premium_{downloaded+1}.jpg"), 'wb') as f:
            f.write(img_res.read())
        downloaded += 1
    except Exception as e:
        print(f"Failed to download image {url}: {e}")

print(f"Successfully downloaded {downloaded} premium shoe images.")

# Update CollectionExplore.jsx to use these new images
explore_file = r"d:\OneDrive\Desktop\Laces_and_Soles\src\pages\CollectionExplore.jsx"
with open(explore_file, 'r', encoding='utf-8') as f:
    text = f.read()

text = re.sub(r"banner: '/product-1\.jpg'", "banner: '/assets/products/premium_1.jpg'", text)
text = re.sub(r"banner: '/product-3\.jpg'", "banner: '/assets/products/premium_2.jpg'", text)
text = re.sub(r"banner: '/product-2\.jpg'", "banner: '/assets/products/premium_3.jpg'", text)
text = re.sub(r"banner: '/product-4\.jpg'", "banner: '/assets/products/premium_4.jpg'", text)
text = re.sub(r"banner: '/product-5\.jpg'", "banner: '/assets/products/premium_5.jpg'", text)
text = re.sub(r"banner: '/product-6\.jpg'", "banner: '/assets/products/premium_6.jpg'", text)

with open(explore_file, 'w', encoding='utf-8') as f:
    f.write(text)

# Update Collections.jsx to use these new images
collections_file = r"d:\OneDrive\Desktop\Laces_and_Soles\src\pages\Collections.jsx"
with open(collections_file, 'r', encoding='utf-8') as f:
    text = f.read()

text = re.sub(r"image: '/product-1\.jpg'", "image: '/assets/products/premium_1.jpg'", text)
text = re.sub(r"image: '/product-3\.jpg'", "image: '/assets/products/premium_2.jpg'", text)
text = re.sub(r"image: '/product-2\.jpg'", "image: '/assets/products/premium_3.jpg'", text)
text = re.sub(r"image: '/product-4\.jpg'", "image: '/assets/products/premium_4.jpg'", text)
text = re.sub(r"image: '/product-5\.jpg'", "image: '/assets/products/premium_5.jpg'", text)
text = re.sub(r"image: '/product-6\.jpg'", "image: '/assets/products/premium_6.jpg'", text)

with open(collections_file, 'w', encoding='utf-8') as f:
    f.write(text)

print("Updated JSX routing.")
