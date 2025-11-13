import tkinter as tk
from tkinter import ttk, messagebox, filedialog
import cv2
from PIL import Image, ImageTk
import threading
from datetime import datetime, date
import pandas as pd
from database import DatabaseManager
try:
    from face_recognition_system import FaceRecognitionSystem
except ImportError:
    from simple_face_system import SimpleFaceRecognitionSystem as FaceRecognitionSystem

class AttendanceSystemGUI:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("AI-Powered Smart Attendance System")
        self.root.geometry("1200x800")
        self.root.configure(bg='#2c3e50')
        
        # Initialize systems
        self.db = DatabaseManager()
        self.face_system = FaceRecognitionSystem()
        
        # Variables
        self.current_frame = None
        self.recognition_active = False
        self.video_thread = None
        
        # Create main interface
        self.create_main_interface()
        
    def create_main_interface(self):
        """Create the main interface with navigation"""
        # Title
        title_frame = tk.Frame(self.root, bg='#34495e', height=80)
        title_frame.pack(fill='x', padx=10, pady=5)
        title_frame.pack_propagate(False)
        
        title_label = tk.Label(title_frame, text="AI-Powered Smart Attendance System", 
                              font=('Arial', 24, 'bold'), fg='white', bg='#34495e')
        title_label.pack(expand=True)
        
        # Navigation buttons
        nav_frame = tk.Frame(self.root, bg='#2c3e50', height=60)
        nav_frame.pack(fill='x', padx=10, pady=5)
        nav_frame.pack_propagate(False)
        
        buttons = [
            ("📹 Live Attendance", self.show_live_attendance),
            ("👥 Manage Students", self.show_student_management),
            ("📊 View Reports", self.show_reports),
            ("⚙️ Settings", self.show_settings)
        ]
        
        for text, command in buttons:
            btn = tk.Button(nav_frame, text=text, command=command, 
                           font=('Arial', 12, 'bold'), bg='#3498db', fg='white',
                           padx=20, pady=10, relief='flat')
            btn.pack(side='left', padx=5, pady=10)
        
        # Main content area
        self.content_frame = tk.Frame(self.root, bg='#ecf0f1')
        self.content_frame.pack(fill='both', expand=True, padx=10, pady=5)
        
        # Show live attendance by default
        self.show_live_attendance()
    
    def clear_content(self):
        """Clear the content frame"""
        for widget in self.content_frame.winfo_children():
            widget.destroy()
    
    def show_live_attendance(self):
        """Show live attendance page"""
        self.clear_content()
        
        # Stop any existing recognition
        self.stop_recognition()
        
        # Create live attendance interface
        main_frame = tk.Frame(self.content_frame, bg='#ecf0f1')
        main_frame.pack(fill='both', expand=True, padx=20, pady=20)
        
        # Left side - Camera feed
        camera_frame = tk.LabelFrame(main_frame, text="Live Camera Feed", 
                                   font=('Arial', 14, 'bold'), bg='#ecf0f1')
        camera_frame.pack(side='left', fill='both', expand=True, padx=(0, 10))
        
        self.camera_label = tk.Label(camera_frame, text="Camera feed will appear here", 
                                   bg='black', fg='white', font=('Arial', 16))
        self.camera_label.pack(fill='both', expand=True, padx=10, pady=10)
        
        # Camera controls
        control_frame = tk.Frame(camera_frame, bg='#ecf0f1')
        control_frame.pack(fill='x', padx=10, pady=5)
        
        self.start_btn = tk.Button(control_frame, text="Start Recognition", 
                                 command=self.start_recognition, bg='#27ae60', fg='white',
                                 font=('Arial', 12, 'bold'), padx=20, pady=5)
        self.start_btn.pack(side='left', padx=5)
        
        self.stop_btn = tk.Button(control_frame, text="Stop Recognition", 
                                command=self.stop_recognition, bg='#e74c3c', fg='white',
                                font=('Arial', 12, 'bold'), padx=20, pady=5, state='disabled')
        self.stop_btn.pack(side='left', padx=5)
        
        # Right side - Attendance log
        log_frame = tk.LabelFrame(main_frame, text="Today's Attendance", 
                                font=('Arial', 14, 'bold'), bg='#ecf0f1', width=400)
        log_frame.pack(side='right', fill='both', padx=(10, 0))
        log_frame.pack_propagate(False)
        
        # Attendance list
        self.attendance_tree = ttk.Treeview(log_frame, columns=('Name', 'Time', 'Status'), show='headings')
        self.attendance_tree.heading('Name', text='Student Name')
        self.attendance_tree.heading('Time', text='Time')
        self.attendance_tree.heading('Status', text='Status')
        
        self.attendance_tree.column('Name', width=150)
        self.attendance_tree.column('Time', width=100)
        self.attendance_tree.column('Status', width=80)
        
        scrollbar = ttk.Scrollbar(log_frame, orient='vertical', command=self.attendance_tree.yview)
        self.attendance_tree.configure(yscrollcommand=scrollbar.set)
        
        self.attendance_tree.pack(side='left', fill='both', expand=True, padx=10, pady=10)
        scrollbar.pack(side='right', fill='y', pady=10)
        
        # Load today's attendance
        self.refresh_attendance_log()
    
    def start_recognition(self):
        """Start face recognition"""
        if not self.recognition_active:
            self.recognition_active = True
            self.start_btn.config(state='disabled')
            self.stop_btn.config(state='normal')
            
            # Start video thread
            self.video_thread = threading.Thread(target=self.video_loop, daemon=True)
            self.video_thread.start()
    
    def stop_recognition(self):
        """Stop face recognition"""
        self.recognition_active = False
        if hasattr(self, 'start_btn'):
            self.start_btn.config(state='normal')
            self.stop_btn.config(state='disabled')
        
        if hasattr(self, 'camera_label'):
            self.camera_label.config(image='', text="Camera stopped")
    
    def video_loop(self):
        """Video processing loop"""
        cap = cv2.VideoCapture(0)
        
        while self.recognition_active:
            ret, frame = cap.read()
            if not ret:
                break
            
            # Process frame for face recognition
            recognized_faces, face_locations = self.face_system.recognize_faces_in_frame(frame)
            
            # Draw rectangles and labels
            for (top, right, bottom, left), face_info in zip(face_locations, recognized_faces):
                color = (0, 255, 0) if face_info['student_id'] else (0, 0, 255)
                cv2.rectangle(frame, (left, top), (right, bottom), color, 2)
                
                label = f"{face_info['name']}"
                cv2.rectangle(frame, (left, bottom - 35), (right, bottom), color, cv2.FILLED)
                cv2.putText(frame, label, (left + 6, bottom - 6), cv2.FONT_HERSHEY_DUPLEX, 0.6, (255, 255, 255), 1)
                
                # Mark attendance
                if face_info['student_id']:
                    self.mark_attendance(face_info['student_id'], face_info['name'])
            
            # Convert frame to display
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            frame_pil = Image.fromarray(frame_rgb)
            frame_pil = frame_pil.resize((640, 480), Image.Resampling.LANCZOS)
            frame_tk = ImageTk.PhotoImage(frame_pil)
            
            # Update camera label
            if hasattr(self, 'camera_label'):
                self.camera_label.config(image=frame_tk, text='')
                self.camera_label.image = frame_tk
        
        cap.release()
    
    def mark_attendance(self, student_id, name):
        """Mark attendance for recognized student"""
        success = self.db.mark_attendance(student_id)
        if success:
            self.refresh_attendance_log()
    
    def refresh_attendance_log(self):
        """Refresh today's attendance log"""
        if hasattr(self, 'attendance_tree'):
            # Clear existing items
            for item in self.attendance_tree.get_children():
                self.attendance_tree.delete(item)
            
            # Get today's records
            today = date.today()
            records = self.db.get_attendance_records(today)
            
            for record in records:
                name, student_id, date_val, time_in, time_out, status = record
                time_str = time_in.strftime('%H:%M:%S') if time_in else 'N/A'
                self.attendance_tree.insert('', 'end', values=(name, time_str, status))
    
    def show_student_management(self):
        """Show student management page"""
        self.clear_content()
        self.stop_recognition()
        
        main_frame = tk.Frame(self.content_frame, bg='#ecf0f1')
        main_frame.pack(fill='both', expand=True, padx=20, pady=20)
        
        # Add student section
        add_frame = tk.LabelFrame(main_frame, text="Add New Student", 
                                font=('Arial', 14, 'bold'), bg='#ecf0f1')
        add_frame.pack(fill='x', pady=(0, 20))
        
        # Form fields
        fields_frame = tk.Frame(add_frame, bg='#ecf0f1')
        fields_frame.pack(fill='x', padx=20, pady=10)
        
        # Student ID
        tk.Label(fields_frame, text="Student ID:", bg='#ecf0f1', font=('Arial', 10)).grid(row=0, column=0, sticky='w', pady=5)
        self.student_id_entry = tk.Entry(fields_frame, font=('Arial', 10), width=20)
        self.student_id_entry.grid(row=0, column=1, padx=10, pady=5)
        
        # Name
        tk.Label(fields_frame, text="Name:", bg='#ecf0f1', font=('Arial', 10)).grid(row=0, column=2, sticky='w', pady=5)
        self.name_entry = tk.Entry(fields_frame, font=('Arial', 10), width=25)
        self.name_entry.grid(row=0, column=3, padx=10, pady=5)
        
        # Email
        tk.Label(fields_frame, text="Email:", bg='#ecf0f1', font=('Arial', 10)).grid(row=1, column=0, sticky='w', pady=5)
        self.email_entry = tk.Entry(fields_frame, font=('Arial', 10), width=25)
        self.email_entry.grid(row=1, column=1, padx=10, pady=5)
        
        # Phone
        tk.Label(fields_frame, text="Phone:", bg='#ecf0f1', font=('Arial', 10)).grid(row=1, column=2, sticky='w', pady=5)
        self.phone_entry = tk.Entry(fields_frame, font=('Arial', 10), width=20)
        self.phone_entry.grid(row=1, column=3, padx=10, pady=5)
        
        # Department
        tk.Label(fields_frame, text="Department:", bg='#ecf0f1', font=('Arial', 10)).grid(row=2, column=0, sticky='w', pady=5)
        self.dept_entry = tk.Entry(fields_frame, font=('Arial', 10), width=20)
        self.dept_entry.grid(row=2, column=1, padx=10, pady=5)
        
        # Buttons
        btn_frame = tk.Frame(add_frame, bg='#ecf0f1')
        btn_frame.pack(fill='x', padx=20, pady=10)
        
        tk.Button(btn_frame, text="📷 Capture from Camera", command=self.capture_from_camera,
                 bg='#3498db', fg='white', font=('Arial', 10, 'bold'), padx=15, pady=5).pack(side='left', padx=5)
        
        tk.Button(btn_frame, text="📁 Upload Photo", command=self.upload_photo,
                 bg='#9b59b6', fg='white', font=('Arial', 10, 'bold'), padx=15, pady=5).pack(side='left', padx=5)
        
        # Students list
        list_frame = tk.LabelFrame(main_frame, text="Registered Students", 
                                 font=('Arial', 14, 'bold'), bg='#ecf0f1')
        list_frame.pack(fill='both', expand=True)
        
        self.students_tree = ttk.Treeview(list_frame, columns=('ID', 'Name', 'Email', 'Phone', 'Department'), show='headings')
        
        for col in ['ID', 'Name', 'Email', 'Phone', 'Department']:
            self.students_tree.heading(col, text=col)
            self.students_tree.column(col, width=120)
        
        students_scrollbar = ttk.Scrollbar(list_frame, orient='vertical', command=self.students_tree.yview)
        self.students_tree.configure(yscrollcommand=students_scrollbar.set)
        
        self.students_tree.pack(side='left', fill='both', expand=True, padx=10, pady=10)
        students_scrollbar.pack(side='right', fill='y', pady=10)
        
        # Delete button
        delete_btn = tk.Button(list_frame, text="🗑️ Delete Selected", command=self.delete_student,
                              bg='#e74c3c', fg='white', font=('Arial', 10, 'bold'), padx=15, pady=5)
        delete_btn.pack(pady=5)
        
        # Load students
        self.refresh_students_list()
    
    def capture_from_camera(self):
        """Capture student photo from camera"""
        if not self.validate_student_form():
            return
        
        success, message = self.face_system.add_new_face(
            self.student_id_entry.get(),
            self.name_entry.get(),
            self.email_entry.get(),
            self.phone_entry.get(),
            self.dept_entry.get(),
            camera_capture=True
        )
        
        if success:
            messagebox.showinfo("Success", message)
            self.clear_student_form()
            self.refresh_students_list()
        else:
            messagebox.showerror("Error", message)
    
    def upload_photo(self):
        """Upload student photo from file"""
        if not self.validate_student_form():
            return
        
        file_path = filedialog.askopenfilename(
            title="Select Student Photo",
            filetypes=[("Image files", "*.jpg *.jpeg *.png *.bmp")]
        )
        
        if file_path:
            success, message = self.face_system.add_new_face(
                self.student_id_entry.get(),
                self.name_entry.get(),
                self.email_entry.get(),
                self.phone_entry.get(),
                self.dept_entry.get(),
                image_path=file_path
            )
            
            if success:
                messagebox.showinfo("Success", message)
                self.clear_student_form()
                self.refresh_students_list()
            else:
                messagebox.showerror("Error", message)
    
    def validate_student_form(self):
        """Validate student form fields"""
        if not self.student_id_entry.get().strip():
            messagebox.showerror("Error", "Student ID is required")
            return False
        if not self.name_entry.get().strip():
            messagebox.showerror("Error", "Name is required")
            return False
        return True
    
    def clear_student_form(self):
        """Clear student form fields"""
        self.student_id_entry.delete(0, tk.END)
        self.name_entry.delete(0, tk.END)
        self.email_entry.delete(0, tk.END)
        self.phone_entry.delete(0, tk.END)
        self.dept_entry.delete(0, tk.END)
    
    def refresh_students_list(self):
        """Refresh students list"""
        if hasattr(self, 'students_tree'):
            for item in self.students_tree.get_children():
                self.students_tree.delete(item)
            
            students = self.db.get_all_students()
            for student in students:
                self.students_tree.insert('', 'end', values=student)
    
    def delete_student(self):
        """Delete selected student"""
        selected = self.students_tree.selection()
        if not selected:
            messagebox.showwarning("Warning", "Please select a student to delete")
            return
        
        item = self.students_tree.item(selected[0])
        student_id = item['values'][0]
        
        if messagebox.askyesno("Confirm", f"Delete student {student_id}?"):
            self.db.delete_student(student_id)
            self.refresh_students_list()
            messagebox.showinfo("Success", "Student deleted successfully")
    
    def show_reports(self):
        """Show reports page"""
        self.clear_content()
        self.stop_recognition()
        
        main_frame = tk.Frame(self.content_frame, bg='#ecf0f1')
        main_frame.pack(fill='both', expand=True, padx=20, pady=20)
        
        # Controls
        control_frame = tk.Frame(main_frame, bg='#ecf0f1')
        control_frame.pack(fill='x', pady=(0, 20))
        
        tk.Label(control_frame, text="Select Date:", bg='#ecf0f1', font=('Arial', 12, 'bold')).pack(side='left', padx=5)
        
        self.date_var = tk.StringVar(value=date.today().strftime('%Y-%m-%d'))
        date_entry = tk.Entry(control_frame, textvariable=self.date_var, font=('Arial', 10), width=12)
        date_entry.pack(side='left', padx=5)
        
        tk.Button(control_frame, text="📊 Load Report", command=self.load_report,
                 bg='#3498db', fg='white', font=('Arial', 10, 'bold'), padx=15, pady=5).pack(side='left', padx=5)
        
        tk.Button(control_frame, text="📥 Export to Excel", command=self.export_report,
                 bg='#27ae60', fg='white', font=('Arial', 10, 'bold'), padx=15, pady=5).pack(side='left', padx=5)
        
        # Report table
        report_frame = tk.LabelFrame(main_frame, text="Attendance Report", 
                                   font=('Arial', 14, 'bold'), bg='#ecf0f1')
        report_frame.pack(fill='both', expand=True)
        
        self.report_tree = ttk.Treeview(report_frame, columns=('Name', 'ID', 'Date', 'Time In', 'Time Out', 'Status'), show='headings')
        
        for col in ['Name', 'ID', 'Date', 'Time In', 'Time Out', 'Status']:
            self.report_tree.heading(col, text=col)
            self.report_tree.column(col, width=120)
        
        report_scrollbar = ttk.Scrollbar(report_frame, orient='vertical', command=self.report_tree.yview)
        self.report_tree.configure(yscrollcommand=report_scrollbar.set)
        
        self.report_tree.pack(side='left', fill='both', expand=True, padx=10, pady=10)
        report_scrollbar.pack(side='right', fill='y', pady=10)
        
        # Load today's report by default
        self.load_report()
    
    def load_report(self):
        """Load attendance report for selected date"""
        try:
            selected_date = datetime.strptime(self.date_var.get(), '%Y-%m-%d').date()
        except:
            messagebox.showerror("Error", "Invalid date format. Use YYYY-MM-DD")
            return
        
        # Clear existing items
        for item in self.report_tree.get_children():
            self.report_tree.delete(item)
        
        # Load records
        records = self.db.get_attendance_records(selected_date)
        
        for record in records:
            name, student_id, date_val, time_in, time_out, status = record
            time_in_str = time_in.strftime('%H:%M:%S') if time_in else 'N/A'
            time_out_str = time_out.strftime('%H:%M:%S') if time_out else 'N/A'
            
            self.report_tree.insert('', 'end', values=(name, student_id, date_val, time_in_str, time_out_str, status))
    
    def export_report(self):
        """Export report to Excel"""
        try:
            selected_date = datetime.strptime(self.date_var.get(), '%Y-%m-%d').date()
        except:
            messagebox.showerror("Error", "Invalid date format. Use YYYY-MM-DD")
            return
        
        records = self.db.get_attendance_records(selected_date)
        
        if not records:
            messagebox.showwarning("Warning", "No records found for the selected date")
            return
        
        # Create DataFrame
        df = pd.DataFrame(records, columns=['Name', 'Student ID', 'Date', 'Time In', 'Time Out', 'Status'])
        
        # Save to file
        filename = f"attendance_report_{selected_date}.xlsx"
        file_path = filedialog.asksaveasfilename(
            defaultextension=".xlsx",
            filetypes=[("Excel files", "*.xlsx")],
            initialname=filename
        )
        
        if file_path:
            df.to_excel(file_path, index=False)
            messagebox.showinfo("Success", f"Report exported to {file_path}")
    
    def show_settings(self):
        """Show settings page"""
        self.clear_content()
        self.stop_recognition()
        
        main_frame = tk.Frame(self.content_frame, bg='#ecf0f1')
        main_frame.pack(fill='both', expand=True, padx=20, pady=20)
        
        # System info
        info_frame = tk.LabelFrame(main_frame, text="System Information", 
                                 font=('Arial', 14, 'bold'), bg='#ecf0f1')
        info_frame.pack(fill='x', pady=(0, 20))
        
        info_text = f"""
        AI-Powered Smart Attendance System v1.0
        
        Features:
        • Real-time face recognition
        • Student management
        • Attendance tracking
        • Report generation
        • Excel export
        
        Total Students: {len(self.db.get_all_students())}
        Database: SQLite
        """
        
        tk.Label(info_frame, text=info_text, bg='#ecf0f1', font=('Arial', 11), justify='left').pack(padx=20, pady=20)
        
        # Actions
        actions_frame = tk.LabelFrame(main_frame, text="System Actions", 
                                    font=('Arial', 14, 'bold'), bg='#ecf0f1')
        actions_frame.pack(fill='x')
        
        tk.Button(actions_frame, text="🔄 Reload Face Data", command=self.reload_face_data,
                 bg='#f39c12', fg='white', font=('Arial', 12, 'bold'), padx=20, pady=10).pack(pady=10)
    
    def reload_face_data(self):
        """Reload face recognition data"""
        self.face_system.load_known_faces()
        messagebox.showinfo("Success", "Face recognition data reloaded successfully")
    
    def run(self):
        """Run the application"""
        self.root.protocol("WM_DELETE_WINDOW", self.on_closing)
        self.root.mainloop()
    
    def on_closing(self):
        """Handle application closing"""
        self.stop_recognition()
        self.root.destroy()

if __name__ == "__main__":
    app = AttendanceSystemGUI()
    app.run()