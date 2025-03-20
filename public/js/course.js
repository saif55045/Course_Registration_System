// DOM Elements
const userRoleElement = document.getElementById('user-role');
const userNameElement = document.getElementById('user-name');
const adminPanel = document.getElementById('admin-panel');
const searchForm = document.getElementById('search-form');
const coursesTable = document.getElementById('courses-table');
const coursesBody = document.getElementById('courses-body');
const addCourseBtn = document.getElementById('add-course-btn');
const courseModal = document.getElementById('course-modal');
const closeModal = document.getElementById('close-modal');
const courseForm = document.getElementById('course-form');
const modalTitle = document.getElementById('modal-title');
const courseIdInput = document.getElementById('course-id');
const deleteModal = document.getElementById('delete-modal');
const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
const deleteCourseIdInput = document.getElementById('delete-course-id');
const logoutBtn = document.getElementById('logout-btn');
const messageContainer = document.getElementById('message-container');
const registeration=document.getElementById('registration');
const schedule=document.getElementById('schedule');
registeration.addEventListener('click',()=>{
    window.location.href = '/public/html/registration.html';
});
schedule.addEventListener('click',()=>{
    window.location.href = '/public/html/schedule.html';
});
// Authentication & Global Variables
let currentUser = null;
let authToken = localStorage.getItem('authToken');

// Check if user is logged in
function checkAuth() {
    if (!authToken) {
        window.location.href = '/public/html/index.html';
        return;
    }

    // Decode JWT token to get user info
    // This is a simple implementation - in production, you'd verify the token server-side
    try {
        const tokenPayload = JSON.parse(atob(authToken.split('.')[1]));
        currentUser = {
            id: tokenPayload.id,
            role: tokenPayload.role,
            rollNumber: tokenPayload.rollNumber || null
        };

        // Update UI based on user role
        userRoleElement.textContent = currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1);
        userNameElement.textContent = currentUser.rollNumber || 'Administrator';

        // Show admin panel if user is admin
        if (currentUser.role === 'admin') {
            adminPanel.style.display = 'block';
            console.log('admin');
            schedule.classList.add('hidden');
            // Show admin-only columns
            const adminOnlyElements = document.querySelectorAll('.admin-only');
            adminOnlyElements.forEach(el => el.style.display = 'table-cell');
        }
        // Load courses
        fetchCourses();

    } catch (error) {
        console.error('Invalid token', error);
        logout();
    }
}

// Fetch all courses
async function fetchCourses(filters = {}) {
    try {
        // Build query string from filters
        const queryParams = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value) queryParams.append(key, value);
        });

        const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
        const endpoint = queryString ? `http://localhost:5000/api/courses/search${queryString}` : 'http://localhost:5000/api/courses/all';

        const response = await fetch(endpoint, {
            headers: {
                'Authorization': `${authToken}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch courses');
        }

        const courses = await response.json();
        renderCourses(courses);

    } catch (error) {
        showMessage(error.message, 'error');
    }
}

// Render courses to table
function renderCourses(courses) {
    coursesBody.innerHTML = '';

    if (courses.length === 0) {
        coursesBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 20px;">
                    No courses found matching your criteria.
                </td>
            </tr>
        `;
        return;
    }

    courses.forEach(course => {
        const row = document.createElement('tr');

        row.innerHTML = `
            <td>${course.code || 'N/A'}</td>
            <td>${course.title || 'N/A'}</td>
            <td>${course.department || 'N/A'}</td>
            <td>${course.level || 'N/A'}</td>
            <td>${course.timeOfDay || 'N/A'}</td>
            <td>${course.schedule.days || 'N/A'}</td>
            ${currentUser.role === 'admin' ? `
                <td>
                    <button class="action-btn edit-btn" data-id="${course._id}">Edit</button>
                    <button class="action-btn delete-btn" data-id="${course._id}">Delete</button>
                </td>
            ` : ''}
        `;

        coursesBody.appendChild(row);
    });

    // Add event listeners to action buttons
    if (currentUser.role === 'admin') {
        const editButtons = document.querySelectorAll('.edit-btn');
        const deleteButtons = document.querySelectorAll('.delete-btn');

        editButtons.forEach(btn => {
            btn.addEventListener('click', () => openEditModal(btn.dataset.id));
        });

        deleteButtons.forEach(btn => {
            btn.addEventListener('click', () => openDeleteModal(btn.dataset.id));
        });
    }
}

// Show/hide message
function showMessage(text, type = 'success') {
    messageContainer.textContent = text;
    messageContainer.className = `message ${type}`;
    messageContainer.classList.remove('hidden');

    // Auto hide after 5 seconds
    setTimeout(() => {
        messageContainer.classList.add('hidden');
    }, 5000);
}

// Search form submit handler
searchForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = new FormData(searchForm);
    const filters = {};

    for (const [key, value] of formData.entries()) {
        if (value) filters[key] = value;
    }

    fetchCourses(filters);
});

