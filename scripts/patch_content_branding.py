import json

CONTENT_PATH = 'd:/OneDrive/Desktop/Laces_and_Soles/src/content.json'

with open(CONTENT_PATH, 'r', encoding='utf-8') as f:
    data = json.load(f)
    items = data.get('products', {}).get('items', [])

# Fix IDs 17, 18, 19
fixes = {
    17: {
        "brand": "Jordan",
        "title": "Jordan Air Jordan 1 Retro High 'Dark Marina Blue'",
        "description": "The legend continues. The AJ1 Retro High 'Dark Marina Blue' delivers heritage style with a premium leather upper and iconic wings logo."
    },
    18: {
        "brand": "Nike",
        "title": "Nike Air Max 90 'Triple White'",
        "description": "Nothing as fly, nothing as comfortable, nothing as proven. The Nike Air Max 90 stays true to its OG running roots with the iconic Waffle sole."
    },
    19: {
        "brand": "Adidas",
        "title": "Adidas Ultraboost 1.0 'Core Black'",
        "description": "From a Sunday run to a walk in the park, these adidas Ultraboost 1.0 shoes are designed to keep you comfortable. The Primeknit upper gently hugs your feet."
    }
}

for item in items:
    if item['id'] in fixes:
        f = fixes[item['id']]
        item['brand'] = f['brand']
        item['title'] = f['title']
        item['description'] = f['description']

with open(CONTENT_PATH, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2)

print("Successfully corrected specific branding mismatches for IDs 17, 18, 19.")
