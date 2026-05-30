import os
import logging
from twilio.rest import Client

logger = logging.getLogger(__name__)

def send_sms_otp(phone_number, otp, tracking_id):
    """
    Sends an SMS OTP using Twilio API.
    In a trial account, the phone_number must be verified in the Twilio Console.
    """
    account_sid = os.environ.get('TWILIO_ACCOUNT_SID')
    auth_token = os.environ.get('TWILIO_AUTH_TOKEN')
    twilio_number = os.environ.get('TWILIO_PHONE_NUMBER')

    # Format the phone number (Assuming India +91 if no country code provided)
    if phone_number and not phone_number.startswith('+'):
        phone_number = f"+91{phone_number.lstrip('0')}"

    message_body = f"Laces & Soles: Your delivery OTP for order #{tracking_id} is {otp}. Please share this with the driver."

    if not all([account_sid, auth_token, twilio_number]):
        logger.warning(f"Mock SMS Sent to {phone_number}: {message_body}")
        # Save mock SMS to logs
        os.makedirs('logs/sms', exist_ok=True)
        import time
        with open(f'logs/sms/mock_sms_{int(time.time())}.txt', 'w') as f:
            f.write(f"To: {phone_number}\nMessage: {message_body}")
        return True

    try:
        client = Client(account_sid, auth_token)
        message = client.messages.create(
            body=message_body,
            from_=twilio_number,
            to=phone_number
        )
        logger.info(f"Twilio SMS sent successfully! SID: {message.sid}")
        return True
    except Exception as e:
        logger.error(f"Twilio SMS sending failed: {e}")
        return False