// Add new course
addCourseBtn.addEventListener('click', async () => {
    modalTitle.textContent = 'Add New Course';
    courseForm.reset();
    courseIdInput.value = '';

    // Fetch and populate available courses for prerequisites
    await populatePrerequisites();

    courseModal.style.display = 'flex';
});

async function populatePrerequisites() {
    try {
        const response = await fetch('http://localhost:5000/api/courses/all', {
            headers: {
                'Authorization': `${authToken}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch available courses');
        }

        const courses = await response.json();
        const prerequisitesSelect = document.getElementById('prerequisites');

        // Clear existing options
        prerequisitesSelect.innerHTML = '';

        // Add a default option
        prerequisitesSelect.innerHTML += `<option value="">Select Prerequisites (if any)</option>`;

        // Populate courses as options
        courses.forEach(course => {
            const option = document.createElement('option');
            option.value = course._id;
            option.textContent = `${course.code} - ${course.title}`;
            prerequisitesSelect.appendChild(option);
        });

    } catch (error) {
        console.error('Error fetching prerequisites:', error);
        showMessage(error.message, 'error');
    }
}


// Close modal
closeModal.addEventListener('click', () => {
    courseModal.style.display = 'none';
});

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === courseModal) {
        courseModal.style.display = 'none';
    }
    if (e.target === deleteModal) {
        deleteModal.style.display = 'none';
    }
});

// Open edit modal
async function openEditModal(courseId) {
    try {
        modalTitle.textContent = 'Edit Course';
        courseIdInput.value = courseId;

        // Fetch current course data
        const response = await fetch(`http://localhost:5000/api/courses/all`, {
            headers: {
                'Authorization': `${authToken}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch course details');
        }

        const courses = await response.json();
        const course = courses.find(c => c._id === courseId);

        if (!course) {
            throw new Error('Course not found');
        }

        // Populate form with course data
        document.getElementById('courseCode').value = course.code || '';
        document.getElementById('title').value = course.title || '';
        document.getElementById('instructor').value = course.instructor || '';
        document.getElementById('modal-department').value = course.department || '';
        document.getElementById('modal-level').value = course.level || '';
        document.getElementById('availableSeats').value = course.availableSeats || '';
        document.getElementById('modal-time').value = course.timeOfDay || '';

        // Populate days
        const daysSelect = document.getElementById('modal-days');
        const selectedDays = course.schedule?.days || [];
        [...daysSelect.options].forEach(option => {
            option.selected = selectedDays.includes(option.value);
        });

        // Populate prerequisites
        const prerequisitesSelect = document.getElementById('prerequisites');
        const selectedPrerequisites = course.prerequisites || [];
        [...prerequisitesSelect.options].forEach(option => {
            option.selected = selectedPrerequisites.includes(option.value);
        });

        // Populate schedule times
        document.getElementById('startTime').value = course.schedule?.startTime || '';
        document.getElementById('endTime').value = course.schedule?.endTime || '';

        courseModal.style.display = 'flex';

    } catch (error) {
        showMessage(error.message, 'error');
    }
}

// Open delete confirmation modal
function openDeleteModal(courseId) {
    deleteCourseIdInput.value = courseId;
    deleteModal.style.display = 'flex';
}

// Cancel delete
cancelDeleteBtn.addEventListener('click', () => {
    deleteModal.style.display = 'none';
});

// Confirm delete course
confirmDeleteBtn.addEventListener('click', async () => {
    const courseId = deleteCourseIdInput.value;

    try {
        const response = await fetch(`http://localhost:5000/api/courses/delete/${courseId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `${authToken}`
            }
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Failed to delete course');
        }

        // Close modal and refresh courses
        deleteModal.style.display = 'none';
        showMessage('Course deleted successfully');
        fetchCourses();

    } catch (error) {
        showMessage(error.message, 'error');
    }
});

// Save course (add or update)
courseForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(courseForm);
    const courseData = {};

    for (const [key, value] of formData.entries()) {
        if (key === 'days' || key === 'prerequisites') {
            // Handle multiple selections
            if (!courseData[key]) {
                courseData[key] = [];
            }
            courseData[key].push(value);
        } else if (key !== 'course-id') {
            courseData[key] = value;
        }
    }

    const courseId = courseIdInput.value;
    const isEditing = !!courseId;

    try {
        const endpoint = isEditing
            ? `http://localhost:5000/api/courses/update/${courseId}`
            : 'http://localhost:5000/api/courses/add';

        const method = isEditing ? 'PUT' : 'POST';

        const response = await fetch(endpoint, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `${authToken}`
            },
            body: JSON.stringify(courseData)
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Failed to save course');
        }

        // Close modal and refresh courses
        courseModal.style.display = 'none';
        showMessage(`Course ${isEditing ? 'updated' : 'added'} successfully`);
        fetchCourses();

    } catch (error) {
        showMessage(error.message, 'error');
    }
});

// Logout function
function logout() {
    localStorage.removeItem('authToken');
    window.location.href = '/public/html/index.html';
}

logoutBtn.addEventListener('click', logout);

// Initialize the page
checkAuth();