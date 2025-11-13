// Manage Students JavaScript
class StudentManager {
    constructor() {
        this.currentPhoto = null;
        this.cameraStream = null;
        this.students = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadStudents();
    }

    setupEventListeners() {
        document.getElementById('addStudentForm').addEventListener('submit', (e) => this.handleAddStudent(e));
        document.getElementById('editStudentForm').addEventListener('submit', (e) => this.handleEditStudent(e));
        
        document.getElementById('captureFromCamera').addEventListener('click', () => this.openCameraModal());
        document.getElementById('uploadPhoto').addEventListener('click', () => document.getElementById('photoFile').click());
        document.getElementById('photoFile').addEventListener('change', (e) => this.handlePhotoUpload(e));
        document.getElementById('removePhoto').addEventListener('click', () => this.removePhoto());
        
        document.getElementById('closeCameraModal').addEventListener('click', () => this.closeCameraModal());
        document.getElementById('takePicture').addEventListener('click', () => this.takePicture());
        document.getElementById('retakePicture').addEventListener('click', () => this.retakePicture());
        document.getElementById('usePhoto').addEventListener('click', () => this.usePhoto());
        
        document.getElementById('searchStudents').addEventListener('input', (e) => this.filterStudents(e.target.value));
        document.getElementById('filterDepartment').addEventListener('change', (e) => this.filterByDepartment(e.target.value));
        
        document.getElementById('refreshStudents').addEventListener('click', () => this.loadStudents());
        document.getElementById('exportStudents').addEventListener('click', () => this.exportStudents());
        
        document.getElementById('closeEditModal').addEventListener('click', () => this.closeEditModal());
        document.getElementById('cancelEdit').addEventListener('click', () => this.closeEditModal());
    }

    handleAddStudent(e) {
        e.preventDefault();
        
        const studentId = document.getElementById('studentId').value.trim();
        const name = document.getElementById('studentName').value.trim();
        const email = document.getElementById('studentEmail').value.trim();
        const phone = document.getElementById('studentPhone').value.trim();
        const department = document.getElementById('studentDepartment').value;
        
        if (!studentId || !name) {
            this.showMessage('Student ID and Name are required', 'error');
            return;
        }
        
        if (this.students.find(s => s.student_id === studentId)) {
            this.showMessage('Student ID already exists', 'error');
            return;
        }
        
        const newStudent = {
            student_id: studentId,
            name: name,
            email: email,
            phone: phone,
            department: department,
            created_at: new Date().toISOString()
        };
        
        this.students.push(newStudent);
        this.saveStudentsToStorage();
        
        this.showMessage('Student added successfully!', 'success');
        document.getElementById('addStudentForm').reset();
        this.removePhoto();
        this.loadStudents();
    }

    handleEditStudent(e) {
        e.preventDefault();
        
        const studentId = document.getElementById('editStudentId').value;
        const name = document.getElementById('editName').value.trim();
        const email = document.getElementById('editEmail').value.trim();
        const phone = document.getElementById('editPhone').value.trim();
        const department = document.getElementById('editDepartment').value;
        
        const studentIndex = this.students.findIndex(s => s.student_id === studentId);
        if (studentIndex !== -1) {
            this.students[studentIndex] = {
                ...this.students[studentIndex],
                name: name,
                email: email,
                phone: phone,
                department: department
            };
            
            this.saveStudentsToStorage();
            this.showMessage('Student updated successfully!', 'success');
            this.closeEditModal();
            this.loadStudents();
        } else {
            this.showMessage('Student not found', 'error');
        }
    }

    loadStudents() {
        this.loadStudentsFromStorage();
        this.renderStudentsList(this.students);
        document.getElementById('studentsCount').textContent = this.students.length;
    }

    loadStudentsFromStorage() {
        const stored = localStorage.getItem('attendanceStudents');
        if (stored) {
            this.students = JSON.parse(stored);
        } else {
            // Initialize with sample data
            this.students = [
                {
                    student_id: 'STU001',
                    name: 'John Smith',
                    email: 'john.smith@email.com',
                    phone: '+1234567890',
                    department: 'Computer Science',
                    created_at: new Date().toISOString()
                },
                {
                    student_id: 'STU002',
                    name: 'Sarah Johnson',
                    email: 'sarah.johnson@email.com',
                    phone: '+1234567891',
                    department: 'Information Technology',
                    created_at: new Date().toISOString()
                }
            ];
            this.saveStudentsToStorage();
        }
    }

    saveStudentsToStorage() {
        localStorage.setItem('attendanceStudents', JSON.stringify(this.students));
    }

    renderStudentsList(students) {
        const container = document.getElementById('studentsList');
        
        if (students.length === 0) {
            container.innerHTML = '<div class="no-data"><i class="fas fa-users"></i><p>No students found</p></div>';
            return;
        }

        const tableHTML = `
            <div class="students-table-header">
                <div class="student-row header">
                    <div><strong>ID</strong></div>
                    <div><strong>Name</strong></div>
                    <div><strong>Email</strong></div>
                    <div><strong>Department</strong></div>
                    <div><strong>Actions</strong></div>
                </div>
            </div>
            <div class="students-table-body">
                ${students.map(student => `
                    <div class="student-row" data-name="${student.name.toLowerCase()}" data-department="${student.department || ''}">
                        <div>${student.student_id}</div>
                        <div>
                            <strong>${student.name}</strong>
                            ${student.phone ? `<br><small>${student.phone}</small>` : ''}
                        </div>
                        <div>${student.email || 'N/A'}</div>
                        <div>${student.department || 'N/A'}</div>
                        <div class="student-actions">
                            <button class="btn outline small" onclick="studentManager.editStudent('${student.student_id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn danger small" onclick="studentManager.deleteStudent('${student.student_id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        container.innerHTML = tableHTML;
    }

