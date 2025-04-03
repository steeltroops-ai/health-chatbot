from flask import Blueprint, request, jsonify, current_app
from models import ChatHistory, ChatSession, ChatMessage, db
from routes.auth import token_required
import openai
import json
import hashlib

chat_bp = Blueprint('chat', __name__)

# Set up the OpenAI client
def get_openai_client():
    return openai.OpenAI(api_key=current_app.config['OPENAI_API_KEY'])

# Medical chatbot system prompt
SYSTEM_PROMPT = """
You are a medical AI assistant designed to provide general health information and guidance. 
You can:
- Analyze symptoms and suggest possible causes
- Recommend when to see a doctor
- Suggest appropriate medical specialists
- Provide general health advice
- Explain medical terms and conditions

Important limitations:
- You are NOT a replacement for professional medical advice
- You CANNOT provide a diagnosis
- You should ALWAYS recommend consulting a healthcare professional for specific concerns
- You should NEVER prescribe medications or treatments
- You should acknowledge your limitations as an AI
- You should focus on providing factual, evidence-based information

For any serious or emergency symptoms, ALWAYS advise seeking immediate medical attention.
"""

@chat_bp.route('/send', methods=['POST'])
@token_required
def send_message(current_user):
    data = request.get_json()
    
    if not data or not data.get('message'):
        return jsonify({'message': 'No message provided!'}), 400
    
    user_message = data.get('message')
    session_id = data.get('session_id')
    
    # Check if it's a new session or existing one
    if not session_id:
        # Create a new chat session
        session = ChatSession(user_id=current_user.id)
        db.session.add(session)
        db.session.commit()
        session_id = session.id
    else:
        # Verify the session belongs to the user
        session = ChatSession.query.filter_by(id=session_id, user_id=current_user.id).first()
        if not session:
            return jsonify({'message': 'Invalid session ID!'}), 404
    
    # Try to get from cache first
    cache_key = f"chat:{hashlib.md5(user_message.encode()).hexdigest()}"
    cached_response = None
    
    try:
        if hasattr(current_app, 'redis'):
            cached_response = current_app.redis.get(cache_key)
        
        if cached_response:
            # Use cached response if available
            assistant_response = json.loads(cached_response)
    else:
        # Get previous messages in this session for context
        previous_messages = ChatMessage.query.filter_by(session_id=session_id).order_by(ChatMessage.created_at).all()
        
        # Format messages for OpenAI API
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        
        # Add previous context (limit to last 10 messages to keep context manageable)
        for msg in previous_messages[-10:]:
            messages.append({"role": msg.role, "content": msg.content})
        
        # Add the new user message
        messages.append({"role": "user", "content": user_message})
        
        try:
            # Verify OpenAI API key is configured
            if not current_app.config['OPENAI_API_KEY']:
                return jsonify({'message': 'OpenAI API key is not configured!', 'error': 'Missing API key'}), 500

            # Call OpenAI API
            client = get_openai_client()
            try:
                response = client.chat.completions.create(
                    model=current_app.config['OPENAI_MODEL'],
                    messages=messages,
                    temperature=0.7,
                    max_tokens=800,
                    top_p=1.0,
                    frequency_penalty=0.0,
                    presence_penalty=0.0,
                )
                
                # Extract the response content
                assistant_response = response.choices[0].message.content
                
                # Cache the response
                try:
                    if hasattr(current_app, 'redis'):
                        current_app.redis.setex(
                            cache_key,
                            3600,  # Cache for 1 hour
                            json.dumps(assistant_response)
                        )
                except Exception as redis_error:
                    # Log Redis error but continue processing
                    print(f"Redis caching error: {redis_error}")
                    
            except openai.AuthenticationError as auth_error:
                return jsonify({'message': 'Invalid OpenAI API key!', 'error': str(auth_error)}), 401
            except openai.RateLimitError as rate_error:
                return jsonify({'message': 'OpenAI API rate limit exceeded!', 'error': str(rate_error)}), 429
            except openai.APIError as api_error:
                return jsonify({'message': 'OpenAI API error!', 'error': str(api_error)}), 500
                
        except Exception as e:
            return jsonify({'message': 'Error getting response from OpenAI!', 'error': str(e)}), 500
    
    # Save the user message
    user_msg = ChatMessage(
        session_id=session_id,
        role="user",
        content=user_message
    )
    db.session.add(user_msg)
    
    # Save the assistant response
    assistant_msg = ChatMessage(
        session_id=session_id,
        role="assistant",
        content=assistant_response
    )
    db.session.add(assistant_msg)
    
    # Update the session title if it's the first message
    if len(previous_messages) < 2:  # Just the first user message
        # Use the first ~30 chars of user message as title
        title = user_message[:30] + '...' if len(user_message) > 30 else user_message
        session.title = title
    
    db.session.commit()
    
    # Also save to the general chat history
    chat_history = ChatHistory(
        user_id=current_user.id,
        query=user_message,
        response=assistant_response
    )
    db.session.add(chat_history)
    db.session.commit()
    
    return jsonify({
        'message': 'Message sent successfully!',
        'response': assistant_response,
        'session_id': session_id
    }), 200

@chat_bp.route('/sessions', methods=['GET'])
@token_required
def get_sessions(current_user):
    sessions = ChatSession.query.filter_by(user_id=current_user.id).order_by(ChatSession.updated_at.desc()).all()
    return jsonify({
        'sessions': [session.to_dict() for session in sessions]
    }), 200

@chat_bp.route('/sessions/<session_id>', methods=['GET'])
@token_required
def get_session(current_user, session_id):
    session = ChatSession.query.filter_by(id=session_id, user_id=current_user.id).first()
    
    if not session:
        return jsonify({'message': 'Session not found!'}), 404
    
    messages = ChatMessage.query.filter_by(session_id=session_id).order_by(ChatMessage.created_at).all()
    
    return jsonify({
        'session': session.to_dict(),
        'messages': [message.to_dict() for message in messages]
    }), 200

@chat_bp.route('/sessions/<session_id>', methods=['DELETE'])
@token_required
def delete_session(current_user, session_id):
    session = ChatSession.query.filter_by(id=session_id, user_id=current_user.id).first()
    
    if not session:
        return jsonify({'message': 'Session not found!'}), 404
    
    db.session.delete(session)
    db.session.commit()
    
    return jsonify({
        'message': 'Session deleted successfully!'
    }), 200