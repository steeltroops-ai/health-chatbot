from flask import Blueprint, request, jsonify, current_app
from models import User, db
import jwt
from datetime import datetime, timedelta
import uuid
from functools import wraps

auth_bp = Blueprint('auth', __name__)

# JWT token required decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Check if token is in headers
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            token = auth_header.split(" ")[1] if len(auth_header.split(" ")) > 1 else None
        
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
        
        try:
            # Decode the token
            data = jwt.decode(token, current_app.config['JWT_SECRET_KEY'], algorithms=["HS256"])
            current_user = User.query.filter_by(id=data['user_id']).first()
            
            if not current_user:
                return jsonify({'message': 'User not found!'}), 401
                
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token has expired!'}), 401
        except Exception as e:
            return jsonify({'message': 'Token is invalid!', 'error': str(e)}), 401
            
        return f(current_user, *args, **kwargs)
    
    return decorated

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    # Validate input
    if not data or not data.get('username') or not data.get('email') or not data.get('password'):
        return jsonify({'message': 'Missing required fields!'}), 400
    
    # Check if user exists
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'message': 'Username already exists!'}), 409
        
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'message': 'Email already exists!'}), 409
    
    # Create new user
    new_user = User(
        username=data['username'],
        email=data['email'],
        password=data['password']
    )
    
    # Add to database
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({
        'message': 'User registered successfully!',
        'user': new_user.to_dict()
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    # Validate input
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'message': 'Missing required fields!'}), 400
    
    # Find user by username
    user = User.query.filter_by(username=data['username']).first()
    
    # Check if user exists and password is correct
    if not user or not user.check_password(data['password']):
        return jsonify({'message': 'Invalid credentials!'}), 401
    
    # Generate access token
    access_token = jwt.encode({
        'user_id': user.id,
        'exp': datetime.utcnow() + current_app.config['JWT_ACCESS_TOKEN_EXPIRES']
    }, current_app.config['JWT_SECRET_KEY'])
    
    # Generate refresh token
    refresh_token = jwt.encode({
        'user_id': user.id,
        'exp': datetime.utcnow() + current_app.config['JWT_REFRESH_TOKEN_EXPIRES']
    }, current_app.config['JWT_SECRET_KEY'])
    
    return jsonify({
        'message': 'Login successful!',
        'user': user.to_dict(),
        'access_token': access_token,
        'refresh_token': refresh_token
    }), 200

@auth_bp.route('/refresh', methods=['POST'])
def refresh():
    data = request.get_json()
    
    if not data or not data.get('refresh_token'):
        return jsonify({'message': 'Refresh token is required!'}), 400
    
    refresh_token = data['refresh_token']
    
    try:
        # Decode the refresh token
        data = jwt.decode(refresh_token, current_app.config['JWT_SECRET_KEY'], algorithms=["HS256"])
        current_user = User.query.filter_by(id=data['user_id']).first()
        
        if not current_user:
            return jsonify({'message': 'User not found!'}), 401
            
        # Generate new access token
        access_token = jwt.encode({
            'user_id': current_user.id,
            'exp': datetime.utcnow() + current_app.config['JWT_ACCESS_TOKEN_EXPIRES']
        }, current_app.config['JWT_SECRET_KEY'])
        
        return jsonify({
            'access_token': access_token
        }), 200
            
    except jwt.ExpiredSignatureError:
        return jsonify({'message': 'Refresh token has expired!'}), 401
    except Exception as e:
        return jsonify({'message': 'Refresh token is invalid!', 'error': str(e)}), 401

@auth_bp.route('/me', methods=['GET'])
@token_required
def get_user(current_user):
    return jsonify({
        'user': current_user.to_dict()
    }), 200