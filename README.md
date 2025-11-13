# AI-Powered Smart Attendance System

A comprehensive face recognition-based attendance system with a professional GUI interface.

## 🚀 Features

### Core Features
- **Real-time Face Recognition**: Advanced face detection and recognition using OpenCV and face_recognition library
- **Live Attendance Tracking**: Real-time attendance marking with camera feed
- **Student Management**: Add, view, and manage student profiles with face data
- **Comprehensive Reports**: Generate and export attendance reports to Excel
- **Professional GUI**: Multi-page interface with modern design

### Advanced Features
- **Database Integration**: SQLite database for reliable data storage
- **Multiple Input Methods**: Camera capture or photo upload for student registration
- **Attendance Analytics**: View daily, weekly, and custom date range reports
- **Export Functionality**: Export reports to Excel format
- **Face Encoding Storage**: Secure storage of face encodings in database
- **Real-time Recognition**: Live camera feed with face detection overlay

## 📋 Requirements

### System Requirements
- Python 3.7 or higher
- Webcam/Camera for face recognition
- Windows/Linux/macOS

### Python Dependencies
```
opencv-python==4.8.1.78
face-recognition==1.3.0
Pillow==10.0.1
numpy==1.24.3
pandas==2.0.3
tkinter (usually included with Python)
```

## 🛠️ Installation

1. **Clone or download the project**
   ```bash
   cd "AI Attendance"
   ```

2. **Install required packages**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the application**
   ```bash
   python main.py
   ```

## 📖 Usage Guide

### 1. Starting the Application
- Run `python main.py`
- The main interface will open with navigation tabs

### 2. Adding Students
- Go to "Manage Students" tab
- Fill in student details (ID, Name, Email, Phone, Department)
- Choose either:
  - **Capture from Camera**: Take a photo using webcam
  - **Upload Photo**: Select an existing photo file
- Click the respective button to register the student

### 3. Live Attendance
- Go to "Live Attendance" tab
- Click "Start Recognition" to begin camera feed
- Students will be automatically recognized and attendance marked
- View real-time attendance log on the right panel
- Click "Stop Recognition" when done

### 4. Viewing Reports
- Go to "View Reports" tab
- Select date using the date field (YYYY-MM-DD format)
- Click "Load Report" to view attendance for that date
- Use "Export to Excel" to save reports

### 5. System Settings
- Go to "Settings" tab
- View system information and statistics
- Use "Reload Face Data" if you need to refresh recognition data

## 🏗️ Project Structure

```
AI Attendance/
├── main.py                    # Main entry point
├── gui_application.py         # GUI interface and main application logic
├── face_recognition_system.py # Face recognition and processing
├── database.py               # Database operations and management
├── requirements.txt          # Python dependencies
├── README.md                # This file
└── attendance_system.db     # SQLite database (created automatically)
```

## 🔧 Technical Details

### Database Schema
- **Students Table**: Stores student information and face encodings
- **Attendance Table**: Records attendance with timestamps

### Face Recognition Process
1. Face detection using OpenCV
2. Face encoding generation using face_recognition library
3. Face comparison with stored encodings
4. Confidence-based matching (threshold: 0.6)
5. Automatic attendance marking

### Security Features
- Face encodings stored securely in database
- No raw images stored (only encodings)
- Unique student ID constraints
- Input validation and error handling

## 🎯 Key Components

### 1. DatabaseManager (`database.py`)
- Handles all database operations
- Student and attendance record management
- SQLite integration with proper schema

### 2. FaceRecognitionSystem (`face_recognition_system.py`)
- Face detection and recognition logic
- Encoding generation and comparison
- Camera integration and image processing

### 3. AttendanceSystemGUI (`gui_application.py`)
- Complete GUI interface with multiple pages
- Real-time camera feed display
- Student management interface
- Report generation and export

### 4. Main Application (`main.py`)
- Entry point with error handling
- System initialization
- Professional startup sequence

## 🚨 Troubleshooting

### Common Issues

1. **Camera not working**
   - Check if camera is connected and not used by other applications
   - Try changing camera index in code (0, 1, 2, etc.)

2. **Face not recognized**
   - Ensure good lighting conditions
   - Make sure face is clearly visible and not obstructed
   - Try re-registering the student with a clearer photo

3. **Installation errors**
   - Make sure you have Python 3.7+ installed
   - Install Visual C++ redistributables for Windows
   - Use `pip install --upgrade pip` before installing requirements

4. **Database errors**
   - Check if you have write permissions in the project directory
   - Delete `attendance_system.db` to reset database

## 🔮 Future Enhancements

- Web-based interface
- Multiple camera support
- Advanced analytics and dashboards
- Integration with existing student management systems
- Mobile app companion
- Cloud database support
- Facial mask detection
- Temperature screening integration

## 📝 License

This project is created for educational and demonstration purposes. Feel free to modify and use according to your needs.

## 🤝 Contributing

This is a demonstration project. For improvements or suggestions, feel free to modify the code according to your requirements.

---

**Note**: This system is designed for educational and small-scale institutional use. For production deployment, consider additional security measures and scalability requirements.