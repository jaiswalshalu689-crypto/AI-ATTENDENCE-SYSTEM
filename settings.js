// Settings JavaScript
class SettingsManager {
    constructor() {
        this.apiBase = 'http://localhost:5000/api';
        this.currentSettings = {};
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadSettings();
        this.loadSystemInfo();
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.settings-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Settings actions
        document.getElementById('saveSettings').addEventListener('click', () => this.saveSettings());
        document.getElementById('resetSettings').addEventListener('click', () => this.resetSettings());
        document.getElementById('exportSettings').addEventListener('click', () => this.exportSettings());

        // Range slider updates
        document.getElementById('recognitionThreshold').addEventListener('input', (e) => {
            document.querySelector('.range-value').textContent = e.target.value;
        });

        // Camera test
        document.getElementById('testCamera').addEventListener('click', () => this.testCamera());

        // Database actions
        document.getElementById('optimizeDb').addEventListener('click', () => this.optimizeDatabase());
        document.getElementById('cleanupDb').addEventListener('click', () => this.cleanupDatabase());
        document.getElementById('resetDb').addEventListener('click', () => this.resetDatabase());

        // Backup actions
        document.getElementById('createBackup').addEventListener('click', () => this.createBackup());
        document.getElementById('restoreBackup').addEventListener('click', () => document.getElementById('backupFile').click());
        document.getElementById('backupFile').addEventListener('change', (e) => this.restoreBackup(e));
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.settings-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update panels
        document.querySelectorAll('.settings-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');
    }

