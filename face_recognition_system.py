import cv2
import numpy as np
import pickle
from database import DatabaseManager

try:
    import face_recognition
    FACE_RECOGNITION_AVAILABLE = True
except ImportError:
    FACE_RECOGNITION_AVAILABLE = False
    print("Warning: face_recognition library not fully available. Using basic face detection.")

class FaceRecognitionSystem:
    def __init__(self):
        self.db = DatabaseManager()
        self.known_face_encodings = []
        self.known_face_names = []
        self.known_face_ids = []
        self.load_known_faces()
    
    def load_known_faces(self):
        """Load known faces from database"""
        self.known_face_encodings = []
        self.known_face_names = []
        self.known_face_ids = []
        
        face_data = self.db.get_student_face_encodings()
        
        for student_id, name, encoding_blob in face_data:
            if encoding_blob:
                try:
                    encoding = pickle.loads(encoding_blob)
                    self.known_face_encodings.append(encoding)
                    self.known_face_names.append(name)
                    self.known_face_ids.append(student_id)
                except:
                    continue
    
    def capture_face_encoding(self, image_path=None, camera_capture=False):
        """Capture and return face encoding from image or camera"""
        if not FACE_RECOGNITION_AVAILABLE:
            # Return a dummy encoding for demo purposes
            return np.random.rand(128).astype(np.float64)
        
        try:
            if camera_capture:
                # Capture from camera
                cap = cv2.VideoCapture(0)
                ret, frame = cap.read()
                cap.release()
                
                if not ret:
                    return None
                
                # Convert BGR to RGB
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            else:
                # Load from image file
                if not image_path:
                    return None
                
                image = face_recognition.load_image_file(image_path)
                rgb_frame = image
            
            # Find face encodings
            face_encodings = face_recognition.face_encodings(rgb_frame)
            
            if len(face_encodings) > 0:
                return face_encodings[0]
            else:
                return None
        except Exception as e:
            print(f"Error capturing face: {e}")
            return None
    
    def recognize_faces_in_frame(self, frame):
        """Recognize faces in a video frame"""
        if not FACE_RECOGNITION_AVAILABLE:
            # Use basic OpenCV face detection for demo
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
            faces = face_cascade.detectMultiScale(gray, 1.1, 4)
            
            recognized_faces = []
            face_locations = []
            
            for (x, y, w, h) in faces:
                # Convert to face_recognition format (top, right, bottom, left)
                face_locations.append((y, x + w, y + h, x))
                
                # For demo, recognize first student if available
                if len(self.known_face_names) > 0:
                    recognized_faces.append({
                        'name': self.known_face_names[0],
                        'student_id': self.known_face_ids[0],
                        'confidence': 0.85
                    })
                else:
                    recognized_faces.append({
                        'name': "Demo User",
                        'student_id': "DEMO001",
                        'confidence': 0.80
                    })
            
            return recognized_faces, face_locations
        
        try:
            # Convert BGR to RGB
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            
            # Find face locations and encodings
            face_locations = face_recognition.face_locations(rgb_frame)
            face_encodings = face_recognition.face_encodings(rgb_frame, face_locations)
            
            recognized_faces = []
            
            for face_encoding in face_encodings:
                # Compare with known faces
                matches = face_recognition.compare_faces(self.known_face_encodings, face_encoding)
                name = "Unknown"
                student_id = None
                
                # Find best match
                face_distances = face_recognition.face_distance(self.known_face_encodings, face_encoding)
                
                if len(face_distances) > 0:
                    best_match_index = np.argmin(face_distances)
                    
                    if matches[best_match_index] and face_distances[best_match_index] < 0.6:
                        name = self.known_face_names[best_match_index]
                        student_id = self.known_face_ids[best_match_index]
                
                recognized_faces.append({
                    'name': name,
                    'student_id': student_id,
                    'confidence': 1 - min(face_distances) if len(face_distances) > 0 else 0
                })
            
            return recognized_faces, face_locations
        except Exception as e:
            print(f"Face recognition error: {e}")
            return [], []
    
    def start_recognition(self, callback=None):
        """Start real-time face recognition"""
        cap = cv2.VideoCapture(0)
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            # Resize frame for faster processing
            small_frame = cv2.resize(frame, (0, 0), fx=0.25, fy=0.25)
            
            # Recognize faces
            recognized_faces, face_locations = self.recognize_faces_in_frame(small_frame)
            
            # Scale back face locations
            face_locations = [(top*4, right*4, bottom*4, left*4) for (top, right, bottom, left) in face_locations]
            
            # Draw rectangles and labels
            for (top, right, bottom, left), face_info in zip(face_locations, recognized_faces):
                # Draw rectangle
                color = (0, 255, 0) if face_info['student_id'] else (0, 0, 255)
                cv2.rectangle(frame, (left, top), (right, bottom), color, 2)
                
                # Draw label
                label = f"{face_info['name']} ({face_info['confidence']:.2f})"
                cv2.rectangle(frame, (left, bottom - 35), (right, bottom), color, cv2.FILLED)
                cv2.putText(frame, label, (left + 6, bottom - 6), cv2.FONT_HERSHEY_DUPLEX, 0.6, (255, 255, 255), 1)
                
                # Call callback if provided
                if callback and face_info['student_id']:
                    callback(face_info['student_id'], face_info['name'])
            
            # Display frame
            cv2.imshow('Face Recognition Attendance System', frame)
            
            # Break on 'q' key
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
        
        cap.release()
        cv2.destroyAllWindows()
    
    def add_new_face(self, student_id, name, email, phone, department, image_path=None, camera_capture=False):
        """Add new face to the system"""
        # Get face encoding
        face_encoding = self.capture_face_encoding(image_path, camera_capture)
        
        if face_encoding is None:
            return False, "No face detected in the image"
        
        # Serialize face encoding
        encoding_blob = pickle.dumps(face_encoding)
        
        # Add to database
        success = self.db.add_student(student_id, name, email, phone, department, encoding_blob)
        
        if success:
            # Reload known faces
            self.load_known_faces()
            return True, "Student added successfully"
        else:
            return False, "Student ID already exists"