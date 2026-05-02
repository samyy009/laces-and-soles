import os
import requests
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

def send_otp_email(receiver_email, otp):
    """Sends a beautiful OTP email via Brevo HTTP API."""
    sender_email = os.environ.get('BREVO_SENDER')
    api_key = os.environ.get('BREVO_API_KEY')

    if not all([sender_email, api_key]):
        logger.warning("Missing Brevo credentials in .env — skipping OTP email.")
        return False

    html = f"""
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: auto; padding: 40px; border: 1px solid #eee; border-radius: 20px;">
        <h2 style="color: #000; font-weight: 900; text-transform: uppercase; letter-spacing: -1px; margin-bottom: 20px;">Laces & Soles</h2>
        <p style="color: #666; font-size: 16px; line-height: 1.5;">You requested a password reset. Use the following code to verify your account. This code is valid for 10 minutes.</p>
        <div style="background: #f9f9f9; padding: 30px; text-align: center; border-radius: 12px; margin: 30px 0;">
            <span style="font-size: 42px; font-weight: 900; color: #f43f5e; letter-spacing: 10px;">{otp}</span>
        </div>
        <p style="color: #999; font-size: 12px; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
            If you didn't request this, please ignore this email.
        </p>
    </div>
    """

    url = "https://api.brevo.com/v3/smtp/email"
    headers = {
        "accept": "application/json",
        "content-type": "application/json",
        "api-key": api_key
    }
    payload = {
        "sender": {"name": "Laces & Soles", "email": sender_email},
        "to": [{"email": receiver_email}],
        "subject": f"{otp} is your Laces & Soles verification code",
        "htmlContent": html
    }

    try:
        logger.info(f"API: Sending OTP to {receiver_email} via Brevo HTTP...")
        response = requests.post(url, json=payload, headers=headers)
        if response.status_code in [201, 202]:
            logger.info("API: Email sent successfully!")
            return True
        else:
            logger.error(f"API Error: Status {response.status_code} - {response.text}")
            return False
    except Exception as e:
        logger.error(f"API Connection Error: {e}")
        return False


