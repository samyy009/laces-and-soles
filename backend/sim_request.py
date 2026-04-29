import requests

url = "http://127.0.0.1:5000/api/forgot-password"
payload = {"email": "samsam.123samyy@gmail.com"}

print(f"Simulating frontend request to {url}...")
try:
    response = requests.post(url, json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response JSON: {response.json()}")
except Exception as e:
    print(f"Request Error: {e}")
