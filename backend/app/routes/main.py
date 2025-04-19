from flask import Blueprint, jsonify

bp = Blueprint('main', __name__)

@bp.route('/health')
def health_check():
    """Basic health check endpoint"""
    return jsonify({"status": "ok"}), 200

@bp.route('/')
def index():
    return jsonify({"message": "Welcome to the Investment Projection API"}), 200 