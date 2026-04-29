import requests
import re
from bs4 import BeautifulSoup
import json

def get_shoes(query):
    url = f"https://unsplash.com/s/photos/{query}"
    print(f"Scraping {url}...")
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        res = requests.get(url, headers=headers)
        if res.status_code == 200:
            urls = []
            # Unsplash images usually have srcset matching images.unsplash.com/photo-\w+-\w+
            matches = re.findall(r'images\.unsplash\.com/photo-([a-zA-Z0-9\-]+)\?', res.text)
            # Filter out known avatars or generic stuff if possible
            for m in matches:
                if len(m) > 15 and m not in urls:
                    urls.append(m)
            print(f"Found {len(urls)} IDs for {query}.")
            return urls
    except Exception as e:
        print("Error:", e)
    return []

if __name__ == "__main__":
    results = {}
    for q in ["sneaker-product", "adidas-shoe", "nike-shoe", "puma-shoe", "jordan-shoe"]:
        results[q] = get_shoes(q)
    
    with open("unsplash_scraped.json", "w") as f:
        json.dump(results, f, indent=2)
    print("Done")
