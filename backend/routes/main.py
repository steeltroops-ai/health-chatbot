from flask import Blueprint, jsonify, current_app

main_bp = Blueprint('main', __name__)

@main_bp.route('/', methods=['GET'])
def index():
    """
    Root endpoint that provides basic API information
    """
    return jsonify({
        'message': 'Medical Chatbot API',
        'version': '1.0',
        'status': 'online',
        'endpoints': {
            'auth': '/api/auth',
            'chat': '/api/chat',
            'history': '/api/history'
        }
    }), 200

@main_bp.route('/health', methods=['GET'])
def health_check():
    """
    Health check endpoint for monitoring
    """
    # Check database connection
    try:
        from models.db import db
        # Execute a simple query
        db.session.execute("SELECT 1")
        db_status = "connected"
    except Exception as e:
        current_app.logger.error(f"Database health check failed: {str(e)}")
        db_status = f"error: {str(e)}"
    
    # Check Redis connection if available
    redis_status = "not configured"
    if hasattr(current_app, 'redis') and current_app.redis:
        try:
            ping_result = current_app.redis.ping()
            redis_status = "connected" if ping_result else "error: ping failed"
        except Exception as e:
            current_app.logger.error(f"Redis health check failed: {str(e)}")
            redis_status = f"error: {str(e)}"
    
    return jsonify({
        'status': 'healthy',
        'database': db_status,
        'redis': redis_status,
        'environment': current_app.config.get('ENV', 'development')
    }), 200

@main_bp.route('/test-openai', methods=['GET'])
def test_openai():
    """Test endpoint for OpenAI integration"""
    try:
        from routes.chat import get_openai_client
        client = get_openai_client()
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": "Hello!"}],
            max_tokens=10
        )
        return jsonify({
            "success": True,
            "response": response.choices[0].message.content,
            "model": current_app.config.get('OPENAI_MODEL')
        })
    except Exception as e:
        current_app.logger.error(f"OpenAI test error: {str(e)}", exc_info=True)
        return jsonify({
            "success": False,
            "error": str(e),
            "error_type": type(e).__name__
        }), 500