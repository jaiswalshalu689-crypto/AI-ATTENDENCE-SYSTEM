// Live Attendance JavaScript
class LiveAttendance {
    constructor() {
        this.isRecognitionActive = false;
        this.recognitionInterval = null;
        this.localStream = null;
        this.mockAttendanceData = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadTodayAttendance();
        this.updateRecognitionStatus();
    }

    setupEventListeners() {
        document.getElementById('startCamera').addEventListener('click', () => this.startRecognition());
        document.getElementById('stopCamera').addEventListener('click', () => this.stopRecognition());
        document.getElementById('capturePhoto').addEventListener('click', () => this.capturePhoto());
        document.getElementById('refreshAttendance').addEventListener('click', () => this.loadTodayAttendance());
        document.getElementById('exportToday').addEventListener('click', () => this.exportTodayAttendance());
        document.getElementById('exportDailyExcel').addEventListener('click', () => this.exportDailyExcel());
        document.getElementById('clearLog').addEventListener('click', () => this.clearLog());
        
        // Date filter
        const dateInput = document.getElementById('attendanceDate');
        if (dateInput) {
            dateInput.value = new Date().toISOString().split('T')[0];
            dateInput.addEventListener('change', (e) => this.loadAttendanceForDate(e.target.value));
        }
        
        document.getElementById('searchAttendance').addEventListener('input', (e) => this.filterAttendance(e.target.value));
        document.getElementById('filterStatus').addEventListener('change', (e) => this.filterByStatus(e.target.value));
        
        // Make instance globally accessible for delete function
        window.liveAttendance = this;
    }

    async startRecognition() {
        try {
            this.isRecognitionActive = true;
            this.updateUI();
            await this.startCameraFeed();
            this.addLogEntry('Face recognition started');
            
            this.recognitionInterval = setInterval(() => {
                this.mockRecognition();
            }, 3000);
        } catch (error) {
            console.error('Error starting recognition:', error);
            this.addLogEntry('Error starting recognition: ' + error.message);
            this.isRecognitionActive = false;
            this.updateUI();
        }
    }

    async stopRecognition() {
        this.isRecognitionActive = false;
        this.updateUI();
        this.stopCameraFeed();
        this.addLogEntry('Face recognition stopped');
        
        if (this.recognitionInterval) {
            clearInterval(this.recognitionInterval);
            this.recognitionInterval = null;
        }
    }

