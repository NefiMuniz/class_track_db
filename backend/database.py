import sqlite3
from pathlib import Path
from datetime import datetime
from config import Config

def get_db_connection():
    conn = sqlite3.connect(Config.DATABASE_PATH, timeout=10)
    conn.row_factory = sqlite3.Row  # Access columns by name
    conn.execute('PRAGMA foreign_keys = ON')
    conn.execute('PRAGMA journal_mode=WAL')
    return conn

def init_database():
    """
    Initialize database with required tables
    Creates: courses, assignments, assignment_history
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create Courses table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS courses (
        course_id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_name TEXT NOT NULL,
        course_code TEXT NOT NULL UNIQUE,
        color TEXT NOT NULL,
        credits INTEGER NOT NULL,
        semester TEXT NOT NULL,
        archived INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # Create Assignments table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS assignments (
        assignment_id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        due_date DATE NOT NULL,
        priority TEXT CHECK(priority IN ('low', 'medium', 'high')) NOT NULL,
        points INTEGER DEFAULT 0,
        completed INTEGER DEFAULT 0,
        completed_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE
    )
    ''')
    
    # Create Assignment History table (audit trail)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS assignment_history (
        history_id INTEGER PRIMARY KEY AUTOINCREMENT,
        assignment_id INTEGER NOT NULL,
        action TEXT NOT NULL,
        action_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        old_value TEXT,
        new_value TEXT,
        FOREIGN KEY (assignment_id) REFERENCES assignments(assignment_id)
    )
    ''')
    
    conn.commit()
    conn.close()
    
    print(f"✅ Database initialized at: {Config.DATABASE_PATH}")

def seed_sample_data():
    """
    Insert sample data for testing
    Only runs if database is empty
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if data already exists
    cursor.execute('SELECT COUNT(*) FROM courses')
    if cursor.fetchone()[0] > 0:
        print("ℹ️  Database already contains data. Skipping seed.")
        conn.close()
        return
    
    # Insert sample courses
    sample_courses = [
        ('Applied Programming', 'CSE 310', '#0062B8', 3, 'Fall 2025'),
        ('Personal Health', 'PUBH 132', '#28A745', 2, 'Fall 2025'),
        ('Statistics', 'MATH 221', '#FFB81C', 3, 'Fall 2025')
    ]
    
    cursor.executemany('''
    INSERT INTO courses (course_name, course_code, color, credits, semester)
    VALUES (?, ?, ?, ?, ?)
    ''', sample_courses)
    
    # Insert sample assignments
    sample_assignments = [
        (1, 'JavaScript Module', 'Build task manager with localStorage', '2025-11-22', 'high', 100, 1, '2025-11-08 15:30:00'),
        (1, 'Python Flask Backend', 'Implement REST API with SQLite', '2025-11-22', 'high', 100, 0, None),
        (2, 'Weekly Fitness Log', 'Track 150 minutes of activity', '2025-11-24', 'medium', 50, 0, None),
        (3, 'Probability Homework', 'Complete chapter 5 problems', '2025-11-20', 'medium', 75, 0, None)
    ]
    
    cursor.executemany('''
    INSERT INTO assignments (course_id, title, description, due_date, priority, points, completed, completed_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', sample_assignments)
    
    conn.commit()
    conn.close()
    
    print("✅ Sample data inserted successfully")

if __name__ == '__main__':
    # Run this file directly to initialize database
    print("Initializing ClassTrack database...")
    init_database()
    seed_sample_data()
    print("Database setup complete!")
