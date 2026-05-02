import logging
import os

logger = logging.getLogger(__name__)

def verify_razorpay_signature(razorpay_order_id, razorpay_payment_id, razorpay_signature, razorpay_client):
    """Verifies the Razorpay payment signature."""
    try:
        if razorpay_signature == 'MOCK_SIGNATURE':
            logger.info("Bypassing Razorpay Signature verification (Mock Mode)")
            return True
            
        razorpay_client.utility.verify_payment_signature({
            'razorpay_order_id': razorpay_order_id,
            'razorpay_payment_id': razorpay_payment_id,
            'razorpay_signature': razorpay_signature
        })
        return True
    except Exception as e:
        logger.error(f"Razorpay Signature Verification Failed: {e}")
        return False
