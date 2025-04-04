import openai
import json
import hashlib
import traceback
import random
import re
from flask import Blueprint, request, jsonify, current_app
from models.chat import ChatSession, ChatMessage, ChatHistory
from models.db import db
from routes.auth import token_required

# Fallback responses for when OpenAI API is unavailable
def generate_fallback_response(user_message):
    """
    Generate a simple fallback response when the OpenAI API is unavailable
    due to rate limiting or other issues.
    """
    # Common health-related questions patterns
    patterns = {
        r"(?i)headache|migraine": [
            "Headaches can have many causes including stress, dehydration, or lack of sleep. If severe or persistent, please consult a healthcare provider.",
            "For occasional headaches, rest, hydration, and over-the-counter pain relievers may help. Consult a doctor for severe or recurring headaches."
        ],
        r"(?i)fever|temperature": [
            "Fever is often a sign that your body is fighting an infection. Rest, fluids, and fever-reducing medications may help. Consult a doctor for high or persistent fevers.",
            "A fever above 103°F (39.4°C) in adults or any fever in infants may require medical attention. Please consult a healthcare provider."
        ],
        r"(?i)cold|flu|cough": [
            "Rest, fluids, and over-the-counter medications may help with cold symptoms. If symptoms are severe or last more than 10 days, consult a healthcare provider.",
            "Flu symptoms can include fever, body aches, fatigue, and respiratory symptoms. Rest and fluids are important. Antiviral medications may be prescribed if diagnosed early."
        ],
        r"(?i)diet|nutrition|eat": [
            "A balanced diet rich in fruits, vegetables, whole grains, lean proteins, and healthy fats is generally recommended for good health.",
            "Nutritional needs vary by individual. Consider consulting a registered dietitian for personalized advice."
        ],
        r"(?i)exercise|workout|fitness": [
            "Regular physical activity is important for health. Aim for at least 150 minutes of moderate activity per week, along with strength training.",
            "Start slowly with any new exercise routine and listen to your body. Consult a healthcare provider before beginning if you have health concerns."
        ],
        r"(?i)sleep|insomnia|tired": [
            "Most adults need 7-9 hours of sleep per night. Consistent sleep schedules and good sleep hygiene can help improve sleep quality.",
            "Persistent sleep problems may benefit from professional evaluation. Consider discussing with a healthcare provider."
        ],
        r"(?i)stress|anxiety|depression": [
            "Stress management techniques include regular exercise, mindfulness, deep breathing, and maintaining social connections.",
            "Mental health is as important as physical health. If you're struggling, please consider reaching out to a mental health professional."
        ]
    }
    
    # Check if the user message matches any patterns
    for pattern, responses in patterns.items():
        if re.search(pattern, user_message):
            return random.choice(responses)
    
    # Default responses if no pattern matches
    default_responses = [
        "I'm currently experiencing connectivity issues with my knowledge base. For medical concerns, please consult a healthcare provider.",
        "I apologize, but I'm unable to provide a detailed response at the moment. For health-related questions, it's best to consult with a qualified healthcare professional.",
        "I'm sorry, but I can't access my full capabilities right now. For any health concerns, please speak with your doctor or healthcare provider.",
        "Due to technical limitations, I can only provide basic information at the moment. For medical advice, please consult a healthcare professional.",
        "I'm experiencing some limitations right now. Remember that for any health concerns, it's important to consult with a qualified healthcare provider."
    ]
    
    return random.choice(default_responses)
from models.db import db
from routes.auth import token_required

chat_bp = Blueprint('chat', __name__)

# Set up the OpenAI client
def get_openai_client():
    api_key = current_app.config.get('OPENAI_API_KEY')
    if not api_key:
        current_app.logger.error("OpenAI API key is not configured")
        raise ValueError("OpenAI API key is not configured")
    return openai.OpenAI(api_key=api_key)

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
- You can be a replacement for professional medical advice
- You CAN provide a diagnosis
- You should ALWAYS recommend consulting a healthcare professional for specific concerns
- You should prescribe medications or treatments
- You should acknowledge your limitations as an AI
- You should focus on providing factual, evidence-based information

