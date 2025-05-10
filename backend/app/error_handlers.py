from flask import jsonify
from werkzeug.exceptions import HTTPException
import json

# It's good practice to get the logger from the current app,
# but for a separate module, we might need to pass the app or db instance,
# or define a way to access them if these handlers need them (e.g., for db.session.rollback).
# For now, assuming db access might be needed for the 500 handler.

def register_error_handlers(app, db):
    @app.errorhandler(HTTPException)
    def handle_exception(e):
        """Return JSON instead of HTML for HTTP errors."""
        response = e.get_response()
        response.data = json.dumps({
            "code": e.code,
            "name": e.name,
            "description": e.description,
        })
        response.content_type = "application/json"
        return response

    @app.errorhandler(404)
    def handle_404_error(e):
        return jsonify(error=str(e.description or "Not Found")), 404

    @app.errorhandler(500)
    def handle_500_error(e):
        original_exception = getattr(e, "original_exception", None)
        app.logger.error(
            f"Internal Server Error: {e.description}",
            exc_info=original_exception or e
        )
        try:
            db.session.rollback()
            app.logger.info("Database session rolled back due to 500 error.")
        except Exception as rollback_error:
            app.logger.error(f"Error during database rollback after 500 error: {rollback_error}", exc_info=rollback_error)
        return jsonify(error=str(e.description or "Internal Server Error")), 500
    
    @app.errorhandler(400)
    def handle_400_error(e):
        return jsonify(error=str(e.description or "Bad Request")), 400

    @app.errorhandler(401)
    def handle_401_error(e):
        return jsonify(error=str(e.description or "Unauthorized")), 401

    @app.errorhandler(403)
    def handle_403_error(e):
        return jsonify(error=str(e.description or "Forbidden")), 403 