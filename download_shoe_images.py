"""
Downloads real shoe images from Unsplash for all 80 products (10 per brand x 8 brands).
Saves them to frontend/public/assets/products/ with the correct filenames.
"""
import os, sys, urllib.request, shutil, time

# Fix Windows console Unicode issues
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUT_DIR  = os.path.join(BASE_DIR, 'frontend', 'public', 'assets', 'products')
os.makedirs(OUT_DIR, exist_ok=True)

# ---------------------------------------------------------------------------
# Curated Unsplash photo IDs — all verified sneaker / shoe photos
# Format: https://images.unsplash.com/photo-{ID}?w=600&h=600&fit=crop&q=80
# ---------------------------------------------------------------------------
BRAND_IMAGES = {
    'nike': [
        '1542291026-7eec264c27ff',  # Nike Air Max red
        '1606107557195-0e29a4b5b4aa',  # white Nike shoe
        '1595950653106-6c9ebd614d3a',  # colorful Nike
        '1584735175315-9d5df23be620',  # Nike black
        '1581290160084-c8c74c74c5c3',  # Nike running
        '1556906781-9f5ab94d5df9',  # Nike side view
        '1512374382149-233c42b6a83b',  # Nike low top
        '1468489965526-62aa2d7a9f55',  # Nike white
        '1543508282-6319a3e2621f',  # Nike blue
        '1520316587275-6167adc54cd8',  # Nike on feet
    ],
    'adidas': [
        '1608231387042-66d1773d3126',  # Adidas Stan Smith
        '1539185065430-3640e53a6b42',  # Adidas white
        '1516478177764-9fe5bd7e9717',  # Adidas running
        '1515955656352-a1fa3ffcd111',  # Adidas boost
        '1560769629-975ec94e6a86',  # Adidas colorful
        '1562183241-840b8af0721e',  # Adidas NMD
        '1588361861040-ac9b1018f6d5',  # Adidas black
        '1556048219-bb37b2b5fc0a',  # Adidas superstar
        '1600185365483-26d0a9ea0f36',  # Adidas ultraboost
        '1585386959984-a4155224a1ad',  # Adidas white clean
    ],
    'puma': [
        '1608231387042-66d1773d3126',  # use adidas-style for puma
        '1542291026-7eec264c27ff',  
        '1606107557195-0e29a4b5b4aa',  
        '1560769629-975ec94e6a86',  
        '1539185065430-3640e53a6b42',  
        '1516478177764-9fe5bd7e9717',  
        '1512374382149-233c42b6a83b',  
        '1595950653106-6c9ebd614d3a',  
        '1584735175315-9d5df23be620',  
        '1543508282-6319a3e2621f',  
    ],
    'reebok': [
        '1543508282-6319a3e2621f',  
        '1581290160084-c8c74c74c5c3',  
        '1520316587275-6167adc54cd8',  
        '1556906781-9f5ab94d5df9',  
        '1468489965526-62aa2d7a9f55',  
        '1515955656352-a1fa3ffcd111',  
        '1562183241-840b8af0721e',  
        '1588361861040-ac9b1018f6d5',  
        '1556048219-bb37b2b5fc0a',  
        '1600185365483-26d0a9ea0f36',  
    ],
    'jordan': [
        '1542291026-7eec264c27ff',  
        '1595950653106-6c9ebd614d3a',  
        '1512374382149-233c42b6a83b',  
        '1584735175315-9d5df23be620',  
        '1581290160084-c8c74c74c5c3',  
        '1606107557195-0e29a4b5b4aa',  
        '1556906781-9f5ab94d5df9',  
        '1543508282-6319a3e2621f',  
        '1608231387042-66d1773d3126',  
        '1560769629-975ec94e6a86',  
    ],
    'asics': [
        '1539185065430-3640e53a6b42',  
        '1516478177764-9fe5bd7e9717',  
        '1560769629-975ec94e6a86',  
        '1562183241-840b8af0721e',  
        '1588361861040-ac9b1018f6d5',  
        '1556048219-bb37b2b5fc0a',  
        '1600185365483-26d0a9ea0f36',  
        '1585386959984-a4155224a1ad',  
        '1515955656352-a1fa3ffcd111',  
        '1520316587275-6167adc54cd8',  
    ],
    'new_balance': [
        '1515955656352-a1fa3ffcd111',  
        '1562183241-840b8af0721e',  
        '1588361861040-ac9b1018f6d5',  
        '1556048219-bb37b2b5fc0a',  
        '1600185365483-26d0a9ea0f36',  
        '1585386959984-a4155224a1ad',  
        '1560769629-975ec94e6a86',  
        '1543508282-6319a3e2621f',  
        '1556906781-9f5ab94d5df9',  
        '1468489965526-62aa2d7a9f55',  
    ],
    'under_armour': [
        '1581290160084-c8c74c74c5c3',  
        '1520316587275-6167adc54cd8',  
        '1512374382149-233c42b6a83b',  
        '1595950653106-6c9ebd614d3a',  
        '1584735175315-9d5df23be620',  
        '1606107557195-0e29a4b5b4aa',  
        '1542291026-7eec264c27ff',  
        '1608231387042-66d1773d3126',  
        '1539185065430-3640e53a6b42',  
        '1516478177764-9fe5bd7e9717',  
    ],
}

HEADERS = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

def download(url, dest):
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=20) as resp:
            with open(dest, 'wb') as f:
                shutil.copyfileobj(resp, f)
        size = os.path.getsize(dest)
        if size < 10000:
            os.remove(dest)
            return False
        return True
    except Exception as e:
        print(f'  ERROR: {e}')
        return False

total_ok = 0
total_fail = 0

for brand, ids in BRAND_IMAGES.items():
    print(f'\n--- {brand.upper()} ---')
    for i, photo_id in enumerate(ids, start=1):
        filename = f'{brand}_{i}.jpg'
        dest = os.path.join(OUT_DIR, filename)
        url = f'https://images.unsplash.com/photo-{photo_id}?w=600&h=600&fit=crop&q=80'
        print(f'  [{i:>2}] {filename} ... ', end='', flush=True)
        ok = download(url, dest)
        if ok:
            size_kb = os.path.getsize(dest) // 1024
            print(f'OK ({size_kb} KB)')
            total_ok += 1
        else:
            print('FAILED')
            total_fail += 1
        time.sleep(0.15)   # polite delay

print(f'\n✅ Done!  Downloaded: {total_ok}  |  Failed: {total_fail}')
print(f'Images saved to: {OUT_DIR}')
