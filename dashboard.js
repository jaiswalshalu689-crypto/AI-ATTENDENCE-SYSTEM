// Enhanced Dashboard JavaScript
class Dashboard {
    constructor() {
        this.charts = {};
        this.init();
    }

    init() {
        this.loadStats();
        this.loadRecentAttendance();
        this.loadTopPerformers();
        this.createCharts();
        this.setupEventListeners();
        this.updateSystemStatus();
        
        // Auto-refresh every 30 seconds
        setInterval(() => {
            this.loadStats();
            this.loadRecentAttendance();
            this.updateSystemStatus();
        }, 30000);
    }

    loadStats() {
        const students = JSON.parse(localStorage.getItem('students') || '[]');
        const attendance = JSON.parse(localStorage.getItem('attendance') || '[]');
        const today = new Date().toISOString().split('T')[0];
        
        const todayAttendance = attendance.filter(record => record.date === today);
        const presentToday = todayAttendance.filter(record => record.status === 'present').length;
        const absentToday = students.length - presentToday;
        const attendanceRate = students.length > 0 ? (presentToday / students.length * 100) : 0;
        
        document.getElementById('totalStudents').textContent = students.length;
        document.getElementById('todayPresent').textContent = presentToday;
        document.getElementById('todayAbsent').textContent = Math.max(0, absentToday);
        document.getElementById('attendanceRate').textContent = `${attendanceRate.toFixed(1)}%`;
    }

    loadRecentAttendance() {
        const attendance = JSON.parse(localStorage.getItem('attendance') || '[]');
        const recentAttendance = attendance
            .sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time))
            .slice(0, 8);
        
        const container = document.getElementById('recentAttendance');
        
        if (recentAttendance.length === 0) {
            container.innerHTML = '<div class="no-data"><i class="fas fa-clock"></i><p>No recent attendance records</p></div>';
            return;
        }

        container.innerHTML = recentAttendance.map(record => `
            <div class="attendance-item">
                <div class="student-info">
                    <h4>${record.name}</h4>
                    <p>ID: ${record.studentId} | ${record.department}</p>
                    <small>${record.date}</small>
                </div>
                <div class="attendance-time">
                    <span class="time">${record.time}</span>
                    <span class="attendance-status ${record.status}">${record.status}</span>
                </div>
            </div>
        `).join('');
    }

    loadTopPerformers() {
        const students = JSON.parse(localStorage.getItem('students') || '[]');
        const attendance = JSON.parse(localStorage.getItem('attendance') || '[]');
        
        const performers = students.map(student => {
            const studentAttendance = attendance.filter(record => record.studentId === student.id);
            const rate = attendance.length > 0 ? (studentAttendance.length / 10 * 100) : 0;
            return {
                ...student,
                attendanceRate: Math.min(rate, 100)
            };
        }).sort((a, b) => b.attendanceRate - a.attendanceRate).slice(0, 5);
        
        const container = document.getElementById('topPerformers');
        if (performers.length === 0) {
            container.innerHTML = '<div class="no-data"><i class="fas fa-trophy"></i><p>No performance data available</p></div>';
            return;
        }
        
        container.innerHTML = performers.map((performer, index) => `
            <div class="performer-item">
                <div class="performer-rank">${index + 1}</div>
                <div class="performer-info">
                    <h4>${performer.name}</h4>
                    <p>${performer.department}</p>
                </div>
                <div class="performer-rate">${performer.attendanceRate.toFixed(1)}%</div>
            </div>
        `).join('');
    }

    createCharts() {
        this.createWeeklyChart();
        this.createDepartmentChart();
    }

    createWeeklyChart() {
        const ctx = document.getElementById('weeklyChart');
        if (!ctx) return;

        const attendance = JSON.parse(localStorage.getItem('attendance') || '[]');
        const weekData = this.getWeeklyData(attendance);

        this.charts.weekly = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Daily Attendance',
                    data: weekData,
                    borderColor: '#1e3a8a',
                    backgroundColor: 'rgba(30, 58, 138, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#1e3a8a',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(30, 58, 138, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(30, 58, 138, 0.1)'
                        }
                    }
                }
            }
        });
    }

    createDepartmentChart() {
        const ctx = document.getElementById('departmentChart');
        if (!ctx) return;

        const students = JSON.parse(localStorage.getItem('students') || '[]');
        const deptData = this.getDepartmentData(students);

        this.charts.department = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: deptData.labels,
                datasets: [{
                    data: deptData.values,
                    backgroundColor: [
                        '#1e3a8a',
                        '#3b82f6',
                        '#60a5fa',
                        '#93c5fd',
                        '#dbeafe'
                    ],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                }
            }
        });
    }

    getWeeklyData(attendance) {
        const weekData = [0, 0, 0, 0, 0, 0, 0];
        const today = new Date();
        
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() - (6 - i));
            const dateStr = date.toISOString().split('T')[0];
            
            const dayAttendance = attendance.filter(record => record.date === dateStr && record.status === 'present');
            weekData[i] = dayAttendance.length;
        }
        
        return weekData;
    }

    getDepartmentData(students) {
        const deptCount = {};
        students.forEach(student => {
            const dept = student.department || 'Unknown';
            deptCount[dept] = (deptCount[dept] || 0) + 1;
        });
        
        return {
            labels: Object.keys(deptCount),
            values: Object.values(deptCount)
        };
    }

    updateSystemStatus() {
        document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString();
        
        // Check camera status
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(() => {
                document.getElementById('cameraStatus').textContent = 'Ready';
                document.getElementById('cameraStatus').className = 'status-value connected';
            })
            .catch(() => {
                document.getElementById('cameraStatus').textContent = 'Not Available';
                document.getElementById('cameraStatus').className = 'status-value disconnected';
            });
    }

    setupEventListeners() {
        document.getElementById('refreshRecent')?.addEventListener('click', () => {
            this.loadRecentAttendance();
        });
        
        document.getElementById('exportTodayData')?.addEventListener('click', () => {
            this.exportTodayData();
        });
    }

    exportTodayData() {
        const attendance = JSON.parse(localStorage.getItem('attendance') || '[]');
        const today = new Date().toISOString().split('T')[0];
        const todayAttendance = attendance.filter(record => record.date === today);
        
        if (todayAttendance.length === 0) {
            alert('No attendance data for today');
            return;
        }
        
        let csv = 'Student ID,Name,Department,Time,Status\n';
        todayAttendance.forEach(record => {
            csv += `${record.studentId},${record.name},${record.department},${record.time},${record.status}\n`;
        });
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dashboard_export_${today}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    }
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
    new Dashboard();
});