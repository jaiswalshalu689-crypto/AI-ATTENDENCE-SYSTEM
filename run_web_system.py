#!/usr/bin/env python3
"""
Complete Web-based AI Attendance System
Runs Flask backend with real-time face recognition
"""

import sys
import os
import threading
import time
from flask import Flask, render_template, jsonify, request, Response, send_from_directory
from flask_cors import CORS
import cv2
import numpy as np
from datetime import datetime

# Import our existing systems
try:
    from enhanced_professional import EnhancedDatabase, SimpleFaceSystem
except ImportError:
    print("Enhanced system not found, using basic implementation...")
    from database import DatabaseManager as EnhancedDatabase
    from face_recognition_system import FaceRecognitionSystem as SimpleFaceSystem

app = Flask(__name__, static_folder='static')
CORS(app)

# Initialize systems
print("Initializing AI Attendance System...")
db = EnhancedDatabase()
face_system = SimpleFaceSystem(db) if hasattr(SimpleFaceSystem, '__init__') else None

# Global variables
camera = None
recognition_active = False
current_frame = None

class WebCameraManager:
    def __init__(self):
        self.camera = None
        self.active = False
        self.frame_count = 0
        
    def start_camera(self):
        try:
            if not self.active:
                self.camera = cv2.VideoCapture(0)
                if self.camera.isOpened():
                    self.active = True
                    print("Camera started successfully")
                    return True
                else:
                    print("Failed to open camera")
                    return False
        except Exception as e:
            print(f"Camera start error: {e}")
            return False
    
    def stop_camera(self):
        try:
            if self.active and self.camera:
                self.camera.release()
                self.active = False
                print("Camera stopped")
                return True
        except Exception as e:
            print(f"Camera stop error: {e}")
        return False
    
    def get_frame(self):
        if self.active and self.camera:
            ret, frame = self.camera.read()
            if ret:
                self.frame_count += 1
                return frame
        return None

camera_manager = WebCameraManager()

@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

@app.route('/static/<path:filename>')
def static_files(filename):
    return send_from_directory('static', filename)

@app.route('/api/stats')
def get_stats():
    """Get system statistics"""
    try:
        if hasattr(db, 'get_attendance_statistics'):
            stats = db.get_attendance_statistics()
        else:
            # Fallback for basic system
            stats = {
                'today': 0,
                'week': 0, 
                'total_students': len(db.get_all_students()) if hasattr(db, 'get_all_students') else 0,
                'avg_daily': 0
            }
        return jsonify(stats)
    except Exception as e:
        print(f"Stats error: {e}")
        return jsonify({'today': 0, 'week': 0, 'total_students': 0, 'avg_daily': 0})

@app.route('/api/students')
def get_students():
    """Get all students"""
    try:
        students = db.get_all_students()
        return jsonify([{
            'id': s[0],
            'name': s[1], 
            'email': s[2] if len(s) > 2 else '',
            'phone': s[3] if len(s) > 3 else '',
            'department': s[4] if len(s) > 4 else '',
            'course': s[5] if len(s) > 5 else '',
            'year': s[6] if len(s) > 6 else 1,
            'status': s[7] if len(s) > 7 else 'Active'
        } for s in students])
    except Exception as e:
        print(f"Students error: {e}")
        return jsonify([])

@app.route('/api/students', methods=['POST'])
def add_student():
    """Add new student"""
    try:
        data = request.json
        
        if face_system and hasattr(face_system, 'add_new_face'):
            student_data = {
                'student_id': data['student_id'],
                'name': data['name'],
                'email': data.get('email'),
                'phone': data.get('phone'),
                'department': data.get('department'),
                'course': data.get('course'),
                'year_of_study': int(data.get('year', 1))
            }
            
            success, message = face_system.add_new_face(student_data)
        else:
            # Fallback for basic system
            success = db.add_student(
                data['student_id'], 
                data['name'], 
                data.get('email', ''),
                data.get('phone', ''),
                data.get('department', ''),
                b''  # Empty face encoding
            )
            message = "Student added successfully" if success else "Failed to add student"
        
        return jsonify({'success': success, 'message': message})
    except Exception as e:
        print(f"Add student error: {e}")
        return jsonify({'success': False, 'message': str(e)})