    async startCameraFeed() {
        const cameraStatus = document.getElementById('cameraStatus');
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                } 
            });
            
            const video = document.createElement('video');
            video.srcObject = stream;
            video.autoplay = true;
            video.style.width = '100%';
            video.style.height = '100%';
            video.style.objectFit = 'cover';
            video.style.borderRadius = '10px';
            
            const container = document.querySelector('.camera-container');
            container.innerHTML = '';
            container.appendChild(video);
            
            this.localStream = stream;
            this.addLogEntry('Camera started successfully');
            
        } catch (error) {
            console.error('Camera access error:', error);
            let errorMessage = 'Camera access failed: ';
            
            switch (error.name) {
                case 'NotFoundError':
                    errorMessage += 'No camera found';
                    break;
                case 'NotAllowedError':
                    errorMessage += 'Permission denied';
                    break;
                case 'NotReadableError':
                    errorMessage += 'Camera in use';
                    break;
                default:
                    errorMessage += error.message;
            }
            
            this.addLogEntry(errorMessage);
            throw error;
        }
    }

    stopCameraFeed() {
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }
        
        const container = document.querySelector('.camera-container');
        container.innerHTML = `
            <div id="cameraStatus" class="camera-status">
                <i class="fas fa-camera-slash"></i>
                <p>Camera Stopped</p>
            </div>
        `;
        
        document.getElementById('facesCount').textContent = '0';
        document.getElementById('lastRecognition').textContent = 'None';
    }

    mockRecognition() {
        const faceCount = Math.floor(Math.random() * 2) + 1; // 1-2 faces
        document.getElementById('facesCount').textContent = faceCount;
        
        if (faceCount > 0) {
            // Prioritize detecting Suraj (80% chance)
            let student;
            const confidence = (88 + Math.random() * 8).toFixed(1);
            
            if (Math.random() > 0.2) {
                // Detect Suraj
                student = { name: 'Suraj', id: 'CS004', department: 'Computer Science' };
                this.addLogEntry(`Face detected: Suraj (${confidence}% confidence)`);
            } else {
                // Occasionally detect other students
                const students = JSON.parse(localStorage.getItem('students') || '[]');
                const otherStudents = students.filter(s => s.name !== 'Suraj');
                if (otherStudents.length > 0) {
                    const randomStudent = otherStudents[Math.floor(Math.random() * otherStudents.length)];
                    student = { name: randomStudent.name, id: randomStudent.id, department: randomStudent.department };
                    this.addLogEntry(`Face detected: ${student.name} (${confidence}% confidence)`);
                } else {
                    student = { name: 'Suraj', id: 'CS004', department: 'Computer Science' };
                    this.addLogEntry(`Face detected: Suraj (${confidence}% confidence)`);
                }
            }
            
            document.getElementById('lastRecognition').textContent = student.name;
            this.addRealAttendance(student);
        }
    }

    addRealAttendance(student) {
        const existing = this.mockAttendanceData.find(item => item.student_id === student.id);
        if (!existing) {
            this.mockAttendanceData.unshift({
                name: student.name,
                student_id: student.id,
                department: student.department || 'N/A',
                timestamp: new Date().toISOString(),
                status: 'present'
            });
            
            // Save to storage
            localStorage.setItem('todayAttendance', JSON.stringify(this.mockAttendanceData));
            this.loadTodayAttendance();
            
            // Auto-close camera after attendance is marked
            setTimeout(() => {
                this.stopRecognition();
                this.addLogEntry(`Attendance marked for ${student.name} - Camera stopped automatically`);
            }, 2000);
        }
    }

    capturePhoto() {
        if (!this.localStream) {
            this.addLogEntry('Camera not active');
            return;
        }
        
        const video = document.querySelector('.camera-container video');
        if (video) {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0);
            
            this.addLogEntry('Photo captured successfully');
        }
    }

    loadTodayAttendance() {
        // Load attendance from storage or initialize empty
        const storedAttendance = localStorage.getItem('todayAttendance');
        if (storedAttendance) {
            this.mockAttendanceData = JSON.parse(storedAttendance);
        } else if (this.mockAttendanceData.length === 0) {
            this.mockAttendanceData = [];
        }
        
        this.renderAttendanceList(this.mockAttendanceData);
        document.getElementById('attendanceCount').textContent = this.mockAttendanceData.length;
    }

    renderAttendanceList(attendance) {
        const container = document.getElementById('attendanceList');
        
        if (attendance.length === 0) {
            container.innerHTML = '<div class="no-data"><i class="fas fa-users"></i><p>No attendance records for today</p></div>';
            return;
        }

        container.innerHTML = attendance.map((record, index) => `
            <div class="attendance-item" data-name="${record.name.toLowerCase()}" data-status="${record.status || 'present'}" data-index="${index}">
                <div class="student-info">
                    <h4>${record.name}</h4>
                    <p>ID: ${record.student_id} | ${record.department || 'N/A'}</p>
                    <small>${this.formatDateTime(record.timestamp)}</small>
                </div>
                <div class="attendance-actions">
                    <div class="attendance-status ${record.status || 'present'}">
                        ${record.status || 'Present'}
                    </div>
                    <button class="btn-delete" onclick="liveAttendance.deleteAttendance(${index})" title="Delete attendance">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    filterAttendance(searchTerm) {
        const items = document.querySelectorAll('.attendance-item');
        const term = searchTerm.toLowerCase();
        
        items.forEach(item => {
            const name = item.dataset.name;
            const visible = name.includes(term);
            item.style.display = visible ? 'flex' : 'none';
        });
    }

    filterByStatus(status) {
        const items = document.querySelectorAll('.attendance-item');
        
        items.forEach(item => {
            const itemStatus = item.dataset.status;
            const visible = status === 'all' || itemStatus === status;
            item.style.display = visible ? 'flex' : 'none';
        });
    }

    exportTodayAttendance() {
        const csvContent = "data:text/csv;charset=utf-8," 
            + "Name,Student ID,Department,Time,Status\n"
            + this.mockAttendanceData.map(record => 
                `${record.name},${record.student_id},${record.department},${this.formatDateTime(record.timestamp)},${record.status}`
            ).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `attendance_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.addLogEntry('Attendance exported successfully');
    }

    exportDailyExcel() {
        const selectedDate = document.getElementById('attendanceDate').value || new Date().toISOString().split('T')[0];
        const attendance = JSON.parse(localStorage.getItem('attendance') || '[]');
        const students = JSON.parse(localStorage.getItem('students') || '[]');
        
        const dayAttendance = attendance.filter(record => record.date === selectedDate);
        
        // Create Excel-compatible CSV
        let csvContent = 'Daily Attendance Report\n';
        csvContent += `Date:,${selectedDate}\n`;
        csvContent += `Generated:,${new Date().toLocaleString()}\n`;
        csvContent += '\n';
        csvContent += 'Student ID,Name,Department,Time,Status\n';
        
        if (dayAttendance.length > 0) {
            dayAttendance.forEach(record => {
                csvContent += `${record.studentId},${record.name},${record.department},${record.time},${record.status}\n`;
            });
        } else {
            csvContent += 'No attendance records found for this date\n';
        }
        
        csvContent += '\n';
        csvContent += 'Summary:\n';
        csvContent += `Total Present:,${dayAttendance.filter(r => r.status === 'present').length}\n`;
        csvContent += `Total Students:,${students.length}\n`;
        csvContent += `Attendance Rate:,${((dayAttendance.filter(r => r.status === 'present').length / students.length) * 100).toFixed(1)}%\n`;
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Daily_Attendance_${selectedDate}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        this.addLogEntry(`Daily Excel exported for ${selectedDate}`);
    }

    loadAttendanceForDate(date) {
        const attendance = JSON.parse(localStorage.getItem('attendance') || '[]');
        const dayAttendance = attendance.filter(record => record.date === date);
        
        if (dayAttendance.length === 0) {
            document.getElementById('attendanceList').innerHTML = '<div class="no-data"><i class="fas fa-calendar-times"></i><p>No attendance records for this date</p></div>';
            document.getElementById('attendanceCount').textContent = '0';
            return;
        }
        
        const formattedAttendance = dayAttendance.map(record => ({
            name: record.name,
            student_id: record.studentId,
            department: record.department,
            timestamp: `${record.date} ${record.time}`,
            status: record.status
        }));
        
        this.renderAttendanceList(formattedAttendance);
        document.getElementById('attendanceCount').textContent = dayAttendance.length;
    }

    updateUI() {
        const startBtn = document.getElementById('startCamera');
        const stopBtn = document.getElementById('stopCamera');
        const captureBtn = document.getElementById('capturePhoto');
        const status = document.getElementById('recognitionStatus');
        
        if (this.isRecognitionActive) {
            startBtn.disabled = true;
            stopBtn.disabled = false;
            captureBtn.disabled = false;
            status.textContent = 'Active';
            status.className = 'status connected';
        } else {
            startBtn.disabled = false;
            stopBtn.disabled = true;
            captureBtn.disabled = true;
            status.textContent = 'Stopped';
            status.className = 'status disconnected';
        }
    }

    updateRecognitionStatus() {
        this.updateUI();
    }

    addLogEntry(message) {
        const logContent = document.getElementById('recognitionLog');
        const timestamp = new Date().toLocaleTimeString();
        
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.innerHTML = `<span class="timestamp">[${timestamp}]</span> ${message}`;
        
        logContent.appendChild(entry);
        logContent.scrollTop = logContent.scrollHeight;
        
        const entries = logContent.querySelectorAll('.log-entry');
        if (entries.length > 50) {
            entries[0].remove();
        }
    }

    clearLog() {
        const logContent = document.getElementById('recognitionLog');
        logContent.innerHTML = '<div class="log-entry"><span class="timestamp">Log cleared</span></div>';
    }

    deleteAttendance(index) {
        if (confirm('Are you sure you want to delete this attendance record?')) {
            this.mockAttendanceData.splice(index, 1);
            localStorage.setItem('todayAttendance', JSON.stringify(this.mockAttendanceData));
            this.loadTodayAttendance();
            this.addLogEntry(`Attendance record deleted`);
        }
    }

    formatDateTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new LiveAttendance();
});