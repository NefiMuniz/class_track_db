"""
Flask REST API for ClassTrack
Main application file with all API endpoints

ENVIRONMENT CONFIGURATION:
- Automatically detects development vs production via FLASK_ENV
- Local: Uses .env file (loaded by python-dotenv)
- Production: Uses environment variables from hosting platform
"""
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from config import get_config
from database import init_database, seed_sample_data
import models
import os

# Load environment variables from .env file (for local development)
from dotenv import load_dotenv
load_dotenv()

# ==================== APPLICATION SETUP ====================

# Get configuration based on environment
config_class = get_config()

# Create Flask app
app = Flask(__name__, static_folder='../frontend', static_url_path='')

# Load configuration
app.config.from_object(config_class)
config_class.init_app(app)

# Enable CORS with configuration
CORS(app, resources={
    r"/api/*": {
        "origins": app.config['CORS_ORIGINS'],
        "methods": ["GET", "POST", "PUT", "PATCH", "DELETE"],
        "allow_headers": ["Content-Type"]
    }
})

# Initialize database on first run
with app.app_context():
    init_database()
    print(f"✅ Database initialized: {app.config['DATABASE_PATH']}")

# ==================== COURSE ENDPOINTS ====================

@app.route('/api/courses', methods=['GET'])
def get_courses():
    """GET all courses with statistics"""
    try:
        courses = models.get_all_courses()
        return jsonify({
            'success': True,
            'data': courses
        })
    except Exception as e:
        app.logger.error(f"Error fetching courses: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/courses/<int:course_id>', methods=['GET'])
def get_course(course_id):
    """GET single course by ID"""
    try:
        course = models.get_course_by_id(course_id)
        if course:
            return jsonify({
                'success': True,
                'data': course
            })
        return jsonify({
            'success': False,
            'error': 'Course not found'
        }), 404
    except Exception as e:
        app.logger.error(f"Error fetching course {course_id}: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/courses', methods=['POST'])
def create_course():
    """POST create new course"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required = ['name', 'code', 'color', 'credits', 'semester']
        for field in required:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400
        
        course_id = models.create_course(data)
        
        return jsonify({
            'success': True,
            'data': {'id': course_id}
        }), 201
    except Exception as e:
        app.logger.error(f"Error creating course: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/courses/<int:course_id>', methods=['PUT'])
def update_course(course_id):
    """PUT update existing course"""
    try:
        data = request.get_json()
        models.update_course(course_id, data)
        
        return jsonify({
            'success': True,
            'message': 'Course updated successfully'
        })
    except Exception as e:
        app.logger.error(f"Error updating course {course_id}: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/courses/<int:course_id>', methods=['DELETE'])
def delete_course(course_id):
    """DELETE course"""
    try:
        models.delete_course(course_id)
        
        return jsonify({
            'success': True,
            'message': 'Course deleted successfully'
        })
    except Exception as e:
        app.logger.error(f"Error deleting course {course_id}: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ==================== ASSIGNMENT ENDPOINTS ====================

@app.route('/api/assignments', methods=['GET'])
def get_assignments():
    """GET all assignments with course info"""
    try:
        assignments = models.get_all_assignments()
        return jsonify({
            'success': True,
            'data': assignments
        })
    except Exception as e:
        app.logger.error(f"Error fetching assignments: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/assignments/<int:assignment_id>', methods=['GET'])
def get_assignment(assignment_id):
    """GET single assignment by ID"""
    try:
        assignment = models.get_assignment_by_id(assignment_id)
        if assignment:
            return jsonify({
                'success': True,
                'data': assignment
            })
        return jsonify({
            'success': False,
            'error': 'Assignment not found'
        }), 404
    except Exception as e:
        app.logger.error(f"Error fetching assignment {assignment_id}: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/assignments', methods=['POST'])
def create_assignment():
    """POST create new assignment"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required = ['courseId', 'title', 'dueDate', 'priority']
        for field in required:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400
        
        assignment_id = models.create_assignment(data)
        
        return jsonify({
            'success': True,
            'data': {'id': assignment_id}
        }), 201
    except Exception as e:
        app.logger.error(f"Error creating assignment: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/assignments/<int:assignment_id>', methods=['PUT'])
def update_assignment(assignment_id):
    """PUT update existing assignment"""
    try:
        data = request.get_json()
        models.update_assignment(assignment_id, data)
        
        return jsonify({
            'success': True,
            'message': 'Assignment updated successfully'
        })
    except Exception as e:
        app.logger.error(f"Error updating assignment {assignment_id}: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/assignments/<int:assignment_id>/complete', methods=['PATCH'])
def toggle_complete(assignment_id):
    """PATCH toggle assignment completion"""
    try:
        new_status = models.toggle_assignment_complete(assignment_id)
        
        if new_status is not None:
            return jsonify({
                'success': True,
                'data': {'completed': bool(new_status)}
            })
        return jsonify({
            'success': False,
            'error': 'Assignment not found'
        }), 404
    except Exception as e:
        app.logger.error(f"Error toggling assignment {assignment_id}: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/assignments/<int:assignment_id>', methods=['DELETE'])
def delete_assignment(assignment_id):
    """DELETE assignment"""
    try:
        models.delete_assignment(assignment_id)
        
        return jsonify({
            'success': True,
            'message': 'Assignment deleted successfully'
        })
    except Exception as e:
        app.logger.error(f"Error deleting assignment {assignment_id}: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    
# ==================== SEEDING DATABASE ========================

@app.route('/api/seed', methods=['POST'])
def seed_database():
    try:
        seed_sample_data()  # Existing function
        return jsonify({'success': True, 'message': 'Database seeded with sample data.'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ==================== STATISTICS & REPORTS ====================

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """GET overall statistics"""
    try:
        stats = models.get_statistics()
        return jsonify({
            'success': True,
            'data': stats
        })
    except Exception as e:
        app.logger.error(f"Error fetching statistics: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/assignments/week', methods=['GET'])
def get_week_assignments():
    """GET assignments due this week"""
    try:
        assignments = models.get_assignments_due_this_week()
        return jsonify({
            'success': True,
            'data': assignments
        })
    except Exception as e:
        app.logger.error(f"Error fetching week assignments: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ==================== FRONTEND SERVING ====================

@app.route('/')
def index():
    """Serve frontend index.html"""
    return app.send_static_file('index.html')

@app.route('/<path:path>')
def serve_static(path):
    """Serve static files"""
    try:
        return send_from_directory(app.static_folder, path)
    except:
        # If file not found, serve index.html (for SPA routing)
        return app.send_static_file('index.html')

# ==================== ERROR HANDLERS ====================

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({
        'success': False,
        'error': 'Endpoint not found'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    app.logger.error(f"Internal error: {str(error)}")
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500

# ==================== APPLICATION STARTUP ====================

if __name__ == '__main__':
    print("\n" + "=" * 60)
    print("🚀 ClassTrack Flask API Starting...")
    print("=" * 60)
    print(f"📊 Database: {app.config['DATABASE_PATH']}")
    print(f"🌐 Server: http://{app.config['HOST']}:{app.config['PORT']}")
    print(f"🔧 Environment: {os.environ.get('FLASK_ENV', 'development')}")
    print(f"🐛 Debug Mode: {app.config['DEBUG']}")
    print("=" * 60)
    print("\nPress CTRL+C to stop\n")
    
    app.run(
        host=app.config['HOST'],
        port=app.config['PORT'],
        debug=app.config['DEBUG']
    )
