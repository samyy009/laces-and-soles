import os
from dotenv import load_dotenv

load_dotenv()

print(f"BREVO_API_KEY set: {bool(os.environ.get('BREVO_API_KEY'))}")
print(f"BREVO_API_KEY length: {len(os.environ.get('BREVO_API_KEY', ''))}")
print(f"BREVO_SENDER: {os.environ.get('BREVO_SENDER', 'NOT SET')}")
