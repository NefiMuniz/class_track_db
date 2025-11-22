"""
Configuration settings for ClassTrack Flask application

ENVIRONMENT SWITCHING:
- Local Development: Uses .env file with development settings
- Production: Uses environment variables set in hosting platform

The application automatically detects the environment based on FLASK_ENV
"""
import os
from pathlib import Path

# Get the backend directory path
BASE_DIR = Path(__file__).parent

class Config:
    """Base configuration with safe defaults"""
    
    # ========== SECRET KEY ==========
    # CRITICAL: Must be set via environment variable
    # Local: Set in .env file
    # Production: Set in hosting platform (Render/Railway)
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-fallback-DO-NOT-USE-IN-PRODUCTION'
    
    # Warn if using fallback key
    if SECRET_KEY == 'dev-fallback-DO-NOT-USE-IN-PRODUCTION':
        print("⚠️  WARNING: Using fallback SECRET_KEY. Set SECRET_KEY in environment!")
    
    # ========== DATABASE CONFIGURATION ==========
    DATABASE_NAME = 'classtrack.db'
    DATABASE_PATH = os.environ.get('DATABASE_PATH') or str(BASE_DIR / DATABASE_NAME)
    
    # ========== CORS CONFIGURATION ==========
    # Local: http://localhost:5000,http://127.0.0.1:5000
    # Production: https://your-app.onrender.com
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', 'http://localhost:5000').split(',')
    
    # ========== FLASK SETTINGS ==========
    DEBUG = False
    TESTING = False
    
    # ========== SERVER SETTINGS ==========
    HOST = os.environ.get('HOST', '0.0.0.0')
    PORT = int(os.environ.get('PORT', 5000))
    
    @staticmethod
    def init_app(app):
        """Initialize application with config-specific settings"""
        pass

class DevelopmentConfig(Config):
    """
    Development configuration
    
    Used when FLASK_ENV=development (default for local work)
    Enables debug mode, verbose logging, and local-friendly settings
    """
    DEBUG = True
    
    # Override CORS for local development
    CORS_ORIGINS = os.environ.get(
        'CORS_ORIGINS', 
        'http://localhost:5000,http://127.0.0.1:5000'
    ).split(',')
    
    @staticmethod
    def init_app(app):
        """Development-specific initialization"""
        print("=" * 60)
        print("🔧 RUNNING IN DEVELOPMENT MODE")
        print("=" * 60)
        print(f"📊 Database: {app.config['DATABASE_PATH']}")
        print(f"🔑 Secret Key: {'SET' if app.config['SECRET_KEY'] != 'dev-fallback-DO-NOT-USE-IN-PRODUCTION' else '⚠️  FALLBACK'}")
        print(f"🌐 CORS Origins: {app.config['CORS_ORIGINS']}")
        print(f"🚀 Server: {app.config['HOST']}:{app.config['PORT']}")
        print("=" * 60)

class ProductionConfig(Config):
    """
    Production configuration
    
    Used when FLASK_ENV=production (set in hosting platform)
    Disables debug mode, enables production logging and security
    """
    DEBUG = False
    
    # Enforce environment variables in production
    @property
    def SECRET_KEY(self):
        secret = os.environ.get('SECRET_KEY')
        if not secret or secret == 'dev-fallback-DO-NOT-USE-IN-PRODUCTION':
            raise ValueError(
                "SECRET_KEY must be set in production environment! "
                "Generate with: python -c \"import secrets; print(secrets.token_hex(32))\""
            )
        return secret
    
    @staticmethod
    def init_app(app):
        """Production-specific initialization"""
        import logging
        from logging.handlers import RotatingFileHandler
        
        # Log to stdout for hosting platforms
        stream_handler = logging.StreamHandler()
        stream_handler.setLevel(logging.INFO)
        app.logger.addHandler(stream_handler)
        app.logger.setLevel(logging.INFO)
        
        print("=" * 60)
        print("🚀 RUNNING IN PRODUCTION MODE")
        print("=" * 60)
        print(f"📊 Database: {app.config['DATABASE_PATH']}")
        print(f"🔑 Secret Key: SET")
        print(f"🌐 CORS Origins: {app.config['CORS_ORIGINS']}")
        print(f"🔒 Debug: {app.config['DEBUG']}")
        print("=" * 60)
        
        app.logger.info('ClassTrack production startup complete')

# Configuration dictionary
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}

def get_config():
    """
    Get configuration based on FLASK_ENV environment variable
    
    Returns appropriate config class based on environment:
    - development: DevelopmentConfig (default)
    - production: ProductionConfig
    """
    env = os.environ.get('FLASK_ENV', 'development')
    return config.get(env, config['default'])
