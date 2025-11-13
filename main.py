#!/usr/bin/env python3
"""
AI-Powered Smart Attendance System
Main entry point for the application

Features:
- Real-time face recognition
- Student management
- Attendance tracking
- Report generation
- Professional GUI interface

Author: AI Assistant
Version: 1.0
"""

import sys
import os
from gui_application import AttendanceSystemGUI

def main():
    """Main function to start the application"""
    try:
        print("Starting AI-Powered Smart Attendance System...")
        print("Initializing components...")
        
        # Create and run the GUI application
        app = AttendanceSystemGUI()
        print("System ready! Opening GUI...")
        app.run()
        
    except ImportError as e:
        print(f"Error: Missing required dependencies - {e}")
        print("Please install required packages using: pip install -r requirements.txt")
        sys.exit(1)
    except Exception as e:
        print(f"Error starting application: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()