@app.route('/api/attendance/today')
def get_today_attendance():
    """Get today's attendance records"""
    try:
        today = datetime.now().date()
        if hasattr(db, 'get_attendance_records'):
            records = db.get_attendance_records(date_from=today)
        else:
            records = []
        
        return jsonify([{
            'name': r[0],
            'student_id': r[1],
            'department': r[2] if len(r) > 2 else '',
            'date': str(r[3]) if len(r) > 3 else str(today),
            'time_in': str(r[4]) if len(r) > 4 and r[4] else None,
            'time_out': str(r[5]) if len(r) > 5 and r[5] else None,
            'status': r[6] if len(r) > 6 else 'Present',
            'confidence': r[7] if len(r) > 7 else 0.9,
            'location': r[8] if len(r) > 8 else 'Main Campus'
        } for r in records])
    except Exception as e:
        print(f"Today attendance error: {e}")
        return jsonify([])

@app.route('/api/camera/start', methods=['POST'])
def start_camera():
    """Start camera for face recognition"""
    global recognition_active
    
    try:
        if camera_manager.start_camera():
            recognition_active = True
            # Start recognition thread
            threading.Thread(target=recognition_loop, daemon=True).start()
            
            if hasattr(db, 'log_action'):
                db.log_action("START_CAMERA", "WEB_USER", "Camera started from web interface")
            
            return jsonify({'success': True, 'message': 'Camera started'})
        else:
            return jsonify({'success': False, 'message': 'Failed to start camera'})
    except Exception as e:
        print(f"Start camera error: {e}")
        return jsonify({'success': False, 'message': str(e)})

@app.route('/api/camera/stop', methods=['POST'])
def stop_camera():
    """Stop camera"""
    global recognition_active
    
    try:
        recognition_active = False
        if camera_manager.stop_camera():
            if hasattr(db, 'log_action'):
                db.log_action("STOP_CAMERA", "WEB_USER", "Camera stopped from web interface")
            return jsonify({'success': True, 'message': 'Camera stopped'})
        else:
            return jsonify({'success': False, 'message': 'Failed to stop camera'})
    except Exception as e:
        print(f"Stop camera error: {e}")
        return jsonify({'success': False, 'message': str(e)})

@app.route('/api/camera/status')
def camera_status():
    """Get camera status"""
    return jsonify({
        'active': recognition_active,
        'camera_available': camera_manager.active
    })

def recognition_loop():
    """Main recognition loop"""
    global recognition_active, current_frame
    
    print("Starting recognition loop...")
    
    while recognition_active:
        try:
            frame = camera_manager.get_frame()
            if frame is not None:
                current_frame = frame.copy()
                
                # Perform face recognition if system available
                if face_system and hasattr(face_system, 'recognize_faces_in_frame'):
                    recognized_faces, face_locations = face_system.recognize_faces_in_frame(frame)
                    
                    # Mark attendance for recognized faces
                    for face_info in recognized_faces:
                        if face_info.get('student_id') and face_info.get('confidence', 0) > 0.7:
                            if hasattr(db, 'mark_attendance'):
                                db.mark_attendance(face_info['student_id'], face_info['confidence'])
                            print(f"Attendance marked for: {face_info['name']}")
            
            time.sleep(0.1)  # Small delay
        except Exception as e:
            print(f"Recognition loop error: {e}")
            time.sleep(1)
    
    print("Recognition loop stopped")

