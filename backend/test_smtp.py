import os
import smtplib
import ssl
from dotenv import load_dotenv

load_dotenv()

def test_smtp():
    smtp_server = 'smtp-relay.brevo.com'
    sender_email = os.environ.get('BREVO_SENDER')
    smtp_login = os.environ.get('BREVO_LOGIN') # a7ef0f001@smtp-brevo.com
    api_key = os.environ.get('BREVO_API_KEY')
    receiver_email = "samsam.123samyy@gmail.com"

    logins_to_try = [
        smtp_login,
        sender_email,
        smtp_login.split('@')[0] if smtp_login else None
    ]
    
    # Filter out None and duplicates
    logins_to_try = list(set([l for l in logins_to_try if l]))

    for login in logins_to_try:
        print(f"\n--- Testing Login: {login} ---")
        try:
            context = ssl.create_default_context()
            print(f"Trying Port 587 with login {login}...")
            with smtplib.SMTP(smtp_server, 587, timeout=10) as server:
                server.starttls(context=context)
                server.login(login, api_key)
                print(f"SUCCESS! Login {login} worked on Port 587.")
                server.sendmail(sender_email, receiver_email, f"Subject: SMTP SUCCESS\n\nLogin {login} worked.")
                return
        except Exception as e:
            print(f"Failed with {login} on 587: {e}")

        try:
            print(f"Trying Port 465 with login {login}...")
            with smtplib.SMTP_SSL(smtp_server, 465, context=context, timeout=10) as server:
                server.login(login, api_key)
                print(f"SUCCESS! Login {login} worked on Port 465.")
                return
        except Exception as e:
            print(f"Failed with {login} on 465: {e}")

if __name__ == "__main__":
    test_smtp()