def send_order_confirmation_email(receiver_email, customer_name, order):
    """Sends a rich HTML order confirmation email via Brevo after successful payment."""
    sender_email = os.environ.get('BREVO_SENDER')
    api_key = os.environ.get('BREVO_API_KEY')

    if not all([sender_email, api_key]):
        logger.warning("Missing Brevo credentials — skipping order confirmation email.")
        return False

    order_data   = order.to_dict()
    tracking_id  = order_data['tracking_id']
    invoice_no   = f"INV-{datetime.utcnow().year}-{str(order.id).zfill(5)}"
    order_date   = order.created_at.strftime('%d %b %Y') if order.created_at else 'Today'
    total_amount = order_data['total_amount']

    items_rows_html = ""
    for item in order_data.get('items', []):
        product = item.get('product') or {}
        name    = product.get('title', 'Item')
        qty     = item.get('quantity', 1)
        price   = item.get('price', 0)
        items_rows_html += f"""
        <tr>
          <td style="padding:10px 8px;border-bottom:1px solid #f3f4f6;">{name}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #f3f4f6;text-align:center;">{qty}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #f3f4f6;text-align:right;">&#8377;{price:.2f}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #f3f4f6;text-align:right;font-weight:700;">&#8377;{price * qty:.2f}</td>
        </tr>"""

    html = f"""<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f9fafb;font-family:'Helvetica Neue',Arial,sans-serif;">
      <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">
        <div style="background:#f43f5e;padding:28px 32px;">
          <h1 style="margin:0;color:#fff;font-size:22px;font-weight:900;letter-spacing:-0.5px;">LACES &amp; SOLES</h1>
          <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">lacesandsoles.in</p>
        </div>
        <div style="padding:32px;">
          <h2 style="margin:0 0 8px;font-size:24px;font-weight:900;color:#111827;">Order Confirmed! &#10003;</h2>
          <p style="color:#6b7280;font-size:15px;margin:0 0 24px;">Hi {customer_name}, your payment was received and your order is now being processed.</p>
          <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:24px;">
            <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:12px 18px;">
              <p style="margin:0;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;">Invoice No.</p>
              <p style="margin:4px 0 0;font-size:15px;font-weight:800;color:#111827;">{invoice_no}</p>
            </div>
            <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:12px 18px;">
              <p style="margin:0;font-size:10px;font-weight:700;color:#3b82f6;text-transform:uppercase;letter-spacing:0.1em;">Tracking ID</p>
              <p style="margin:4px 0 0;font-size:15px;font-weight:800;color:#1d4ed8;">{tracking_id}</p>
            </div>
            <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:12px 18px;">
              <p style="margin:0;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;">Order Date</p>
              <p style="margin:4px 0 0;font-size:15px;font-weight:800;color:#111827;">{order_date}</p>
            </div>
          </div>
          <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
            <thead><tr style="background:#111827;">
              <th style="padding:10px 8px;text-align:left;color:#fff;font-size:11px;text-transform:uppercase;">Item</th>
              <th style="padding:10px 8px;text-align:center;color:#fff;font-size:11px;text-transform:uppercase;">Qty</th>
              <th style="padding:10px 8px;text-align:right;color:#fff;font-size:11px;text-transform:uppercase;">Price</th>
              <th style="padding:10px 8px;text-align:right;color:#fff;font-size:11px;text-transform:uppercase;">Total</th>
            </tr></thead>
            <tbody>{items_rows_html}</tbody>
          </table>
          <div style="background:#111827;border-radius:10px;padding:14px 16px;margin-bottom:28px;display:flex;justify-content:space-between;">
            <span style="color:#fff;font-size:13px;font-weight:700;text-transform:uppercase;">Grand Total</span>
            <span style="color:#f43f5e;font-size:20px;font-weight:900;">&#8377;{total_amount:.2f}</span>
          </div>
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px 18px;margin-bottom:28px;">
            <p style="margin:0;font-size:13px;color:#166534;">&#128230; <strong>Estimated Delivery:</strong> 3-7 business days. Use your Tracking ID on our Track Order page.</p>
          </div>
          <p style="color:#9ca3af;font-size:12px;text-align:center;margin:0;">Questions? Email us at <a href="mailto:support@lacesandsoles.in" style="color:#f43f5e;">support@lacesandsoles.in</a></p>
        </div>
        <div style="background:#f9fafb;padding:18px 32px;text-align:center;border-top:1px solid #f3f4f6;">
          <p style="margin:0;font-size:11px;color:#9ca3af;">&copy; {datetime.utcnow().year} Laces &amp; Soles. All rights reserved.</p>
        </div>
      </div>
    </body></html>"""

    url = "https://api.brevo.com/v3/smtp/email"
    headers = {"accept": "application/json", "content-type": "application/json", "api-key": api_key}
    payload = {
        "sender": {"name": "Laces & Soles", "email": sender_email},
        "to": [{"email": receiver_email, "name": customer_name}],
        "subject": f"✅ Order Confirmed — {tracking_id} | Laces & Soles",
        "htmlContent": html
    }
    try:
        response = requests.post(url, json=payload, headers=headers)
        if response.status_code in [201, 202]:
            logger.info(f"Order confirmation email sent to {receiver_email}")
            return True
        else:
            logger.error(f"Brevo Error: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        logger.error(f"Order email failed: {e}")
        return False

def send_delivery_otp_email(receiver_email, customer_name, tracking_id, otp):
    """Sends a professional HTML email for delivery verification."""
    sender_email = os.environ.get('BREVO_SENDER')
    api_key = os.environ.get('BREVO_API_KEY')

    if not all([sender_email, api_key]):
        logger.warning("Missing Brevo credentials — skipping delivery OTP email.")
        return False

    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #ff3366; text-align: center; text-transform: uppercase;">Delivery Verification Code</h2>
        <p>Hello <strong>{customer_name}</strong>,</p>
        <p>Your order <strong>#{tracking_id}</strong> is ready for delivery! Please share the following verification code with our driver to receive your items:</p>
        <div style="background: #f9f9f9; padding: 20px; text-align: center; border-radius: 10px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #333;">{otp}</span>
        </div>
        <p style="font-size: 12px; color: #888;">If you did not request this delivery, please ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="text-align: center; font-size: 14px; color: #ff3366; font-weight: bold;">Laces & Soles Boutique</p>
    </div>
    """

    url = "https://api.brevo.com/v3/smtp/email"
    headers = {"accept": "application/json", "content-type": "application/json", "api-key": api_key}
    payload = {
        "sender": {"name": "Laces & Soles", "email": sender_email},
        "to": [{"email": receiver_email}],
        "subject": f"OTP for Order #{tracking_id}",
        "htmlContent": html
    }

    try:
        response = requests.post(url, json=payload, headers=headers)
        return response.status_code in [201, 202]
    except Exception as e:
        logger.error(f"Delivery OTP email failed: {e}")
        return False
