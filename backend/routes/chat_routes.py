from flask import Blueprint, request, jsonify
from google import genai
import os
from dotenv import load_dotenv
from models import Product # Import Product model for "training" context

load_dotenv()

chat_bp = Blueprint('chat', __name__, url_prefix='/api')

def get_chat_client():
    """
    Initializes the new Google GenAI client.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or "YOUR_GEMINI_API_KEY" in api_key:
        return None
    
    return genai.Client(api_key=api_key)

SYSTEM_INSTRUCTION = """
You are the "Laces & Soles Smart Assistant", an elite AI combining the premium expertise of a boutique curator with the versatility of a modern smart assistant like Alexa or Google Assistant.

YOUR CORE MODES:
1. BOUTIQUE EXPERT: Help with Laces & Soles orders (/track), collections (/collections), and product advice.
2. SMART ASSISTANT: Answer general knowledge questions or help with general productivity.

BRAND CONTEXT:
- Boutique Name: Laces & Soles
- Expertise: Premium footwear, sneaker culture, 100% authenticity.
- Shipping: 3-7 business days nationwide.

SMART SKILLS:
- If asked "Who are you?", emphasize you are a Gemini-powered smart assistant for Laces & Soles.
- If asked about other AIs (Alexa, Meta, Google), acknowledge them but highlight your specialization in footwear.

CONVERSATION GUIDELINES:
- Voice Ready: Keep responses clear and easy to understand for Text-to-Speech.
- Tone: Professional, elite, and high-tech.
- Use subtle emojis (👟, 🎙️, ✨).
"""

@chat_bp.route('/chat', methods=['POST'])
def chat():
    client = get_chat_client()
    
    if not client:
        return jsonify({
            "error": "Gemini API Key is missing or invalid. Please set GEMINI_API_KEY in your .env file."
        }), 403
    
    data = request.json
    user_message = data.get('message')
    raw_history = data.get('history', [])

    if not user_message:
        return jsonify({"error": "Message is required"}), 400

    # DYNAMIC DATA INJECTION (The "Training" part)
    # Fetch top products/categories from DB to give the AI real-time context
    db_context = ""
    try:
        products = Product.query.limit(10).all()
        if products:
            db_context = "\nCURRENT INVENTORY CONTEXT (Real-time):\n"
            for p in products:
                db_context += f"- {p.title} ({p.brand}): ${p.price}. Category: {p.category}. Stock: {p.stock}.\n"
    except Exception as e:
        print(f"Warning: Could not fetch DB context for AI: {str(e)}")
        # Continue without DB context if DB is down

    final_instruction = SYSTEM_INSTRUCTION + db_context

    try:
        # Convert frontend history to SDK v2 format if needed
        formatted_history = []
        for h in raw_history:
            if isinstance(h, dict) and 'role' in h and 'parts' in h:
                formatted_history.append({
                    "role": h['role'],
                    "parts": h['parts']
                })

        # Use the chat session approach
        chat_session = client.chats.create(
            model="gemini-1.5-flash",
            config={
                "system_instruction": final_instruction
            },
            history=formatted_history
        )
        
        response = chat_session.send_message(user_message)
        
        # Construct the history to return to the frontend
        new_history = raw_history + [
            {"role": "user", "parts": [user_message]},
            {"role": "model", "parts": [response.text]}
        ]
        
        return jsonify({
            "response": response.text,
            "history": new_history
        })

    except Exception as e:
        print(f"CRITICAL: Chat generation failed: {str(e)}")
        return jsonify({"error": str(e)}), 500
