import requests
import json

app_url = "http://localhost:5000"

def run_test():
    # 1. Register
    print("Registering dummy user...")
    res = requests.post(f"{app_url}/api/register", json={
        "full_name": "Test Order User",
        "email": "testorder2@example.com",
        "password": "password"
    })
    
    if res.status_code == 409:
        # User exists, try logging in
        res = requests.post(f"{app_url}/api/login", json={
            "email": "testorder2@example.com",
            "password": "password"
        })
    elif res.status_code != 201:
        print(f"Failed to register: {res.text}")
        return
        
    token = res.json().get('token')
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Add an arbitrary product to cart
    print("Getting a product...")
    res = requests.get(f"{app_url}/api/products")
    products = res.json().get('products', [])
    if not products:
        print("No products available to test.")
        return
    prod_id = products[0]['id']
    
    print(f"Adding product {prod_id} to cart...")
    res = requests.post(f"{app_url}/api/cart", json={"product_id": prod_id, "quantity": 1}, headers=headers)
    
    # 3. Checkout
    print("Attempting to checkout...")
    res = requests.post(f"{app_url}/api/orders", headers=headers)
    
    print(f"Checkout Status: {res.status_code}")
    print(f"Checkout Response: {res.text}")

if __name__ == "__main__":
    run_test()
