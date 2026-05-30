import requests

def test_admin_flow():
    # 1. Login as Admin
    login_url = "http://localhost:5000/api/login"
    credentials = {
        "email": "admin@laces.com",
        "password": "admin123"
    }
    print("Attempting admin login...")
    try:
        r = requests.post(login_url, json=credentials)
        print(f"Login Response Code: {r.status_code}")
        if r.status_code != 200:
            print("Login failed:", r.text)
            return
        
        data = r.json()
        token = data.get("token")
        user = data.get("user")
        print(f"Login Success! User: {user['full_name']} | Role: {user['role']}")
        
        # 2. Get Metrics
        metrics_url = "http://localhost:5000/api/admin/metrics"
        headers = {
            "Authorization": f"Bearer {token}"
        }
        print("\nFetching admin metrics...")
        rm = requests.get(metrics_url, headers=headers)
        print(f"Metrics Response Code: {rm.status_code}")
        if rm.status_code == 200:
            print("Metrics data:")
            metrics = rm.json()
            print(f"  Total Users: {metrics.get('total_users')}")
            print(f"  Total Products: {metrics.get('total_products')}")
            print(f"  Total Orders: {metrics.get('total_orders')}")
            print(f"  Total Revenue: {metrics.get('total_revenue')}")
        else:
            print("Failed to fetch metrics:", rm.text)
            
    except Exception as e:
        print("Error during test:", e)

if __name__ == "__main__":
    test_admin_flow()
