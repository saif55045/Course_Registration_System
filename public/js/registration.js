// Global variables
let token = localStorage.getItem('authToken') || ''; // Assume token is set by your 
// login // system
let allCourses = [];
let stdID;
let registeredCourses = [];
let studentName = ""; // Will be fetched from API
let isAdmin = false;

// DOM Elements
const studentNameElement = document.getElementById('student-name');
const logoutBtn = document.getElementById('logout-btn');
const availableCoursesContainer = document.getElementById('available-courses');
const registeredCoursesContainer = document.getElementById('registered-courses');
const errorMessage = document.getElementById('error-message');
const successMessage = document.getElementById('success-message');
const courseSearch = document.getElementById('course-search');
const departmentFilter = document.getElementById('department-filter');
const timeFilter = document.getElementById('time-filter');
const studentSelect = document.getElementById('student-select');
const adminSelect=document.getElementById('adminSearch');
// API Base URL
const API_BASE_URL = 'http://localhost:5000/api'; // Change as needed

// Event Listeners
document.addEventListener('DOMContentLoaded', initApp);
logoutBtn.addEventListener('click', handleLogout);
courseSearch.addEventListener('input', filterCourses);
departmentFilter.addEventListener('change', filterCourses);
timeFilter.addEventListener('change', filterCourses);
if (studentSelect) {
    studentSelect.addEventListener('change', handleStudentSelect);
}
// Initialize the application
function initApp() {

    if (checkUserRole() === 1) {
        fetchStudentInfo();
        fetchAvailableCourses();
        fetchRegisteredCourses();
    }
}

function checkUserRole() {
    try {
        // Parse the token to get user role directly
        const tokenPayload = JSON.parse(atob(token.split('.')[1]));
        isAdmin = tokenPayload.role === 'admin';
        if (isAdmin) {
            studentNameElement.textContent = 'Admin';
            adminSelect.classList.remove('hidden'); // Show the dropdown
            fetchAllStudents(); // Fetch students if admin
            return 0;
        } else {
            studentNameElement.textContent = 'Student';
            adminSelect.classList.add('hidden'); // Hide the dropdown
            return 1;
        }
    } catch (error) {
        displayError('Error parsing authentication token');
        console.error('Error checking user role:', error);
    }
}
// Admin Functions
async function fetchAllStudents() {
    try {
        const response = await fetch(`${API_BASE_URL}/registration/students`, {
            method: 'GET',
            headers: {
                'Authorization': token
            }
        });
        if (!response.ok) {
            throw new Error('Failed to fetch students');
        }

        const data = await response.json();
        allStudents = data.students;

        // Populate student select dropdown
        studentSelect.innerHTML = '<option value="">Select a student...</option>';
        allStudents.forEach(student => {
            const option = document.createElement('option');
            option.value = student._id;
            option.textContent = `${student.name} (${student.rollNumber})`;
            studentSelect.appendChild(option);
        });

    } catch (error) {
        displayError('Failed to load students list: ' + error.message);
    }
}

function handleStudentSelect() {
    selectedStudentId = studentSelect.value;
    stdID=selectedStudentId;
    if (selectedStudentId) {
        fetchStudentCourses(selectedStudentId);
        fetchStudentAvailableCourses(selectedStudentId);
    } else {
        // adminStudentCoursesContainer.innerHTML = '<div class="empty-message">Select a student to view their courses</div>';
        // adminAvailableCoursesContainer.innerHTML = '<div class="empty-message">Select a student to view available courses</div>';
    }
}

