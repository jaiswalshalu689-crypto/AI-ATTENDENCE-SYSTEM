// Sample dataset for AI Attendance System
const sampleData = {
    students: [
        {
            id: "CS001",
            name: "John Smith",
            email: "john.smith@university.edu",
            phone: "+1-555-0101",
            department: "Computer Science",
            photo: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzMzNzNkYyIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+SlM8L3RleHQ+PC9zdmc+",
            dateAdded: "2024-01-15"
        },
        {
            id: "CS002",
            name: "Emily Johnson",
            email: "emily.johnson@university.edu",
            phone: "+1-555-0102",
            department: "Computer Science",
            photo: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2VmNDQ0NCIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+RUo8L3RleHQ+PC9zdmc+",
            dateAdded: "2024-01-16"
        },
        {
            id: "IT001",
            name: "Michael Brown",
            email: "michael.brown@university.edu",
            phone: "+1-555-0103",
            department: "Information Technology",
            photo: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzEwYjk4MSIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+TUI8L3RleHQ+PC9zdmc+",
            dateAdded: "2024-01-17"
        },
        {
            id: "EE001",
            name: "Sarah Davis",
            email: "sarah.davis@university.edu",
            phone: "+1-555-0104",
            department: "Electrical",
            photo: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y5NzMxNiIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+U0Q8L3RleHQ+PC9zdmc+",
            dateAdded: "2024-01-18"
        },
        {
            id: "ME001",
            name: "David Wilson",
            email: "david.wilson@university.edu",
            phone: "+1-555-0105",
            department: "Mechanical",
            photo: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzg5MzNhMCIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+RFc8L3RleHQ+PC9zdmc+",
            dateAdded: "2024-01-19"
        },
        {
            id: "CS003",
            name: "Lisa Anderson",
            email: "lisa.anderson@university.edu",
            phone: "+1-555-0106",
            department: "Computer Science",
            photo: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2VjNDA5OSIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+TEE8L3RleHQ+PC9zdmc+",
            dateAdded: "2024-01-20"
        },
        {
            id: "CS004",
            name: "Suraj",
            email: "suraj@university.edu",
            phone: "+1-555-0107",
            department: "Computer Science",
            photo: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2ZmNjUwMCIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+U1U8L3RleHQ+PC9zdmc+",
            dateAdded: "2024-01-21"
        }
    ],
    
    attendance: [
        // Today's attendance
        { studentId: "CS001", name: "John Smith", department: "Computer Science", date: new Date().toISOString().split('T')[0], time: "09:15:30", status: "present" },
        { studentId: "CS002", name: "Emily Johnson", department: "Computer Science", date: new Date().toISOString().split('T')[0], time: "09:22:15", status: "present" },
        { studentId: "IT001", name: "Michael Brown", department: "Information Technology", date: new Date().toISOString().split('T')[0], time: "09:18:45", status: "present" },
        { studentId: "EE001", name: "Sarah Davis", department: "Electrical", date: new Date().toISOString().split('T')[0], time: "09:25:10", status: "present" },
        
        // Yesterday's attendance
        { studentId: "CS001", name: "John Smith", department: "Computer Science", date: new Date(Date.now() - 86400000).toISOString().split('T')[0], time: "09:10:20", status: "present" },
        { studentId: "CS002", name: "Emily Johnson", department: "Computer Science", date: new Date(Date.now() - 86400000).toISOString().split('T')[0], time: "09:30:45", status: "present" },
        { studentId: "IT001", name: "Michael Brown", department: "Information Technology", date: new Date(Date.now() - 86400000).toISOString().split('T')[0], time: "09:15:30", status: "present" },
        { studentId: "ME001", name: "David Wilson", department: "Mechanical", date: new Date(Date.now() - 86400000).toISOString().split('T')[0], time: "09:20:15", status: "present" },
        { studentId: "CS003", name: "Lisa Anderson", department: "Computer Science", date: new Date(Date.now() - 86400000).toISOString().split('T')[0], time: "09:35:00", status: "present" }
    ]
};

// Initialize sample data
function initializeSampleData() {
    localStorage.setItem('students', JSON.stringify(sampleData.students));
    localStorage.setItem('attendance', JSON.stringify(sampleData.attendance));
    console.log('Sample data loaded: 6 students, ' + sampleData.attendance.length + ' attendance records');
}

// Auto-load sample data
initializeSampleData();