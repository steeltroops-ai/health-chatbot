import os
from datetime import timedelta
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    # Flask settings
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
    DEBUG = os.environ.get('FLASK_DEBUG', 'False') == 'True'
    
    # Database settings
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'sqlite:///database.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_pre_ping': True,  # Enable connection pool pre-ping
    }
    
    # JWT settings
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', SECRET_KEY)
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    
    # OpenAI settings
    OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
    OPENAI_MODEL = os.environ.get('OPENAI_MODEL', 'gpt-3.5-turbo')
    
    # Redis settings
    REDIS_HOST = os.environ.get('REDIS_HOST', 'localhost')
    REDIS_PORT = int(os.environ.get('REDIS_PORT', 6379))
    REDIS_DB = int(os.environ.get('REDIS_DB', 0))
    
    # CORS settings
    CORS_HEADERS = 'Content-Type'
    
    # Logging
    LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO')

class DevelopmentConfig(Config):
    DEBUG = True
    ENV = 'development'
    # More verbose SQL logs in development
    SQLALCHEMY_ECHO = True

class ProductionConfig(Config):
    DEBUG = False
    ENV = 'production'
    # Use more secure settings in production
    SQLALCHEMY_ECHO = False
    
class TestingConfig(Config):
    TESTING = True
    ENV = 'testing'
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    # Disable Redis in testing
    REDIS_HOST = None