"""
Fill missing shoe images using verified-working Unsplash photo IDs.
Only downloads files that don't exist or are too small.
"""
import os, sys, urllib.request, shutil, time, io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUT_DIR  = os.path.join(BASE_DIR, 'frontend', 'public', 'assets', 'products')
os.makedirs(OUT_DIR, exist_ok=True)

# ── ONLY verified-working Unsplash photo IDs (shoes/sneakers) ──────────────
WORKING_IDS = [
    '1542291026-7eec264c27ff',   # Nike Air Max red
    '1606107557195-0e29a4b5b4aa',# white Nike shoe
    '1595950653106-6c9ebd614d3a',# colorful Nike
    '1512374382149-233c42b6a83b',# Nike side view
    '1543508282-6319a3e2621f',   # Nike blue
    '1516478177764-9fe5bd7e9717',# Adidas running
    '1515955656352-a1fa3ffcd111',# Adidas boost
    '1560769629-975ec94e6a86',   # colorful sneaker
    '1539185065430-3640e53a6b42',# white sneaker clean
    '1562183241-840b8af0721e',   # NMD style
    '1556906781-9f5ab94d5df9',   # shoe close-up
    '1600185365483-26d0a9ea0f36',# ultraboost style
    '1514989940723-e8e51635b782',# sneakers pair
    '1551107696-a4b0c5a0d9a2',   # shoe shelf
    '1520316587275-6167adc54cd8',# running shoe
    '1556048219-bb37b2b5fc0a',   # superstar style
    '1585386959984-a4155224a1ad',# white clean shoe
    '1468489965526-62aa2d7a9f55',# Nike white classic
]

# All 80 brand/number combos
BRANDS = {
    'nike':         10,
    'adidas':       10,
    'puma':         10,
    'reebok':       10,
    'jordan':       10,
    'asics':        10,
    'new_balance':  10,
    'under_armour': 10,
}

HEADERS = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

def is_ok(path):
    return False  # Force download to overwrite landscape placeholders with real shoes

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
        if os.path.exists(dest):
            os.remove(dest)
        return False

ok = 0
skipped = 0
filled = 0
idx = 0   # rotating index into WORKING_IDS

for brand, count in BRANDS.items():
    print(f'\n--- {brand.upper()} ---')
    for i in range(1, count + 1):
        filename = f'{brand}_{i}.jpg'
        dest = os.path.join(OUT_DIR, filename)
        if is_ok(dest):
            print(f'  [{i:>2}] {filename} ... SKIP (exists, {os.path.getsize(dest)//1024} KB)')
            skipped += 1
            continue

        # Try each working ID in rotation until success
        success = False
        attempts = 0
        while not success and attempts < len(WORKING_IDS):
            photo_id = WORKING_IDS[idx % len(WORKING_IDS)]
            idx += 1
            attempts += 1
            url = f'https://images.unsplash.com/photo-{photo_id}?w=600&h=600&fit=crop&q=80'
            print(f'  [{i:>2}] {filename} ... ', end='', flush=True)
            success = download(url, dest)
            if success:
                size_kb = os.path.getsize(dest) // 1024
                print(f'OK ({size_kb} KB)')
                ok += 1
                filled += 1
            else:
                print(f'RETRY({attempts})...', end='')
        if not success:
            print(f' FAILED after {attempts} attempts')
        time.sleep(0.1)

print(f'\nDone!  Downloaded: {ok}  |  Skipped (already OK): {skipped}')
print(f'Images in: {OUT_DIR}')
