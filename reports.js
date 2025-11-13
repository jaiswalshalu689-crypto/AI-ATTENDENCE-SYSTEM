// Reports JavaScript
class ReportsManager {
    constructor() {
        this.apiBase = 'http://localhost:5000/api';
        this.currentChart = null;
        this.currentDepartmentChart = null;
        this.currentReportData = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeDateFilters();
    }

    setupEventListeners() {
        // Report generation
        document.getElementById('generateReport').addEventListener('click', () => this.generateReport());
        document.getElementById('clearFilters').addEventListener('click', () => this.clearFilters());
        
        // Report type change
        document.getElementById('reportType').addEventListener('change', (e) => this.handleReportTypeChange(e.target.value));
        
        // Export buttons
        document.getElementById('exportExcel').addEventListener('click', () => this.exportExcel());
        document.getElementById('exportPDF').addEventListener('click', () => this.exportPDF());
        document.getElementById('printReport').addEventListener('click', () => this.printReport());
        
        // Chart toggle
        document.getElementById('chartTypeToggle').addEventListener('click', () => this.toggleChartType());
        
        // Search and sort
        document.getElementById('searchReport').addEventListener('input', (e) => this.searchReport(e.target.value));
        document.getElementById('sortBy').addEventListener('change', (e) => this.sortReport(e.target.value));
        
        // Quick reports
        document.getElementById('todayReport').addEventListener('click', () => this.generateQuickReport('today'));
        document.getElementById('weekReport').addEventListener('click', () => this.generateQuickReport('week'));
        document.getElementById('monthReport').addEventListener('click', () => this.generateQuickReport('month'));
        document.getElementById('lowAttendanceReport').addEventListener('click', () => this.generateQuickReport('low-attendance'));
    }

    initializeDateFilters() {
        const today = new Date();
        const startDate = document.getElementById('startDate');
        const endDate = document.getElementById('endDate');
        
        // Set default dates
        startDate.value = today.toISOString().split('T')[0];
        endDate.value = today.toISOString().split('T')[0];
        
        this.handleReportTypeChange('daily');
    }