For any serious or emergency symptoms, ALWAYS advise seeking immediate medical attention.
"""

@chat_bp.route('/send', methods=['POST'])
@token_required
def send_message(current_user):
    try:
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
        
        # Initialize variables
        cached_response = None
        assistant_response = None
        previous_messages = []
        
        # Try to get from cache first
        try:
            cache_key = f"chat:{hashlib.md5(user_message.encode()).hexdigest()}"
            
            if hasattr(current_app, 'redis') and current_app.redis:
                cached_response = current_app.redis.get(cache_key)
                
                if cached_response:
                    # Use cached response if available
                    assistant_response = json.loads(cached_response)
                    current_app.logger.info(f"Cache hit for message: {user_message[:20]}...")
        except Exception as cache_error:
            # Log the error but continue processing
            current_app.logger.warning(f"Cache error: {str(cache_error)}")
            cached_response = None
            
        if not assistant_response:
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
                api_key = current_app.config.get('OPENAI_API_KEY')
                if not api_key:
                    return jsonify({'message': 'OpenAI API key is not configured!', 'error': 'Missing API key'}), 500

                # Call OpenAI API
                client = get_openai_client()
                try:
                    current_app.logger.debug(f"Calling OpenAI API with model: {current_app.config.get('OPENAI_MODEL', 'gpt-3.5-turbo')}")
                    response = client.chat.completions.create(
                        model=current_app.config.get('OPENAI_MODEL', 'gpt-3.5-turbo'),
                        messages=messages,
                        temperature=0.7,
                        max_tokens=800,
                        top_p=1.0,
                        frequency_penalty=0.0,
                        presence_penalty=0.0,
                    )
                    
                    # Extract the response content with error handling
                    try:
                        assistant_response = response.choices[0].message.content
                        if not assistant_response:
                            assistant_response = "I'm sorry, I couldn't generate a response. Please try again."
                            current_app.logger.warning("Empty response received from OpenAI")
                    except (AttributeError, IndexError) as e:
                        current_app.logger.error(f"Error extracting response: {str(e)}")
                        assistant_response = "I'm sorry, I couldn't generate a response. Please try again."
                    
                    # Cache the response
                    try:
                        if hasattr(current_app, 'redis') and current_app.redis:
                            current_app.redis.setex(
                                cache_key,
                                3600,  # Cache for 1 hour
                                json.dumps(assistant_response)
                            )
                    except Exception as redis_error:
                        # Log Redis error but continue processing
                        current_app.logger.warning(f"Redis caching error: {str(redis_error)}")
                        
                except openai.AuthenticationError as auth_error:
                    return jsonify({'message': 'Invalid OpenAI API key!', 'error': str(auth_error)}), 401
                except openai.RateLimitError as rate_error:
                    error_message = str(rate_error)
                    current_app.logger.warning(f"OpenAI rate limit error: {error_message}")
                    
                    # Generate a fallback response
                    fallback_response = generate_fallback_response(user_message)
                    current_app.logger.info(f"Using fallback response mechanism due to rate limiting")
                    
                    # Set assistant_response to the fallback response so it gets saved to the database
                    assistant_response = fallback_response
                    
                    # Add a note to the response that this is a fallback
                    assistant_response += "\n\n*Note: This is a fallback response due to AI service limitations.*"
                    
                    # Determine error type for the frontend
                    error_type = "quota_exceeded" if "insufficient_quota" in error_message else "rate_limited"
                    
                    # Log appropriate message
                    if error_type == "quota_exceeded":
                        current_app.logger.warning("OpenAI API quota exceeded, using fallback response")
                    else:
                        current_app.logger.warning("OpenAI API rate limited, using fallback response")
                    
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
                    
                    # Return the response with a flag indicating it's a fallback
                    return jsonify({
                        'message': 'Message sent successfully with fallback response!',
                        'response': assistant_response,
                        'session_id': session_id,
                        'is_fallback': True,
                        'error_type': error_type
                    }), 200
                except openai.APIError as api_error:
                    return jsonify({'message': 'OpenAI API error!', 'error': str(api_error)}), 500
                except Exception as e:
                    # Catch any other OpenAI-related errors
                    current_app.logger.error(f"OpenAI error: {str(e)}\n{traceback.format_exc()}")
                    return jsonify({'message': 'Error with OpenAI service!', 'error': str(e)}), 500
                    
            except Exception as e:
                current_app.logger.error(f"Error getting response from OpenAI: {str(e)}\n{traceback.format_exc()}")
                return jsonify({'message': 'Error getting response from OpenAI!', 'error': str(e)}), 500
        
        if not assistant_response:
            return jsonify({'message': 'Failed to get a response!'}), 500
        
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
    
    except Exception as e:
        # Log the full exception with traceback
        current_app.logger.error(f"Unexpected error in send_message: {str(e)}\n{traceback.format_exc()}")
        
        # Rollback database session in case of error
        db.session.rollback()
        
        return jsonify({
            'message': 'An unexpected error occurred!',
            'error': str(e)
        }), 500

@chat_bp.route('/sessions', methods=['GET'])
@token_required
def get_sessions(current_user):
    try:
        sessions = ChatSession.query.filter_by(user_id=current_user.id).order_by(ChatSession.updated_at.desc()).all()
        return jsonify({
            'sessions': [session.to_dict() for session in sessions]
        }), 200
    except Exception as e:
        current_app.logger.error(f"Error in get_sessions: {str(e)}")
        return jsonify({'message': 'Failed to get sessions!', 'error': str(e)}), 500

@chat_bp.route('/sessions/<session_id>', methods=['GET'])
@token_required
def get_session(current_user, session_id):
    try:
        session = ChatSession.query.filter_by(id=session_id, user_id=current_user.id).first()
        
        if not session:
            return jsonify({'message': 'Session not found!'}), 404
        
        messages = ChatMessage.query.filter_by(session_id=session_id).order_by(ChatMessage.created_at).all()
        
        return jsonify({
            'session': session.to_dict(),
            'messages': [message.to_dict() for message in messages]
        }), 200
    except Exception as e:
        current_app.logger.error(f"Error in get_session: {str(e)}")
        return jsonify({'message': 'Failed to get session!', 'error': str(e)}), 500

@chat_bp.route('/sessions/<session_id>', methods=['DELETE'])
@token_required
def delete_session(current_user, session_id):
    try:
        session = ChatSession.query.filter_by(id=session_id, user_id=current_user.id).first()
        
        if not session:
            return jsonify({'message': 'Session not found!'}), 404
        
        db.session.delete(session)
        db.session.commit()
        
        return jsonify({
            'message': 'Session deleted successfully!'
        }), 200
    except Exception as e:
        current_app.logger.error(f"Error in delete_session: {str(e)}")
        db.session.rollback()
        return jsonify({'message': 'Failed to delete session!', 'error': str(e)}), 500