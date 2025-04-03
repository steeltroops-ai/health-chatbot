from flask import Flask
from flask_cors import CORS
from flask_restful import Api
from models.db import db
import redis
import os
from config import Config

# Import routes
from routes.auth import auth_bp
from routes.chat import chat_bp
from routes.history import history_bp
from routes.main import main_bp

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Initialize extensions
    CORS(app, resources={
        r"/*": {
            "origins": ["http://localhost:3000", "http://localhost:3001"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })
    db.init_app(app)
    
    # Initialize Redis for caching
    if not app.config['TESTING']:
        try:
            app.redis = redis.Redis(
                host=app.config['REDIS_HOST'],
                port=app.config['REDIS_PORT'],
                db=app.config['REDIS_DB'],
                socket_connect_timeout=2,
                socket_timeout=2,
                decode_responses=True
            )
            # Test the connection
            app.redis.ping()
            print("Redis connection successful")
        except (redis.ConnectionError, redis.TimeoutError) as e:
            print(f"Redis connection failed: {e}. Continuing without Redis caching.")
            app.redis = None
    
    # Register blueprints
    app.register_blueprint(main_bp)
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(chat_bp, url_prefix='/api/chat')
    app.register_blueprint(history_bp, url_prefix='/api/history')
    
    # Create database tables if they don't exist
    with app.app_context():
        db.create_all()
    
    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))