async function fetchStudentCourses(studentId) {
    try {
        // adminStudentCoursesContainer.innerHTML = '<div class="loading">Loading student courses...</div>';

        const response = await fetch(`${API_BASE_URL}/registration/students/${studentId}/courses`, {
            method: 'GET',
            headers: {
                'Authorization': token
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch student courses');
        }

        const data = await response.json();
        renderAdminStudentCourses(data.courses, studentId);

    } catch (error) {
        displayError(error.message);
        // adminStudentCoursesContainer.innerHTML = '<div class="empty-message">Error loading student courses</div>';
    }
}

async function fetchStudentAvailableCourses(studentId) {
    try {
        // adminAvailableCoursesContainer.innerHTML = '<div class="loading">Loading available courses...</div>';

        // We'll use the same available courses endpoint but filter out courses the student is already registered for
        const coursesResponse = await fetch(`${API_BASE_URL}/courses/all`, {
            method: 'GET',
            headers: {
                'Authorization': token
            }
        });

        if (!coursesResponse.ok) {
            throw new Error('Failed to fetch course information');
        }

        const coursesData = await coursesResponse.json();

        // Fetch student's registered courses to filter them out
        const studentCoursesResponse = await fetch(`${API_BASE_URL}/registration/students/${studentId}/courses`, {
            method: 'GET',
            headers: {
                'Authorization': token
            }
        });

        if (!studentCoursesResponse.ok) {
            throw new Error('Failed to fetch student courses');
        }

        const studentCoursesData = await studentCoursesResponse.json();
        const studentCourseIds = studentCoursesData.courses.map(course => course._id);

        // Filter out courses the student is already registered for
        allCourses = coursesData.filter(course => !studentCourseIds.includes(course._id));

        renderAdminAvailableCourses(allCourses, studentId);

    } catch (error) {
        displayError(error.message);
        // adminAvailableCoursesContainer.innerHTML = '<div class="empty-message">Error loading available courses</div>';
    }
}




function renderAdminStudentCourses(courses, studentId) {
    registeredCoursesContainer.innerHTML = '';

    if (!courses || courses.length === 0) {
        registeredCoursesContainer.innerHTML = '<div class="empty-message">Student is not registered for any courses.</div>';
        return;
    }

    courses.forEach(course => {
        const courseElement = document.createElement('div');
        courseElement.className = 'registered-card admin-card';

        const scheduleText = formatSchedule(course.schedule);

        courseElement.innerHTML = `
      <h3 class="course-title">${course.code}: ${course.title}</h3>
      <div class="course-details">
        <p>Instructor: ${course.instructor}</p>
        <p>Department: ${course.department} | Level: ${course.level}</p>
        <p class="schedule-details">${scheduleText}</p>
      </div>
      <button class="btn-danger action-btn" onclick="adminDropStudent('${studentId}', '${course._id}')">Drop Student</button>
    `;

        registeredCoursesContainer.appendChild(courseElement);
    });
}

function renderAdminAvailableCourses(courses, studentId) {
    availableCoursesContainer.innerHTML = '';

    if (!courses || courses.length === 0) {
        availableCoursesContainer.innerHTML = '<p>No available courses found.</p>';
        return;
    }

    courses.forEach(course => {
        const isRegistered = registeredCourses.some(c => c._id === course._id);

        if (!isRegistered) {
            const courseElement = document.createElement('div');
            courseElement.className = 'course-card';

            const scheduleText = formatSchedule(course.schedule);
            const seatsClass = course.availableSeats <= 5 ? 'seats-available low' : 'seats-available';

            courseElement.innerHTML = `
        <h3 class="course-title">${course.code}: ${course.title}</h3>
        <div class="course-details">
          <p>Instructor: ${course.instructor}</p>
          <p>Department: ${course.department} | Level: ${course.level}</p>
          <p class="schedule-details">${scheduleText}</p>
        </div>
        <div class="${seatsClass}">
          Available Seats: <span>${course.availableSeats}</span>
        </div>

        <button class="btn-primary action-btn" onclick="adminEnrollStudent('${studentId}', '${course._id}')">Enroll </button>

      `;

            availableCoursesContainer.appendChild(courseElement);
        }
    });
}



async function adminEnrollStudent(studentId, courseId) {
    try {
        displayMessage('Processing enrollment...', 'success');

        const response = await fetch(`${API_BASE_URL}/registration/admin/enroll/${studentId}/${courseId}`, {
            method: 'POST',
            headers: {
                'Authorization': token
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to enroll student in course');
        }

        displaySuccess('Successfully enrolled student in course!');

        // Refresh courses for the selected student
        fetchStudentCourses(studentId);
        fetchStudentAvailableCourses(studentId);

    } catch (error) {
        displayError(error.message);
    }
}

async function adminDropStudent(studentId, courseId) {
    try {
        displayMessage('Processing drop request...', 'success');

        const response = await fetch(`${API_BASE_URL}/registration/admin/drop/${studentId}/${courseId}`, {
            method: 'POST',
            headers: {
                'Authorization': token
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to drop student from course');
        }

        displaySuccess('Successfully dropped the student from course!');

        // Refresh courses for the selected student
        fetchStudentCourses(studentId);
        fetchStudentAvailableCourses(studentId);

    } catch (error) {
        displayError(error.message);
    }
}



function handleLogout() {
    // This would typically clear your token and redirect to login
    localStorage.removeItem('authToken');
    location.href = '/public/html/index.html'; // Redirect to your login page
}

// Student Information
async function fetchStudentInfo() {
    try {
        const response = await fetch(`${API_BASE_URL}/registration/students/profile`, {
            method: 'GET',
            headers: {
                'Authorization': token
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch student information');
        }

        const data = await response.json();
        studentNameElement.textContent = data.student.name || "Student";

    } catch (error) {
        displayError(error.message);
    }
}

// Course Functions
async function fetchAvailableCourses() {
    try {
        // Step 1: Fetch available seats data
        const seatsResponse = await fetch(`${API_BASE_URL}/registration/courses`, {
            method: 'GET',
            headers: {
                'Authorization': token
            }
        });

        if (!seatsResponse.ok) {
            throw new Error('Failed to fetch available seats');
        }

        const seatsData = await seatsResponse.json();
        const seatsMap = new Map(seatsData.courses.map(course => [course._id, course.availableSeats]));
        // Step 2: Fetch all courses
        const coursesResponse = await fetch(`${API_BASE_URL}/courses/all`, {
            method: 'GET',
            headers: {
                'Authorization': token
            }
        });

        if (!coursesResponse.ok) {
            throw new Error('Failed to fetch course information');
        }

        const coursesData = await coursesResponse.json();
        // Step 3: Merge available seats data with course details
        allCourses = coursesData.map(course => ({
            ...course,
            availableSeats: seatsMap.get(course._id) || 0 // Default to 0 if not found
        }));

        // Step 4: Render courses
        renderAvailableCourses(allCourses);

    } catch (error) {
        displayError(error.message);
        availableCoursesContainer.innerHTML = '<p>Error loading courses. Please try again.</p>';
    }
}


async function fetchRegisteredCourses() {
    try {
        const response = await fetch(`${API_BASE_URL}/registration/students/courses`, {
            method: 'GET',
            headers: {
                'Authorization': token
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch registered courses');
        }

        const data = await response.json();
        registeredCourses = data.courses;
        renderRegisteredCourses(registeredCourses);

    } catch (error) {
        displayError(error.message);
        registeredCoursesContainer.innerHTML = '<p>Error loading your courses. Please try again.</p>';
    }
}

async function enrollInCourse(courseId) {
    try {
        // Show loading state
        displayMessage('Processing enrollment...', 'success');

        const response = await fetch(`${API_BASE_URL}/registration/enroll/${courseId}`, {
            method: 'POST',
            headers: {
                'Authorization': token
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to enroll in course');
        }

        displaySuccess('Successfully enrolled in course!');

        // Refresh course lists
        fetchAvailableCourses();
        fetchRegisteredCourses();

    } catch (error) {
        displayError(error.message);
    }
}

async function dropCourse(courseId) {
    try {
        // Show loading state
        displayMessage('Processing drop request...', 'success');

        const response = await fetch(`${API_BASE_URL}/registration/drop/${courseId}`, {
            method: 'POST',
            headers: {
                'Authorization': token
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to drop course');
        }

        displaySuccess('Successfully dropped the course!');

        // Refresh course lists
        fetchAvailableCourses();
        fetchRegisteredCourses();

    } catch (error) {
        displayError(error.message);
    }
}

// Rendering Functions
function renderAvailableCourses(courses) {
    availableCoursesContainer.innerHTML = '';

    if (!courses || courses.length === 0) {
        availableCoursesContainer.innerHTML = '<p>No available courses found.</p>';
        return;
    }

    courses.forEach(course => {
        const isRegistered = registeredCourses.some(c => c._id === course._id);

        if (!isRegistered) {
            const courseElement = document.createElement('div');
            courseElement.className = 'course-card';

            const scheduleText = formatSchedule(course.schedule);
            const seatsClass = course.availableSeats <= 5 ? 'seats-available low' : 'seats-available';

            courseElement.innerHTML = `
        <h3 class="course-title">${course.code}: ${course.title}</h3>
        <div class="course-details">
          <p>Instructor: ${course.instructor}</p>
          <p>Department: ${course.department} | Level: ${course.level}</p>
          <p class="schedule-details">${scheduleText}</p>
        </div>
        <div class="${seatsClass}">
          Available Seats: <span>${course.availableSeats}</span>
        </div>
        
        <button class="btn-primary action-btn" onclick="enrollInCourse('${course._id}')">Enroll</button>
      `;

            availableCoursesContainer.appendChild(courseElement);
        }
    });
}

function renderRegisteredCourses(courses) {
    registeredCoursesContainer.innerHTML = '';

    if (!courses || courses.length === 0) {
        registeredCoursesContainer.innerHTML = '<p>You are not registered for any courses.</p>';
        return;
    }

    courses.forEach(course => {
        const courseElement = document.createElement('div');
        courseElement.className = 'registered-card';

        const scheduleText = formatSchedule(course.schedule);

        courseElement.innerHTML = `
      <h3 class="course-title">${course.code}: ${course.title}</h3>
      <div class="course-details">
        <p>Instructor: ${course.instructor}</p>
        <p>Department: ${course.department} | Level: ${course.level}</p>
        <p class="schedule-details">${scheduleText}</p>
      </div>
      <button class="btn-danger action-btn" onclick="dropCourse('${course._id}')">Drop Course</button>
    `;

        registeredCoursesContainer.appendChild(courseElement);
    });
}

// Helper Functions
function formatSchedule(schedule) {
    if (!schedule || !schedule.days || !schedule.startTime || !schedule.endTime) {
        return 'Schedule not available';
    }

    const days = schedule.days.join(', ');
    return `${days} from ${schedule.startTime} to ${schedule.endTime}`;
}

function filterCourses() {
    const searchTerm = courseSearch.value.toLowerCase();
    const department = departmentFilter.value;
    const timeOfDay = timeFilter.value;

    const filteredCourses = allCourses.filter(course => {
        const matchesSearch =
            course.title.toLowerCase().includes(searchTerm) ||
            course.code.toLowerCase().includes(searchTerm) ||
            course.instructor.toLowerCase().includes(searchTerm);

        const matchesDepartment =
            department === '' || course.department === department;

        const matchesTime =
            timeOfDay === '' || course.timeOfDay === timeOfDay;

        return matchesSearch && matchesDepartment && matchesTime;
    });

    renderAvailableCourses(filteredCourses);
}

// Message Display Functions
function displayError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
    successMessage.classList.add('hidden');

    // Auto hide after 5 seconds
    setTimeout(() => {
        errorMessage.classList.add('hidden');
    }, 5000);
}

function displaySuccess(message) {
    successMessage.textContent = message;
    successMessage.classList.remove('hidden');
    errorMessage.classList.add('hidden');

    // Auto hide after 5 seconds
    setTimeout(() => {
        successMessage.classList.add('hidden');
    }, 5000);
}

function displayMessage(message, type) {
    if (type === 'error') {
        displayError(message);
    } else {
        displaySuccess(message);
    }
}

// Make functions available to inline event handlers
// window.enrollInCourse = enrollInCourse;
// window.dropCourse = dropCourse;