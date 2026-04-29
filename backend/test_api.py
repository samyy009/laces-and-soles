import os
import requests
from dotenv import load_dotenv

load_dotenv()

def test_brevo_api():
    api_key = os.environ.get('BREVO_API_KEY')
    sender_email = os.environ.get('BREVO_SENDER')
    receiver_email = "samsam.123samyy@gmail.com"

    print(f"Testing Brevo HTTP API...")
    print(f"Sender: {sender_email}")
    print(f"Key length: {len(api_key) if api_key else 'None'}")

    url = "https://api.brevo.com/v3/smtp/email"
    headers = {
        "accept": "application/json",
        "content-type": "application/json",
        "api-key": api_key
    }
    payload = {
        "sender": {"name": "Laces & Soles", "email": sender_email},
        "to": [{"email": receiver_email}],
        "subject": "Brevo API Test",
        "htmlContent": "<html><body><h1>It Works!</h1><p>This email was sent using the Brevo HTTP API.</p></body></html>"
    }

    try:
        response = requests.post(url, json=payload, headers=headers)
        if response.status_code in [201, 202]:
            print("SUCCESS! Email sent via Brevo API.")
            print("Response:", response.json())
        else:
            print(f"API Failed: Status {response.status_code}")
            print("Response Body:", response.text)
    except Exception as e:
        print(f"HTTP Request Failed: {e}")

if __name__ == "__main__":
    test_brevo_api()
