import os
import shutil
import json
import glob

brain_dir = r"C:\Users\samee_zb97b1k\.gemini\antigravity\brain\35035ed4-fc5b-44ba-b79c-39b15dfc4074"
public_dir = r"d:\OneDrive\Desktop\Laces_and_Soles\public"
content_file = os.path.join(r"d:\OneDrive\Desktop\Laces_and_Soles\src", "content.json")

# 1. Restore Collections
shutil.copy(os.path.join(brain_dir, "mens_footwear_bg_new_1776230886287.png"), os.path.join(public_dir, "collection-1.png"))
shutil.copy(os.path.join(brain_dir, "womens_footwear_bg_1776230838678.png"), os.path.join(public_dir, "collection-2.png"))
shutil.copy(os.path.join(brain_dir, "sports_footwear_bg_1776230856239.png"), os.path.join(public_dir, "collection-3.png"))

# 2. Update content.json to point to the restored .png files
with open(content_file, 'r', encoding='utf-8') as f:
    content = json.load(f)

content['collection'][0]['image'] = '/collection-1.png'
content['collection'][1]['image'] = '/collection-2.png'
content['collection'][2]['image'] = '/collection-3.png'

with open(content_file, 'w', encoding='utf-8') as f:
    json.dump(content, f, indent=2)

# 3. Restore colorful vibes to other banners instead of dark grey
# We use existing colorful shifted shoes without darkening them.
assets_dir = os.path.join(public_dir, "assets", "products")
shutil.copy(os.path.join(assets_dir, "adidas_7.jpg"), os.path.join(public_dir, "hero-banner.png"))
shutil.copy(os.path.join(assets_dir, "nike_4.jpg"), os.path.join(public_dir, "store_hero.png"))
shutil.copy(os.path.join(assets_dir, "puma_5.jpg"), os.path.join(public_dir, "special-banner.jpg"))
shutil.copy(os.path.join(assets_dir, "new_balance_3.jpg"), os.path.join(public_dir, "cta-1.jpg"))
shutil.copy(os.path.join(assets_dir, "under_armour_6.jpg"), os.path.join(public_dir, "cta-2.jpg"))

print("Restored original colorful collection banners and applied vibrant imagery to all page heroes.")
