from flask import Flask
from flask_cors import CORS
from flask_restful import Api
from models.db import db
import redis
import os
import logging
import sys
from config import Config, DevelopmentConfig, ProductionConfig

# Setup enhanced logging
def setup_logging(app):
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    ))
    app.logger.addHandler(handler)
    app.logger.setLevel(logging.DEBUG)
    
    # Also log SQLAlchemy queries
    logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)
    
    return app

# Import routes
from routes.auth import auth_bp
from routes.chat import chat_bp
from routes.history import history_bp
from routes.main import main_bp  # Import the main blueprint

def create_app(config_class=DevelopmentConfig):  # Use DevelopmentConfig by default for better error messages
    app = Flask(__name__)
    app = setup_logging(app)
    app.config.from_object(config_class)
    
    # Initialize extensions
    CORS(app, resources={r"/*": {"origins": "*"}})
    db.init_app(app)
    
    # Initialize Redis for caching
    if not app.config.get('TESTING', False):
        try:
            app.redis = redis.Redis(
                host=app.config.get('REDIS_HOST', 'localhost'),
                port=app.config.get('REDIS_PORT', 6379),
                db=app.config.get('REDIS_DB', 0),
                socket_timeout=5,  # Add timeout to prevent hanging
                decode_responses=True  # Decode responses to strings
            )
            # Test Redis connection
            app.redis.ping()
            app.logger.info("Redis connection successful")
        except redis.RedisError as e:
            app.logger.warning(f"Redis connection failed: {str(e)}. Caching will be disabled.")
            app.redis = None
    
    # Register blueprints
    app.register_blueprint(main_bp, url_prefix='/')  # Register the main blueprint at root
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(chat_bp, url_prefix='/api/chat')
    app.register_blueprint(history_bp, url_prefix='/api/history')
    
    # Create database tables if they don't exist
    with app.app_context():
        db.create_all()
    
    # Add error handler for 500 errors
    @app.errorhandler(500)
    def handle_500_error(e):
        app.logger.error(f"Internal server error: {str(e)}")
        return {"message": "Internal server error", "error": str(e)}, 500
    
    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))