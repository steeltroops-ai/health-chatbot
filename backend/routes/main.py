from flask import Blueprint, jsonify

main_bp = Blueprint('main', __name__)

@main_bp.route('/', methods=['GET'])
def index():
    """
    Root endpoint that provides basic API information
    """
    return jsonify({
        'message': 'Health Chatbot API',
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
    return jsonify({
        'status': 'healthy'
    }), 200