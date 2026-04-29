import requests
import json

BASE_URL = "http://localhost:5000/api"

def test_flash_speed():
    # 1. Login as Admin
    print("--- Logging in as Admin ---")
    admin_login = requests.post(f"{BASE_URL}/login", json={
        "email": "admin@laces.com",
        "password": "Admin@123"
    }).json()
    admin_token = admin_login.get('token')
    if not admin_token:
        print(f"Login failed: {admin_login}")
        return
        
    headers_admin = {"Authorization": f"Bearer {admin_token}"}

    # 2. Find a driver and set zone to 580030
    print("--- Setting Driver Zone to 580030 ---")
    users = requests.get(f"{BASE_URL}/admin/users", headers=headers_admin).json().get('users', [])
    driver = next((u for u in users if u['role'] == 'driver'), None)
    if not driver:
        print("Error: No driver found in database.")
        return

    requests.put(f"{BASE_URL}/admin/users/{driver['id']}", 
                headers=headers_admin, 
                json={"delivery_zones": "580030"}).json()
    print(f"Driver {driver['full_name']} (ID: {driver['id']}) now covers zone 580030.")

    # 3. Login as User
    print("--- Logging in as User ---")
    user_login = requests.post(f"{BASE_URL}/login", json={
        "email": "samsam.123samyy@gmail.com",
        "password": "Password123"
    }).json()
    user_token = user_login.get('token')
    if not user_token:
        print(f"User login failed: {user_login}")
        return
    headers_user = {"Authorization": f"Bearer {user_token}"}
    headers_user = {"Authorization": f"Bearer {user_token}"}

    # 4. Place an order with pincode 580030
    print("--- Placing Order with Pincode 580030 ---")
    # Get a product
    products = requests.get(f"{BASE_URL}/products").json().get('products', [])
    if not products:
        print("Error: No products found.")
        return
    prod_id = products[0]['id']

    # Add item to cart
    print(f"--- Adding Product {prod_id} to Cart ---")
    cart_res = requests.post(f"{BASE_URL}/cart", headers=headers_user, json={
        "product_id": prod_id, "quantity": 1
    }).json()
    print(f"Cart Result: {cart_res}")

    order_payload = {
        "shipping_details": {
            "fullName": "Test User",
            "email": "test@example.com",
            "phone": "9876543210",
            "address": "123 Hubli Street",
            "city": "Hubli",
            "state": "Karnataka",
            "pincode": "580030"
        },
        "payment_method": "Cash on Delivery"
    }
    order_res = requests.post(f"{BASE_URL}/orders", headers=headers_user, json=order_payload).json()
    
    # The API returns 'order' object (dict) in V2 or 'order_ids' list in V1. 
    # Based on current app.py, it returns {'order': created_orders[0].to_dict()}
    target_order_obj = order_res.get('order')
    if not target_order_obj:
        print(f"Error: Order creation failed: {order_res}")
        return
    
    order_id = target_order_obj['id']
    print(f"Order created: ID {order_id}")

    # 5. Flash Speed Approve
    print("--- Triggering Flash Speed Approval ---")
    flash_res = requests.post(f"{BASE_URL}/admin/orders/flash-approve", headers=headers_admin).json()
    print(f"Flash Speed Message: {flash_res.get('message')}")

    # 6. Verify Assignment
    print("--- Verifying Assignment ---")
    order_info = requests.get(f"{BASE_URL}/admin/orders", headers=headers_admin).json().get('orders', [])
    target_order = next((o for o in order_info if o['id'] == order_id), None)
    
    if target_order:
        print(f"Order ID: {target_order['id']}")
        print(f"Order Pincode: {target_order.get('pincode')}")
        print(f"Assigned Driver ID: {target_order['driver_id']}")
        if target_order['driver_id'] == driver['id']:
            print("SUCCESS: Geographic matching worked! Order assigned to the correct driver.")
        else:
            print(f"FAILURE: Order was assigned to Driver ID {target_order['driver_id']} instead of {driver['id']}.")
    else:
        print("Error: Target order not found in admin list.")

if __name__ == "__main__":
    test_flash_speed()