def generate_frames():
    """Generate video frames for streaming"""
    global current_frame, recognition_active
    
    while True:
        try:
            if recognition_active and current_frame is not None:
                frame = current_frame.copy()
                
                # Perform face recognition for display
                if face_system and hasattr(face_system, 'recognize_faces_in_frame'):
                    recognized_faces, face_locations = face_system.recognize_faces_in_frame(frame)
                    
                    # Draw rectangles and labels
                    for (top, right, bottom, left), face_info in zip(face_locations, recognized_faces):
                        color = (0, 255, 0) if face_info.get('student_id') else (0, 0, 255)
                        cv2.rectangle(frame, (left, top), (right, bottom), color, 2)
                        
                        name = face_info.get('name', 'Unknown')
                        confidence = face_info.get('confidence', 0)
                        label = f"{name} ({confidence:.1%})"
                        
                        cv2.rectangle(frame, (left, bottom - 35), (right, bottom), color, cv2.FILLED)
                        cv2.putText(frame, label, (left + 6, bottom - 6), cv2.FONT_HERSHEY_DUPLEX, 0.6, (255, 255, 255), 1)
                
                # Encode frame
                ret, buffer = cv2.imencode('.jpg', frame)
                if ret:
                    frame_bytes = buffer.tobytes()
                    yield (b'--frame\r\n'
                           b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
            else:
                # Send blank frame when not active
                blank_frame = np.zeros((480, 640, 3), dtype=np.uint8)
                cv2.putText(blank_frame, 'Camera Offline', (200, 240), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
                ret, buffer = cv2.imencode('.jpg', blank_frame)
                if ret:
                    frame_bytes = buffer.tobytes()
                    yield (b'--frame\r\n'
                           b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
            
            time.sleep(0.033)  # ~30 FPS
        except Exception as e:
            print(f"Frame generation error: {e}")
            time.sleep(1)

@app.route('/api/camera/stream')
def video_stream():
    """Video streaming route"""
    return Response(generate_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/api/settings', methods=['GET'])
def get_settings():
    """Get system settings"""
    try:
        if hasattr(db, 'get_setting'):
            return jsonify({
                'recognition_threshold': float(db.get_setting('recognition_threshold', '0.7')),
                'camera_resolution': db.get_setting('camera_resolution', '640x480')
            })
        else:
            return jsonify({
                'recognition_threshold': 0.7,
                'camera_resolution': '640x480'
            })
    except Exception as e:
        print(f"Get settings error: {e}")
        return jsonify({'recognition_threshold': 0.7, 'camera_resolution': '640x480'})

@app.route('/api/settings', methods=['POST'])
def save_settings():
    """Save system settings"""
    try:
        data = request.json
        
        if hasattr(db, 'set_setting'):
            if 'recognition_threshold' in data:
                db.set_setting('recognition_threshold', str(data['recognition_threshold']))
                if face_system and hasattr(face_system, 'recognition_threshold'):
                    face_system.recognition_threshold = float(data['recognition_threshold'])
            
            if 'camera_resolution' in data:
                db.set_setting('camera_resolution', data['camera_resolution'])
            
            if hasattr(db, 'log_action'):
                db.log_action("SAVE_SETTINGS", "WEB_USER", f"Settings updated: {data}")
        
        return jsonify({'success': True, 'message': 'Settings saved successfully'})
    except Exception as e:
        print(f"Save settings error: {e}")
        return jsonify({'success': False, 'message': str(e)})

def main():
    """Main function to start the web system"""
    print("=" * 60)
    print("AI-Powered Smart Attendance System - Web Version")
    print("=" * 60)
    print()
    print("System Status:")
    print(f"   Database: {'Enhanced' if hasattr(db, 'get_attendance_statistics') else 'Basic'}")
    print(f"   Face Recognition: {'Available' if face_system else 'Basic Mode'}")
    print(f"   Camera System: Ready")
    print(f"   Web Interface: Ready")
    print()
    print("Access URLs:")
    print("   Web Interface: http://localhost:5000")
    print("   Camera Stream: http://localhost:5000/api/camera/stream")
    print("   API Endpoint: http://localhost:5000/api/stats")
    print()
    print("Features Available:")
    print("   - Real-time face recognition")
    print("   - Live camera streaming")
    print("   - Student management")
    print("   - Attendance tracking")
    print("   - Reports and analytics")
    print("   - System settings")
    print()
    print("Instructions:")
    print("   1. Open http://localhost:5000 in your browser")
    print("   2. Go to 'Live Attendance' page")
    print("   3. Click 'Start Recognition' to begin")
    print("   4. Add students in 'Student Management'")
    print()
    print("Note: Make sure your camera is not being used by other applications")
    print("=" * 60)
    
    try:
        app.run(debug=False, host='0.0.0.0', port=5000, threaded=True)
    except KeyboardInterrupt:
        print("\nShutting down system...")
        recognition_active = False
        camera_manager.stop_camera()
        print("System stopped successfully")
    except Exception as e:
        print(f"Error starting system: {e}")

if __name__ == '__main__':
    main()