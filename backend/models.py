from database import get_db_connection
from datetime import datetime

# ==================== COURSE OPERATIONS ====================

def get_all_courses():
    """
    Retrieve all courses with assignment counts and completion stats
    Uses LEFT JOIN to include courses without assignments
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    sql = '''
    SELECT 
        c.course_id,
        c.course_name,
        c.course_code,
        c.color,
        c.credits,
        c.semester,
        c.archived,
        COUNT(a.assignment_id) as total_assignments,
        SUM(CASE WHEN a.completed = 1 THEN 1 ELSE 0 END) as completed_assignments
    FROM courses c
    LEFT JOIN assignments a ON c.course_id = a.course_id
    WHERE c.archived = 0
    GROUP BY c.course_id
    ORDER BY c.course_name
    '''
    
    cursor.execute(sql)
    rows = cursor.fetchall()
    conn.commit()
    conn.close()
    
    courses = []
    for row in rows:
        total = row['total_assignments']
        completed = row['completed_assignments'] or 0
        progress = (completed / total * 100) if total > 0 else 0
        
        courses.append({
            'id': row['course_id'],
            'name': row['course_name'],
            'code': row['course_code'],
            'color': row['color'],
            'credits': row['credits'],
            'semester': row['semester'],
            'totalAssignments': total,
            'completedAssignments': completed,
            'progress': round(progress, 1)
        })
    
    return courses

def get_course_by_id(course_id):
    """Get single course by ID"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM courses WHERE course_id = ?', (course_id,))
    row = cursor.fetchone()
    conn.commit()
    conn.close()
    
    if row:
        return {
            'id': row['course_id'],
            'name': row['course_name'],
            'code': row['course_code'],
            'color': row['color'],
            'credits': row['credits'],
            'semester': row['semester']
        }
    return None

