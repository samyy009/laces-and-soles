import requests

API = 'http://localhost:5000'

# We need an admin token. I'll just login as admin.
def get_admin_token():
    res = requests.post(f"{API}/api/login", json={
        "email": "admin@laces.com",
        "password": "admin"
    })
    if res.status_code == 200:
        return res.json().get('token')
    return None

token = get_admin_token()
if not token:
    print("Error: Could not login as admin.")
else:
    headers = {'Authorization': f'Bearer {token}'}
    res = requests.post(f"{API}/api/admin/orders/flash-approve", headers=headers)
    print(f"Status: {res.status_code}")
    print(f"Response: {res.json()}")