    editStudent(studentId) {
        const student = this.students.find(s => s.student_id === studentId);
        if (student) {
            document.getElementById('editStudentId').value = student.student_id;
            document.getElementById('editName').value = student.name;
            document.getElementById('editEmail').value = student.email || '';
            document.getElementById('editPhone').value = student.phone || '';
            document.getElementById('editDepartment').value = student.department || '';
            
            document.getElementById('editStudentModal').style.display = 'flex';
        }
    }

    deleteStudent(studentId) {
        if (!confirm('Are you sure you want to delete this student?')) {
            return;
        }
        
        this.students = this.students.filter(s => s.student_id !== studentId);
        this.saveStudentsToStorage();
        
        this.showMessage('Student deleted successfully!', 'success');
        this.loadStudents();
    }

    openCameraModal() {
        document.getElementById('cameraModal').style.display = 'flex';
        this.startCamera();
    }

    closeCameraModal() {
        document.getElementById('cameraModal').style.display = 'none';
        this.stopCamera();
    }

    closeEditModal() {
        document.getElementById('editStudentModal').style.display = 'none';
    }

    async startCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                } 
            });
            const video = document.getElementById('cameraVideo');
            video.srcObject = stream;
            this.cameraStream = stream;
            
            video.onloadedmetadata = () => {
                video.play();
            };
            
        } catch (error) {
            console.error('Error accessing camera:', error);
            let errorMessage = 'Camera access denied';
            
            if (error.name === 'NotFoundError') {
                errorMessage = 'No camera found on this device';
            } else if (error.name === 'NotAllowedError') {
                errorMessage = 'Camera permission denied. Please allow camera access and try again.';
            } else if (error.name === 'NotReadableError') {
                errorMessage = 'Camera is already in use by another application';
            }
            
            this.showMessage(errorMessage, 'error');
        }
    }

    stopCamera() {
        if (this.cameraStream) {
            this.cameraStream.getTracks().forEach(track => track.stop());
            this.cameraStream = null;
        }
    }

    takePicture() {
        const video = document.getElementById('cameraVideo');
        const canvas = document.getElementById('captureCanvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        
        video.style.display = 'none';
        canvas.style.display = 'block';
        
        document.getElementById('takePicture').style.display = 'none';
        document.getElementById('retakePicture').style.display = 'inline-flex';
        document.getElementById('usePhoto').style.display = 'inline-flex';
    }

    retakePicture() {
        const video = document.getElementById('cameraVideo');
        const canvas = document.getElementById('captureCanvas');
        
        video.style.display = 'block';
        canvas.style.display = 'none';
        
        document.getElementById('takePicture').style.display = 'inline-flex';
        document.getElementById('retakePicture').style.display = 'none';
        document.getElementById('usePhoto').style.display = 'none';
    }

    usePhoto() {
        const canvas = document.getElementById('captureCanvas');
        canvas.toBlob((blob) => {
            this.currentPhoto = blob;
            this.showPhotoPreview(URL.createObjectURL(blob));
            this.closeCameraModal();
        }, 'image/jpeg', 0.8);
    }

    handlePhotoUpload(e) {
        const file = e.target.files[0];
        if (file) {
            this.currentPhoto = file;
            this.showPhotoPreview(URL.createObjectURL(file));
        }
    }

    showPhotoPreview(src) {
        const preview = document.getElementById('photoPreview');
        const image = document.getElementById('previewImage');
        
        image.src = src;
        preview.style.display = 'block';
    }

    removePhoto() {
        this.currentPhoto = null;
        document.getElementById('photoPreview').style.display = 'none';
        document.getElementById('photoFile').value = '';
    }

    filterStudents(searchTerm) {
        const rows = document.querySelectorAll('.student-row:not(.header)');
        const term = searchTerm.toLowerCase();
        
        rows.forEach(row => {
            const name = row.dataset.name;
            const visible = name.includes(term);
            row.style.display = visible ? 'grid' : 'none';
        });
    }

    filterByDepartment(department) {
        const rows = document.querySelectorAll('.student-row:not(.header)');
        
        rows.forEach(row => {
            const rowDepartment = row.dataset.department;
            const visible = !department || rowDepartment === department;
            row.style.display = visible ? 'grid' : 'none';
        });
    }

    exportStudents() {
        const csvContent = "data:text/csv;charset=utf-8," 
            + "Student ID,Name,Email,Phone,Department,Created Date\n"
            + this.students.map(student => 
                `${student.student_id},${student.name},${student.email},${student.phone},${student.department},${new Date(student.created_at).toLocaleDateString()}`
            ).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `students_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showMessage('Students exported successfully!', 'success');
    }

    showMessage(message, type) {
        const color = type === 'success' ? '#28a745' : '#dc3545';
        const tempDiv = document.createElement('div');
        tempDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${color};
            color: white;
            padding: 1rem 2rem;
            border-radius: 8px;
            z-index: 3000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        `;
        tempDiv.textContent = message;
        document.body.appendChild(tempDiv);
        
        setTimeout(() => {
            if (document.body.contains(tempDiv)) {
                document.body.removeChild(tempDiv);
            }
        }, 3000);
    }
}

let studentManager;
document.addEventListener('DOMContentLoaded', () => {
    studentManager = new StudentManager();
});