def create_course(data):
    """
    Insert new course into database
    Returns the new course_id
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    sql = '''
    INSERT INTO courses (course_name, course_code, color, credits, semester)
    VALUES (?, ?, ?, ?, ?)
    '''
    
    cursor.execute(sql, (
        data['name'],
        data['code'],
        data['color'],
        data['credits'],
        data['semester']
    ))
    
    conn.commit()
    course_id = cursor.lastrowid
    conn.close()
    
    return course_id

def update_course(course_id, data):
    """Update existing course"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    sql = '''
    UPDATE courses 
    SET course_name = ?, course_code = ?, color = ?, credits = ?, semester = ?
    WHERE course_id = ?
    '''
    
    cursor.execute(sql, (
        data['name'],
        data['code'],
        data['color'],
        data['credits'],
        data['semester'],
        course_id
    ))
    
    conn.commit()
    conn.close()

def delete_course(course_id):
    """Delete course (cascades to assignments)"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('DELETE FROM courses WHERE course_id = ?', (course_id,))
    
    conn.commit()
    conn.close()

# ==================== ASSIGNMENT OPERATIONS ====================

def get_all_assignments():
    """
    Retrieve all assignments with course information
    Uses INNER JOIN to include course details
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    sql = '''
    SELECT 
        a.assignment_id,
        a.course_id,
        a.title,
        a.description,
        a.due_date,
        a.priority,
        a.points,
        a.completed,
        a.completed_date,
        c.course_name,
        c.course_code,
        c.color
    FROM assignments a
    INNER JOIN courses c ON a.course_id = c.course_id
    ORDER BY a.due_date ASC
    '''
    
    cursor.execute(sql)
    rows = cursor.fetchall()
    conn.commit()
    conn.close()
    
    assignments = []
    for row in rows:
        assignments.append({
            'id': row['assignment_id'],
            'courseId': row['course_id'],
            'title': row['title'],
            'description': row['description'],
            'dueDate': row['due_date'],
            'priority': row['priority'],
            'points': row['points'],
            'completed': bool(row['completed']),
            'completedDate': row['completed_date'],
            'courseName': row['course_name'],
            'courseCode': row['course_code'],
            'courseColor': row['color']
        })
    
    return assignments

def get_assignment_by_id(assignment_id):
    """Get single assignment by ID"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM assignments WHERE assignment_id = ?', (assignment_id,))
    row = cursor.fetchone()
    conn.commit()
    conn.close()
    
    if row:
        return {
            'id': row['assignment_id'],
            'courseId': row['course_id'],
            'title': row['title'],
            'description': row['description'],
            'dueDate': row['due_date'],
            'priority': row['priority'],
            'points': row['points'],
            'completed': bool(row['completed'])
        }
    return None

def create_assignment(data):
    """Insert new assignment"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    sql = '''
    INSERT INTO assignments (course_id, title, description, due_date, priority, points)
    VALUES (?, ?, ?, ?, ?, ?)
    '''
    
    cursor.execute(sql, (
        data['courseId'],
        data['title'],
        data.get('description', ''),
        data['dueDate'],
        data['priority'],
        data.get('points', 0)
    ))
    
    assignment_id = cursor.lastrowid
    
    # Log to history
    cursor.execute('''
    INSERT INTO assignment_history (assignment_id, action, new_value)
    VALUES (?, 'created', ?)
    ''', (assignment_id, data['title']))
    
    conn.commit()
    conn.close()
    
    return assignment_id

def update_assignment(assignment_id, data):
    """Update existing assignment"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    sql = '''
    UPDATE assignments 
    SET title = ?, description = ?, due_date = ?, priority = ?, points = ?
    WHERE assignment_id = ?
    '''
    
    cursor.execute(sql, (
        data['title'],
        data.get('description', ''),
        data['dueDate'],
        data['priority'],
        data.get('points', 0),
        assignment_id
    ))
    
    conn.commit()
    conn.close()

def toggle_assignment_complete(assignment_id):
    """Toggle assignment completion status"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get current status
    cursor.execute('SELECT completed FROM assignments WHERE assignment_id = ?', (assignment_id,))
    current = cursor.fetchone()
    
    if current:
        new_status = 0 if current['completed'] else 1
        completed_date = datetime.now().strftime('%Y-%m-%d %H:%M:%S') if new_status else None
        
        cursor.execute('''
        UPDATE assignments 
        SET completed = ?, completed_date = ?
        WHERE assignment_id = ?
        ''', (new_status, completed_date, assignment_id))
        
        # Log to history
        action = 'completed' if new_status else 'uncompleted'
        cursor.execute('''
        INSERT INTO assignment_history (assignment_id, action)
        VALUES (?, ?)
        ''', (assignment_id, action))
        
        conn.commit()
    
    conn.close()
    return new_status if current else None

def delete_assignment(assignment_id):
    """Delete assignment"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get title for history
    cursor.execute('SELECT title FROM assignments WHERE assignment_id = ?', (assignment_id,))
    row = cursor.fetchone()
    
    if row:
        # Log deletion
        cursor.execute('''
        INSERT INTO assignment_history (assignment_id, action, old_value)
        VALUES (?, 'deleted', ?)
        ''', (assignment_id, row['title']))
        
        # Delete assignment
        cursor.execute('DELETE FROM assignments WHERE assignment_id = ?', (assignment_id,))
        
        conn.commit()
    
    conn.close()

# ==================== STATISTICS & REPORTS ====================

def get_statistics():
    """
    Calculate overall statistics using aggregate functions
    Demonstrates SUM, COUNT, AVG
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    sql = '''
    SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN completed = 0 AND due_date < DATE('now') THEN 1 ELSE 0 END) as overdue,
        SUM(points) as total_points,
        SUM(CASE WHEN completed = 1 THEN points ELSE 0 END) as earned_points,
        AVG(CASE WHEN completed = 1 THEN points ELSE NULL END) as avg_completed_points
    FROM assignments
    '''
    
    cursor.execute(sql)
    result = cursor.fetchone()
    conn.commit()
    conn.close()
    
    total = result['total'] or 0
    completed = result['completed'] or 0
    completion_rate = (completed / total * 100) if total > 0 else 0
    
    return {
        'total': total,
        'completed': completed,
        'overdue': result['overdue'] or 0,
        'completionRate': round(completion_rate, 1),
        'totalPoints': result['total_points'] or 0,
        'earnedPoints': result['earned_points'] or 0,
        'avgCompletedPoints': round(result['avg_completed_points'] or 0, 2)
    }

def get_assignments_due_this_week():
    """
    Get assignments due in next 7 days
    Demonstrates date filtering
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    sql = '''
    SELECT 
        a.assignment_id,
        a.title,
        a.due_date,
        a.priority,
        a.points,
        c.course_name,
        c.color,
        JULIANDAY(a.due_date) - JULIANDAY('now') as days_until_due
    FROM assignments a
    INNER JOIN courses c ON a.course_id = c.course_id
    WHERE a.completed = 0
        AND a.due_date >= DATE('now')
        AND a.due_date <= DATE('now', '+7 days')
    ORDER BY a.due_date ASC
    '''
    
    cursor.execute(sql)
    rows = cursor.fetchall()
    conn.commit()
    conn.close()
    
    assignments = []
    for row in rows:
        assignments.append({
            'id': row['assignment_id'],
            'title': row['title'],
            'dueDate': row['due_date'],
            'priority': row['priority'],
            'points': row['points'],
            'courseName': row['course_name'],
            'courseColor': row['color'],
            'daysUntilDue': int(row['days_until_due'])
        })
    
    return assignments