    handleReportTypeChange(reportType) {
        const dateFilters = document.getElementById('dateFilters');
        const startDate = document.getElementById('startDate');
        const endDate = document.getElementById('endDate');
        const today = new Date();
        
        switch (reportType) {
            case 'daily':
                startDate.value = today.toISOString().split('T')[0];
                endDate.value = today.toISOString().split('T')[0];
                dateFilters.style.display = 'flex';
                break;
            case 'weekly':
                const weekStart = new Date(today);
                weekStart.setDate(today.getDate() - today.getDay());
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);
                startDate.value = weekStart.toISOString().split('T')[0];
                endDate.value = weekEnd.toISOString().split('T')[0];
                dateFilters.style.display = 'flex';
                break;
            case 'monthly':
                const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                startDate.value = monthStart.toISOString().split('T')[0];
                endDate.value = monthEnd.toISOString().split('T')[0];
                dateFilters.style.display = 'flex';
                break;
            case 'custom':
                dateFilters.style.display = 'flex';
                break;
        }
    }

    async generateReport() {
        const reportType = document.getElementById('reportType').value;
        const department = document.getElementById('department').value;
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        
        if (!startDate || !endDate) {
            this.showMessage('Please select start and end dates', 'error');
            return;
        }
        
        try {
            const params = new URLSearchParams({
                type: reportType,
                start_date: startDate,
                end_date: endDate
            });
            
            if (department) {
                params.append('department', department);
            }
            
            const response = await fetch(`${this.apiBase}/reports/generate?${params}`);
            const reportData = await response.json();
            
            if (reportData.success) {
                this.currentReportData = reportData.data;
                this.displayReportSummary(reportData.summary);
                this.renderReportTable(reportData.data);
                this.updateCharts(reportData.charts);
            } else {
                this.showMessage(reportData.message || 'Failed to generate report', 'error');
            }
        } catch (error) {
            console.error('Error generating report:', error);
            this.showMessage('Error generating report', 'error');
        }
    }

    async generateQuickReport(type) {
        const reportTypeSelect = document.getElementById('reportType');
        const today = new Date();
        
        switch (type) {
            case 'today':
                reportTypeSelect.value = 'daily';
                this.handleReportTypeChange('daily');
                break;
            case 'week':
                reportTypeSelect.value = 'weekly';
                this.handleReportTypeChange('weekly');
                break;
            case 'month':
                reportTypeSelect.value = 'monthly';
                this.handleReportTypeChange('monthly');
                break;
            case 'low-attendance':
                // Generate report for students with attendance < 75%
                try {
                    const response = await fetch(`${this.apiBase}/reports/low-attendance`);
                    const reportData = await response.json();
                    
                    if (reportData.success) {
                        this.currentReportData = reportData.data;
                        this.displayReportSummary(reportData.summary);
                        this.renderReportTable(reportData.data);
                    }
                } catch (error) {
                    console.error('Error generating low attendance report:', error);
                    this.showMessage('Error generating low attendance report', 'error');
                }
                return;
        }
        
        this.generateReport();
    }

    displayReportSummary(summary) {
        document.getElementById('totalStudentsReport').textContent = summary.totalStudents || 0;
        document.getElementById('averagePresent').textContent = summary.averagePresent || 0;
        document.getElementById('averageAttendance').textContent = `${summary.averageAttendance || 0}%`;
        document.getElementById('reportDays').textContent = summary.daysCovered || 0;
    }

    renderReportTable(data) {
        const container = document.getElementById('reportTable');
        
        if (data.length === 0) {
            container.innerHTML = '<div class="no-data"><i class="fas fa-chart-bar"></i><p>No data found for the selected criteria</p></div>';
            return;
        }

        const tableHTML = `
            <table class="report-data-table">
                <thead>
                    <tr>
                        <th>Student ID</th>
                        <th>Name</th>
                        <th>Department</th>
                        <th>Present Days</th>
                        <th>Total Days</th>
                        <th>Attendance %</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map(student => `
                        <tr data-name="${student.name.toLowerCase()}" data-department="${student.department || ''}">
                            <td>${student.student_id}</td>
                            <td>${student.name}</td>
                            <td>${student.department || 'N/A'}</td>
                            <td>${student.present_days}</td>
                            <td>${student.total_days}</td>
                            <td>
                                <span class="attendance-percentage ${student.attendance_percentage < 75 ? 'low' : 'good'}">
                                    ${student.attendance_percentage.toFixed(1)}%
                                </span>
                            </td>
                            <td>
                                <span class="status-badge ${student.attendance_percentage >= 75 ? 'good' : 'poor'}">
                                    ${student.attendance_percentage >= 75 ? 'Good' : 'Poor'}
                                </span>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        container.innerHTML = tableHTML;
    }

    updateCharts(chartData) {
        this.updateAttendanceChart(chartData.attendance);
        this.updateDepartmentChart(chartData.department);
    }

    updateAttendanceChart(data) {
        const ctx = document.getElementById('attendanceChart').getContext('2d');
        
        if (this.currentChart) {
            this.currentChart.destroy();
        }
        
        this.currentChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels || [],
                datasets: [{
                    label: 'Attendance Count',
                    data: data.values || [],
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4,
                    fill: true
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
                            color: 'rgba(0,0,0,0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    updateDepartmentChart(data) {
        const ctx = document.getElementById('departmentChart').getContext('2d');
        
        if (this.currentDepartmentChart) {
            this.currentDepartmentChart.destroy();
        }
        
        this.currentDepartmentChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.labels || [],
                datasets: [{
                    data: data.values || [],
                    backgroundColor: [
                        '#667eea',
                        '#764ba2',
                        '#f093fb',
                        '#f5576c',
                        '#4facfe',
                        '#00f2fe'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    toggleChartType() {
        if (this.currentChart) {
            const newType = this.currentChart.config.type === 'line' ? 'bar' : 'line';
            this.currentChart.config.type = newType;
            this.currentChart.update();
            
            const button = document.getElementById('chartTypeToggle');
            button.innerHTML = newType === 'line' ? 
                '<i class="fas fa-chart-bar"></i> Bar Chart' : 
                '<i class="fas fa-chart-line"></i> Line Chart';
        }
    }

    searchReport(searchTerm) {
        const rows = document.querySelectorAll('.report-data-table tbody tr');
        const term = searchTerm.toLowerCase();
        
        rows.forEach(row => {
            const name = row.dataset.name;
            const visible = name.includes(term);
            row.style.display = visible ? 'table-row' : 'none';
        });
    }

    sortReport(sortBy) {
        const tbody = document.querySelector('.report-data-table tbody');
        const rows = Array.from(tbody.querySelectorAll('tr'));
        
        rows.sort((a, b) => {
            let aVal, bVal;
            
            switch (sortBy) {
                case 'name':
                    aVal = a.cells[1].textContent;
                    bVal = b.cells[1].textContent;
                    break;
                case 'id':
                    aVal = a.cells[0].textContent;
                    bVal = b.cells[0].textContent;
                    break;
                case 'attendance':
                    aVal = parseFloat(a.cells[5].textContent);
                    bVal = parseFloat(b.cells[5].textContent);
                    break;
                case 'department':
                    aVal = a.cells[2].textContent;
                    bVal = b.cells[2].textContent;
                    break;
                default:
                    return 0;
            }
            
            if (sortBy === 'attendance') {
                return bVal - aVal; // Descending for attendance
            }
            return aVal.localeCompare(bVal);
        });
        
        rows.forEach(row => tbody.appendChild(row));
    }

    async exportExcel() {
        try {
            const params = new URLSearchParams({
                type: document.getElementById('reportType').value,
                start_date: document.getElementById('startDate').value,
                end_date: document.getElementById('endDate').value,
                format: 'excel'
            });
            
            const department = document.getElementById('department').value;
            if (department) {
                params.append('department', department);
            }
            
            const response = await fetch(`${this.apiBase}/reports/export?${params}`);
            const blob = await response.blob();
            
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `attendance_report_${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            this.showMessage('Report exported to Excel successfully!', 'success');
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            this.showMessage('Failed to export to Excel', 'error');
        }
    }

    exportPDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Add title
        doc.setFontSize(20);
        doc.text('Attendance Report', 20, 20);
        
        // Add report details
        doc.setFontSize(12);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 35);
        doc.text(`Report Type: ${document.getElementById('reportType').value}`, 20, 45);
        doc.text(`Date Range: ${document.getElementById('startDate').value} to ${document.getElementById('endDate').value}`, 20, 55);
        
        // Add table data
        if (this.currentReportData.length > 0) {
            const tableData = this.currentReportData.map(student => [
                student.student_id,
                student.name,
                student.department || 'N/A',
                student.present_days,
                student.total_days,
                `${student.attendance_percentage.toFixed(1)}%`
            ]);
            
            doc.autoTable({
                head: [['ID', 'Name', 'Department', 'Present', 'Total', 'Attendance %']],
                body: tableData,
                startY: 70
            });
        }
        
        doc.save(`attendance_report_${new Date().toISOString().split('T')[0]}.pdf`);
        this.showMessage('Report exported to PDF successfully!', 'success');
    }

    printReport() {
        const printWindow = window.open('', '_blank');
        const reportContent = document.getElementById('reportTable').innerHTML;
        
        printWindow.document.write(`
            <html>
                <head>
                    <title>Attendance Report</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        table { width: 100%; border-collapse: collapse; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f2f2f2; }
                        .attendance-percentage.low { color: #dc3545; }
                        .attendance-percentage.good { color: #28a745; }
                        .status-badge.good { background: #d4edda; color: #155724; padding: 4px 8px; border-radius: 4px; }
                        .status-badge.poor { background: #f8d7da; color: #721c24; padding: 4px 8px; border-radius: 4px; }
                    </style>
                </head>
                <body>
                    <h1>Attendance Report</h1>
                    <p>Generated on: ${new Date().toLocaleDateString()}</p>
                    <p>Report Type: ${document.getElementById('reportType').value}</p>
                    <p>Date Range: ${document.getElementById('startDate').value} to ${document.getElementById('endDate').value}</p>
                    ${reportContent}
                </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.print();
    }

    clearFilters() {
        document.getElementById('reportType').value = 'daily';
        document.getElementById('department').value = '';
        this.initializeDateFilters();
        
        // Clear report display
        document.getElementById('reportTable').innerHTML = 
            '<div class="no-data"><i class="fas fa-chart-bar"></i><p>Generate a report to view data</p></div>';
        
        // Clear charts
        if (this.currentChart) {
            this.currentChart.destroy();
            this.currentChart = null;
        }
        if (this.currentDepartmentChart) {
            this.currentDepartmentChart.destroy();
            this.currentDepartmentChart = null;
        }
        
        // Reset summary
        document.getElementById('totalStudentsReport').textContent = '0';
        document.getElementById('averagePresent').textContent = '0';
        document.getElementById('averageAttendance').textContent = '0%';
        document.getElementById('reportDays').textContent = '0';
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
            document.body.removeChild(tempDiv);
        }, 3000);
    }
}

// Initialize reports manager when page loads
document.addEventListener('DOMContentLoaded', () => {
    new ReportsManager();
});