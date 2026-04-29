import os
from dotenv import load_dotenv
from app import send_otp_email

load_dotenv()

email = "samsam.123samyy@gmail.com"
otp = "123456"

print(f"Testing send_otp_email for {email}...")
result = send_otp_email(email, otp)
print(f"Result: {result}")
