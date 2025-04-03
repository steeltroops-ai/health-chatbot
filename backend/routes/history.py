from flask import Blueprint, request, jsonify, current_app
from models import ChatHistory, db
from routes.auth import token_required
from datetime import datetime, timedelta
from sqlalchemy import desc

history_bp = Blueprint('history', __name__)

@history_bp.route('/', methods=['GET'])
@token_required
def get_history(current_user):
    # Optional query parameters for pagination
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    # Maximum limit to prevent excessive data requests
    if per_page > 50:
        per_page = 50
    
    # Optional date filtering
    days = request.args.get('days', None, type=int)
    date_filter = None
    
    if days:
        date_filter = datetime.utcnow() - timedelta(days=days)
    
    # Query with pagination
    query = ChatHistory.query.filter_by(user_id=current_user.id)
    
    if date_filter:
        query = query.filter(ChatHistory.created_at >= date_filter)
    
    # Order by most recent first
    query = query.order_by(desc(ChatHistory.created_at))
    
    # Get paginated results
    paginated_history = query.paginate(page=page, per_page=per_page, error_out=False)
    
    # Prepare response
    history_items = [item.to_dict() for item in paginated_history.items]
    
    return jsonify({
        'history': history_items,
        'total': paginated_history.total,
        'pages': paginated_history.pages,
        'current_page': page
    }), 200

@history_bp.route('/<history_id>', methods=['GET'])
@token_required
def get_history_item(current_user, history_id):
    history_item = ChatHistory.query.filter_by(id=history_id, user_id=current_user.id).first()
    
    if not history_item:
        return jsonify({'message': 'History item not found!'}), 404
    
    return jsonify({
        'history_item': history_item.to_dict()
    }), 200

@history_bp.route('/<history_id>', methods=['DELETE'])
@token_required
def delete_history_item(current_user, history_id):
    history_item = ChatHistory.query.filter_by(id=history_id, user_id=current_user.id).first()
    
    if not history_item:
        return jsonify({'message': 'History item not found!'}), 404
    
    db.session.delete(history_item)
    db.session.commit()
    
    return jsonify({
        'message': 'History item deleted successfully!'
    }), 200

@history_bp.route('/clear', methods=['DELETE'])
@token_required
def clear_history(current_user):
    # Optional date filtering
    days = request.args.get('days', None, type=int)
    date_filter = None
    
    if days:
        date_filter = datetime.utcnow() - timedelta(days=days)
        
        # Delete filtered history
        query = ChatHistory.query.filter_by(user_id=current_user.id)
        query = query.filter(ChatHistory.created_at >= date_filter)
        deleted_count = query.delete()
    else:
        # Delete all history for the user
        deleted_count = ChatHistory.query.filter_by(user_id=current_user.id).delete()
    
    db.session.commit()
    
    return jsonify({
        'message': f'{deleted_count} history items deleted successfully!'
    }), 200