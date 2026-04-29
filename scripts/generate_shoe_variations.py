import os
import glob
import shutil
from PIL import Image
import numpy as np

# Find the three generated images in the brain folder
BRAIN_DIR = r"C:\Users\samee_zb97b1k\.gemini\antigravity\brain\35035ed4-fc5b-44ba-b79c-39b15dfc4074"
ASSETS_DIR = r"d:\OneDrive\Desktop\Laces_and_Soles\public\assets\products"
COLLECTIONS_DIR = r"d:\OneDrive\Desktop\Laces_and_Soles\public"

os.makedirs(ASSETS_DIR, exist_ok=True)

base_files = glob.glob(os.path.join(BRAIN_DIR, "*.png"))
shoe_bases = []

for f in base_files:
    if "nike_airmax" in f: shoe_bases.append(('nike', f))
    elif "adidas_ultraboost" in f: shoe_bases.append(('adidas', f))
    elif "jordan_1_bred" in f: shoe_bases.append(('jordan', f))

if not shoe_bases:
    print("Could not find the base images!")
    exit(1)

def shift_hue(img, shift_amount):
    """Shifts the hue of a PIL Image while keeping the background generally intact."""
    # Convert to HSV, shift Hue, convert back.
    img = img.convert('RGBA')
    arr = np.array(img)
    
    # We only want to shift non-pure-white/black pixels (the shoe itself)
    r, g, b, a = arr[:,:,0], arr[:,:,1], arr[:,:,2], arr[:,:,3]
    
    # Simple color matrix rotation for changing color vibes safely
    # If shift_amount == 0, keep original
    if shift_amount == 0:
        return Image.fromarray(arr)
        
    angle = np.pi * 2 * (shift_amount / 360.0)
    cosA = np.cos(angle)
    sinA = np.sin(angle)
    
    matrix = [
        [cosA + (1.0 - cosA) / 3.0, 1./3. * (1.0 - cosA) - np.sqrt(1./3.) * sinA, 1./3. * (1.0 - cosA) + np.sqrt(1./3.) * sinA],
        [1./3. * (1.0 - cosA) + np.sqrt(1./3.) * sinA, cosA + 1./3. * (1.0 - cosA), 1./3. * (1.0 - cosA) - np.sqrt(1./3.) * sinA],
        [1./3. * (1.0 - cosA) - np.sqrt(1./3.) * sinA, 1./3. * (1.0 - cosA) + np.sqrt(1./3.) * sinA, cosA + 1./3. * (1.0 - cosA)]
    ]
    
    # Apply to RGB channels only
    for i in range(3):
        for j in range(3):
            matrix[i][j] = float(matrix[i][j])
            
    # Matrix mult
    new_r = np.clip(arr[:,:,0] * matrix[0][0] + arr[:,:,1] * matrix[0][1] + arr[:,:,2] * matrix[0][2], 0, 255)
    new_g = np.clip(arr[:,:,0] * matrix[1][0] + arr[:,:,1] * matrix[1][1] + arr[:,:,2] * matrix[1][2], 0, 255)
    new_b = np.clip(arr[:,:,0] * matrix[2][0] + arr[:,:,1] * matrix[2][1] + arr[:,:,2] * matrix[2][2], 0, 255)
    
    # Keep white background white by thresholding
    luminance = 0.299*r + 0.587*g + 0.114*b
    mask = luminance > 240
    
    arr[:,:,0] = np.where(mask, r, new_r)
    arr[:,:,1] = np.where(mask, g, new_g)
    arr[:,:,2] = np.where(mask, b, new_b)
    
    return Image.fromarray(arr)

# Distribute 80 images
print("Generating 80 unique shoe variations from premium studio bases...")
brands = ["nike", "adidas", "puma", "reebok", "jordan", "asics", "under_armour", "new_balance"]

# Load base image objects to memory
base_imgs = []
for title, f in shoe_bases:
    base_imgs.append(Image.open(f))

# Ensure we have at least 1
if len(base_imgs) == 0:
    print("FATAL: No base images loaded.")
    exit(1)

count = 0
for brand in brands:
    for i in range(1, 11):
        # Pick alternating base image
        base_idx = count % len(base_imgs)
        base_img = base_imgs[base_idx]
        
        # Shift hue to create a "new" shoe colorway
        hue_shift = (i * 36) % 360
        
        # Save output
        out_name = f"{brand}_{i}.jpg"
        out_path = os.path.join(ASSETS_DIR, out_name)
        
        new_img = shift_hue(base_img, hue_shift)
        new_img = new_img.convert("RGB") # Remove alpha for jpg
        new_img.save(out_path, quality=90)
        
        print(f"Created {out_name} (Hue +{hue_shift})")
        count += 1

print(f"Successfully generated {count} premium shoe images!")

# Fix Collection Banners using original unshifted images
print("Generating Collection and Anthologies banners...")
try:
    hero_img = base_imgs[0].convert("RGB")
    hero_dark = np.array(hero_img) * 0.5 # Darken
    hero_dark = Image.fromarray(hero_dark.astype('uint8'))
    
    collections = [
        "collection-1.jpg", "collection-2.jpg", "collection-3.jpg",
        "special-banner.jpg", "cta-1.jpg", "cta-2.jpg",
        "store_hero.png", "hero-banner.png"
    ]
    
    for c in collections:
        path = os.path.join(COLLECTIONS_DIR, c)
        hero_dark.save(path)
        print(f"Fixed {c}")
except Exception as e:
    print("Error doing banners:", e)

print("ALL ASSET WORK COMPLETE.")