    async loadSettings() {
        try {
            const response = await fetch(`${this.apiBase}/settings`);
            const settings = await response.json();
            
            if (settings.success) {
                this.currentSettings = settings.data;
                this.populateSettingsForm(settings.data);
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            this.showMessage('Failed to load settings', 'error');
        }
    }

    populateSettingsForm(settings) {
        // General settings
        if (settings.general) {
            document.getElementById('systemName').value = settings.general.systemName || 'AI Attendance System';
            document.getElementById('organizationName').value = settings.general.organizationName || '';
            document.getElementById('timeZone').value = settings.general.timeZone || 'Asia/Kolkata';
            document.getElementById('dateFormat').value = settings.general.dateFormat || 'YYYY-MM-DD';
            document.getElementById('autoBackup').checked = settings.general.autoBackup !== false;
        }

        // Recognition settings
        if (settings.recognition) {
            document.getElementById('recognitionThreshold').value = settings.recognition.threshold || 0.6;
            document.querySelector('.range-value').textContent = settings.recognition.threshold || 0.6;
            document.getElementById('detectionModel').value = settings.recognition.model || 'hog';
            document.getElementById('maxFaces').value = settings.recognition.maxFaces || 5;
            document.getElementById('saveUnknownFaces').checked = settings.recognition.saveUnknownFaces || false;
            document.getElementById('multipleAttendance').checked = settings.recognition.multipleAttendance || false;
        }

        // Camera settings
        if (settings.camera) {
            document.getElementById('cameraIndex').value = settings.camera.index || 0;
            document.getElementById('cameraResolution').value = settings.camera.resolution || '1280x720';
            document.getElementById('frameRate').value = settings.camera.frameRate || 15;
            document.getElementById('showBoundingBox').checked = settings.camera.showBoundingBox !== false;
            document.getElementById('showConfidence').checked = settings.camera.showConfidence !== false;
        }

        // Security settings
        if (settings.security) {
            document.getElementById('encryptBackups').checked = settings.security.encryptBackups !== false;
            document.getElementById('logAccess').checked = settings.security.logAccess !== false;
        }
    }

    async saveSettings() {
        const settings = {
            general: {
                systemName: document.getElementById('systemName').value,
                organizationName: document.getElementById('organizationName').value,
                timeZone: document.getElementById('timeZone').value,
                dateFormat: document.getElementById('dateFormat').value,
                autoBackup: document.getElementById('autoBackup').checked
            },
            recognition: {
                threshold: parseFloat(document.getElementById('recognitionThreshold').value),
                model: document.getElementById('detectionModel').value,
                maxFaces: parseInt(document.getElementById('maxFaces').value),
                saveUnknownFaces: document.getElementById('saveUnknownFaces').checked,
                multipleAttendance: document.getElementById('multipleAttendance').checked
            },
            camera: {
                index: parseInt(document.getElementById('cameraIndex').value),
                resolution: document.getElementById('cameraResolution').value,
                frameRate: parseInt(document.getElementById('frameRate').value),
                showBoundingBox: document.getElementById('showBoundingBox').checked,
                showConfidence: document.getElementById('showConfidence').checked
            },
            security: {
                encryptBackups: document.getElementById('encryptBackups').checked,
                logAccess: document.getElementById('logAccess').checked
            }
        };

        try {
            const response = await fetch(`${this.apiBase}/settings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(settings)
            });

            const result = await response.json();

            if (result.success) {
                this.currentSettings = settings;
                this.showMessage('Settings saved successfully!', 'success');
            } else {
                this.showMessage(result.message || 'Failed to save settings', 'error');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            this.showMessage('Error saving settings', 'error');
        }
    }

    async resetSettings() {
        if (!confirm('Are you sure you want to reset all settings to default values?')) {
            return;
        }

        try {
            const response = await fetch(`${this.apiBase}/settings/reset`, { method: 'POST' });
            const result = await response.json();

            if (result.success) {
                this.loadSettings();
                this.showMessage('Settings reset to default values', 'success');
            } else {
                this.showMessage('Failed to reset settings', 'error');
            }
        } catch (error) {
            console.error('Error resetting settings:', error);
            this.showMessage('Error resetting settings', 'error');
        }
    }

    exportSettings() {
        const dataStr = JSON.stringify(this.currentSettings, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const url = window.URL.createObjectURL(dataBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendance_settings_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        this.showMessage('Settings exported successfully!', 'success');
    }

    async testCamera() {
        try {
            const cameraIndex = document.getElementById('cameraIndex').value;
            const response = await fetch(`${this.apiBase}/camera/test`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ camera_index: parseInt(cameraIndex) })
            });

            const result = await response.json();

            if (result.success) {
                this.showMessage('Camera test successful!', 'success');
            } else {
                this.showMessage(result.message || 'Camera test failed', 'error');
            }
        } catch (error) {
            console.error('Error testing camera:', error);
            this.showMessage('Error testing camera', 'error');
        }
    }

    async loadSystemInfo() {
        try {
            const response = await fetch(`${this.apiBase}/system/info`);
            const info = await response.json();

            if (info.success) {
                // Update database info
                document.getElementById('dbStatus').textContent = info.database.status;
                document.getElementById('dbStatus').className = `status ${info.database.connected ? 'connected' : 'disconnected'}`;
                document.getElementById('dbStudents').textContent = info.database.students || 0;
                document.getElementById('dbRecords').textContent = info.database.records || 0;
                document.getElementById('dbSize').textContent = info.database.size || '0 KB';

                // Update backup info
                document.getElementById('lastBackup').textContent = info.backup.lastBackup || 'Never';
                document.getElementById('backupLocation').textContent = info.backup.location || './backups/';
                document.getElementById('autoBackupStatus').textContent = info.backup.autoEnabled ? 'Enabled' : 'Disabled';

                // Update platform info
                document.getElementById('platform').textContent = info.system.platform || 'Web Application';
            }
        } catch (error) {
            console.error('Error loading system info:', error);
        }
    }

    async optimizeDatabase() {
        if (!confirm('This will optimize the database. Continue?')) {
            return;
        }

        try {
            const response = await fetch(`${this.apiBase}/database/optimize`, { method: 'POST' });
            const result = await response.json();

            if (result.success) {
                this.showMessage('Database optimized successfully!', 'success');
                this.loadSystemInfo();
            } else {
                this.showMessage('Failed to optimize database', 'error');
            }
        } catch (error) {
            console.error('Error optimizing database:', error);
            this.showMessage('Error optimizing database', 'error');
        }
    }

    async cleanupDatabase() {
        if (!confirm('This will remove old records. Continue?')) {
            return;
        }

        try {
            const response = await fetch(`${this.apiBase}/database/cleanup`, { method: 'POST' });
            const result = await response.json();

            if (result.success) {
                this.showMessage(`Cleanup completed! Removed ${result.removed} old records`, 'success');
                this.loadSystemInfo();
            } else {
                this.showMessage('Failed to cleanup database', 'error');
            }
        } catch (error) {
            console.error('Error cleaning up database:', error);
            this.showMessage('Error cleaning up database', 'error');
        }
    }

    async resetDatabase() {
        const confirmation = prompt('This will DELETE ALL DATA! Type "RESET" to confirm:');
        if (confirmation !== 'RESET') {
            return;
        }

        try {
            const response = await fetch(`${this.apiBase}/database/reset`, { method: 'POST' });
            const result = await response.json();

            if (result.success) {
                this.showMessage('Database reset successfully!', 'success');
                this.loadSystemInfo();
            } else {
                this.showMessage('Failed to reset database', 'error');
            }
        } catch (error) {
            console.error('Error resetting database:', error);
            this.showMessage('Error resetting database', 'error');
        }
    }

    async createBackup() {
        try {
            const response = await fetch(`${this.apiBase}/backup/create`, { method: 'POST' });
            const result = await response.json();

            if (result.success) {
                this.showMessage('Backup created successfully!', 'success');
                this.loadSystemInfo();
            } else {
                this.showMessage('Failed to create backup', 'error');
            }
        } catch (error) {
            console.error('Error creating backup:', error);
            this.showMessage('Error creating backup', 'error');
        }
    }

    async restoreBackup(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!confirm('This will restore the database from backup. All current data will be replaced. Continue?')) {
            return;
        }

        const formData = new FormData();
        formData.append('backup_file', file);

        try {
            const response = await fetch(`${this.apiBase}/backup/restore`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                this.showMessage('Backup restored successfully!', 'success');
                this.loadSystemInfo();
            } else {
                this.showMessage(result.message || 'Failed to restore backup', 'error');
            }
        } catch (error) {
            console.error('Error restoring backup:', error);
            this.showMessage('Error restoring backup', 'error');
        }
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

// Initialize settings manager when page loads
document.addEventListener('DOMContentLoaded', () => {
    new SettingsManager();
});