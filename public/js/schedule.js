// Student data state
let studentData = {
    name: '',
    rollNumber: '',
    totalCourses: 0,
    schedule: {}
};

// DOM Elements
const studentNameEl = document.getElementById('studentName');
const rollNumberEl = document.getElementById('rollNumber');
const totalCoursesEl = document.getElementById('totalCourses');
const scheduleContainerEl = document.getElementById('scheduleContainer');
const loadingIndicatorEl = document.getElementById('loadingIndicator');
const errorContainerEl = document.getElementById('errorContainer');
const logoutBtn=document.getElementById('logout');

logoutBtn.addEventListener('click',handleLogout);
function handleLogout() {
    // This would typically clear your token and redirect to login
    localStorage.removeItem('authToken');
    location.href = '/public/html/index.html'; // Redirect to your login page
}
// Day course containers
const dayContainers = {
    Monday: document.getElementById('mondayCourses'),
    Tuesday: document.getElementById('tuesdayCourses'),
    Wednesday: document.getElementById('wednesdayCourses'),
    Thursday: document.getElementById('thursdayCourses'),
    Friday: document.getElementById('fridayCourses')
};

// Fetch student schedule
async function fetchStudentSchedule() {
    try {
        // Simulate a fetch to the backend API
        const response = await fetch('http://localhost:5000/api/schedule/student', {
            method: 'GET',
            headers: {
                'Authorization': `${localStorage.getItem('authToken')}` // Include auth token
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch schedule');
            
        }

        const data = await response.json();
        // Update the student data state
        updateStudentData(data);

        // Render the student information and schedule
        renderStudentInfo();
        renderSchedule();

        // Hide loading indicator and show schedule
        loadingIndicatorEl.style.display = 'none';
        scheduleContainerEl.style.display = 'grid';

    } catch (error) {
        console.error('Error fetching student schedule:', error);
        showError('Failed to load your schedule. Please try again later.');
    }
}

// Update student data state
function updateStudentData(data) {
    // Extract student data from response
    studentData = {
        name: data.student.name,
        rollNumber: data.student.rollNumber,
        totalCourses: Object.values(data.schedule)
            .flat()
            .filter((course, index, self) => 
                index === self.findIndex(c => c.code === course.code)
            ).length,
        schedule: data.schedule
    };
}

// Render student information
function renderStudentInfo() {
    studentNameEl.textContent = studentData.name;
    rollNumberEl.textContent = studentData.rollNumber;
    totalCoursesEl.textContent = studentData.totalCourses;
}

// Render schedule
function renderSchedule() {
    // Clear existing courses
    Object.values(dayContainers).forEach(container => {
        container.innerHTML = '';
    });

    // Add courses for each day
    Object.entries(studentData.schedule).forEach(([day, courses]) => {
        const dayContainer = dayContainers[day];
        
        if (courses.length === 0) {
            dayContainer.innerHTML = '<div class="no-courses">No classes</div>';
            return;
        }

        // Sort courses by start time
        courses.sort((a, b) => {
            return a.startTime.localeCompare(b.startTime);
        });

        // Create course cards
        courses.forEach(course => {
            const courseCard = createCourseCard(course);
            dayContainer.appendChild(courseCard);
        });
    });
}

// Create a course card element
function createCourseCard(course) {
    const courseCard = document.createElement('div');
    courseCard.className = 'course-card';
    
    const courseTitle = document.createElement('div');
    courseTitle.className = 'course-title';
    courseTitle.textContent = `${course.course} (${course.code})`;
    
    const courseInstructor = document.createElement('div');
    courseInstructor.className = 'course-instructor';
    courseInstructor.textContent = `Instructor: ${course.instructor}`;
    
    const courseDepartment = document.createElement('div');
    courseDepartment.className = 'course-department';
    courseDepartment.textContent = `Department: ${course.department}`;
    
    const courseLevel = document.createElement('div');
    courseLevel.className = 'course-level';
    courseLevel.textContent = `Level: ${course.level}`;
    
    const courseTime = document.createElement('div');
    courseTime.className = 'course-time';
    courseTime.textContent = `${course.startTime} - ${course.endTime} (${course.timeOfDay})`;
    
    courseCard.appendChild(courseTitle);
    courseCard.appendChild(courseInstructor);
    courseCard.appendChild(courseDepartment);
    courseCard.appendChild(courseLevel);
    courseCard.appendChild(courseTime);
    
    return courseCard;
}

// Show error message
function showError(message) {
    loadingIndicatorEl.style.display = 'none';
    
    errorContainerEl.innerHTML = `
        <div class="error">
            ${message}
        </div>
    `;
}

// Load the schedule when the page loads
document.addEventListener('DOMContentLoaded', fetchStudentSchedule);