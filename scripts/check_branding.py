import json

with open('d:/OneDrive/Desktop/Laces_and_Soles/src/content.json', 'r') as f:
    data = json.load(f)
    items = data.get('products', {}).get('items', [])
    
mismatches = []
brands = ['Nike', 'Adidas', 'Puma', 'Jordan', 'Reebok', 'Asics', 'New Balance', 'Under Armour']

for it in items:
    actual_brand = it['brand']
    desc = it.get('description', '').lower()
    title = it.get('title', '').lower()
    img = it.get('image', '').lower()
    
    # Check if a different brand name is mentioned in title or description
    for b in brands:
        if b.lower() in desc or b.lower() in title or b.lower() in img:
            if b.lower() != actual_brand.lower():
                # Allow Jordan/Nike overlap
                if b.lower() == 'nike' and actual_brand.lower() == 'jordan':
                    continue
                if b.lower() == 'jordan' and actual_brand.lower() == 'nike':
                    continue
                    
                mismatches.append({
                    "id": it['id'],
                    "actual_brand": actual_brand,
                    "detected_brand": b,
                    "title": it['title'],
                    "image": it['image']
                })
                break

for m in mismatches:
    print(f"ID: {m['id']} | Brand: {m['actual_brand']} | Detected: {m['detected_brand']} | Title: {m['title']} | Image: {m['image']}")

print(f"\nTotal potential mismatches: {len(mismatches)}")
