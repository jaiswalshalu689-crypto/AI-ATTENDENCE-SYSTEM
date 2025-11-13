import sqlite3
import os
from datetime import datetime

class DatabaseManager:
    def __init__(self):
        self.db_path = "attendance_system.db"
        self.init_database()
    
    def init_database(self):
        """Initialize database with required tables"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Students table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS students (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                email TEXT,
                phone TEXT,
                department TEXT,
                face_encoding BLOB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Attendance table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS attendance (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id TEXT NOT NULL,
                date DATE NOT NULL,
                time_in TIME,
                time_out TIME,
                status TEXT DEFAULT 'Present',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (student_id) REFERENCES students (student_id)
            )
        ''')
        
        conn.commit()
        conn.close()
    
    def add_student(self, student_id, name, email, phone, department, face_encoding):
        """Add new student to database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            cursor.execute('''
                INSERT INTO students (student_id, name, email, phone, department, face_encoding)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (student_id, name, email, phone, department, face_encoding))
            conn.commit()
            return True
        except sqlite3.IntegrityError:
            return False
        finally:
            conn.close()
    
    def get_all_students(self):
        """Get all students from database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('SELECT student_id, name, email, phone, department FROM students')
        students = cursor.fetchall()
        conn.close()
        return students
    
    def get_student_face_encodings(self):
        """Get all face encodings with student IDs"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('SELECT student_id, name, face_encoding FROM students WHERE face_encoding IS NOT NULL')
        data = cursor.fetchall()
        conn.close()
        return data
    
    def mark_attendance(self, student_id, status='Present'):
        """Mark attendance for a student"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        today = datetime.now().date()
        current_time = datetime.now().time()
        
        # Check if already marked today
        cursor.execute('''
            SELECT id, time_in FROM attendance 
            WHERE student_id = ? AND date = ?
        ''', (student_id, today))
        
        existing = cursor.fetchone()
        
        if existing:
            # Update time_out if already marked in
            if existing[1]:  # time_in exists
                cursor.execute('''
                    UPDATE attendance SET time_out = ? 
                    WHERE student_id = ? AND date = ?
                ''', (current_time, student_id, today))
        else:
            # Mark new attendance
            cursor.execute('''
                INSERT INTO attendance (student_id, date, time_in, status)
                VALUES (?, ?, ?, ?)
            ''', (student_id, today, current_time, status))
        
        conn.commit()
        conn.close()
        return True
    
    def get_attendance_records(self, date=None):
        """Get attendance records for a specific date or all"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        if date:
            cursor.execute('''
                SELECT s.name, s.student_id, a.date, a.time_in, a.time_out, a.status
                FROM attendance a
                JOIN students s ON a.student_id = s.student_id
                WHERE a.date = ?
                ORDER BY a.time_in
            ''', (date,))
        else:
            cursor.execute('''
                SELECT s.name, s.student_id, a.date, a.time_in, a.time_out, a.status
                FROM attendance a
                JOIN students s ON a.student_id = s.student_id
                ORDER BY a.date DESC, a.time_in
            ''')
        
        records = cursor.fetchall()
        conn.close()
        return records
    
    def delete_student(self, student_id):
        """Delete student and their attendance records"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('DELETE FROM attendance WHERE student_id = ?', (student_id,))
        cursor.execute('DELETE FROM students WHERE student_id = ?', (student_id,))
        
        conn.commit()
        conn.close()
        return True