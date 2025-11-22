// ==================== GLOBAL STATE ====================

let courses = [];
let assignments = [];
let currentFilters = {
  courseId: "",
  status: "",
  search: "",
};
let currentSort = "dueDate";

// ==================== INITIALIZATION ====================

/**
 * Initialize application on page load
 */
async function initializeApp() {
  console.log("🚀 ClassTrack initializing...");
  console.log("📡 Connecting to API at:", API_BASE_URL);

  try {
    // Show loading state
    showLoadingState();

    // Fetch initial data from API
    await loadInitialData();

    // Render UI
    renderUI();

    // Attach event listeners
    attachEventListeners();

    console.log("✅ ClassTrack ready!");
    console.log(
      `📊 Loaded ${courses.length} courses and ${assignments.length} assignments`
    );
  } catch (error) {
    console.error("❌ Failed to initialize:", error);
    showErrorState();
  }
}

/**
 * Load initial data from API
 */
async function loadInitialData() {
  try {
    // Fetch courses and assignments in parallel
    [courses, assignments] = await Promise.all([
      fetchCourses(),
      fetchAssignments(),
    ]);

    console.log("Data loaded:", {
      courses: courses.length,
      assignments: assignments.length,
    });
  } catch (error) {
    console.error("Failed to load initial data:", error);
    throw error;
  }
}

/**
 * Refresh all data from API
 */
async function refreshAllData() {
  try {
    // Fetch updated data
    [courses, assignments] = await Promise.all([
      fetchCourses(),
      fetchAssignments(),
    ]);

    // Re-render UI
    renderUI();
  } catch (error) {
    console.error("Failed to refresh data:", error);
    showToast("Failed to refresh data", "error");
  }
}

/**
 * Render complete UI
 */
function renderUI() {
  renderCourses(courses);
  renderAssignments(assignments);
  updateStatistics();
}

// ==================== STATISTICS ====================

/**
 * Update statistics display
 */
async function updateStatistics() {
  try {
    const stats = await fetchStatistics();

    // Update stat cards
    document.getElementById("stat-total").textContent = stats.total;
    document.getElementById("stat-completed").textContent = stats.completed;
    document.getElementById("stat-overdue").textContent = stats.overdue;
    document.getElementById("stat-rate").textContent =
      stats.completionRate + "%";

    // Update points
    document.getElementById("points-earned").textContent = stats.earnedPoints;
    document.getElementById("points-total").textContent = stats.totalPoints;

    // Update chart
    updateChart(stats);
  } catch (error) {
    console.error("Failed to update statistics:", error);
  }
}

// ==================== EVENT LISTENERS ====================

/**
 * Attach all event listeners
 */
function attachEventListeners() {
  // Header buttons
  const btnAddCourse = document.getElementById("btn-add-course");
  const btnAddAssignment = document.getElementById("btn-add-assignment");

  if (btnAddCourse) {
    btnAddCourse.addEventListener("click", openAddCourseModal);
  }

  if (btnAddAssignment) {
    btnAddAssignment.addEventListener("click", openAddAssignmentModal);
  }

  // Forms
  const courseForm = document.getElementById("course-form");
  const assignmentForm = document.getElementById("assignment-form");

  if (courseForm) {
    courseForm.addEventListener("submit", handleCourseSubmit);
  }

  if (assignmentForm) {
    assignmentForm.addEventListener("submit", handleAssignmentSubmit);
  }

  // Search and filters
  const searchInput = document.getElementById("search-assignments");
  const filterCourse = document.getElementById("filter-course");
  const filterStatus = document.getElementById("filter-status");
  const sortSelect = document.getElementById("sort-assignments");

  if (searchInput) {
    searchInput.addEventListener(
      "input",
      debounce(() => {
        renderAssignments(assignments);
      }, 300)
    );
  }

  if (filterCourse) {
    filterCourse.addEventListener("change", () => {
      renderAssignments(assignments);
    });
  }

  if (filterStatus) {
    filterStatus.addEventListener("change", () => {
      renderAssignments(assignments);
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener("change", () => {
      renderAssignments(assignments);
    });
  }

  // Modal close on outside click
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal")) {
      const modalId = e.target.id;
      closeModal(modalId);
    }
  });

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    // Escape key closes modals
    if (e.key === "Escape") {
      const activeModal = document.querySelector(".modal.active");
      if (activeModal) {
        closeModal(activeModal.id);
      }
    }
  });

  // Seed database
  const btnSeedDb = document.getElementById('seed-db-btn');
  if (btnSeedDb) {
    btnSeedDb.addEventListener('click', async () => {
      if (confirm('Seed database with sample data? This will remove all current data.')) {
        try {
          const response = await fetch('/api/seed', { method: 'POST' });
          const result = await response.json();
          if (result.success) {
            alert('Database seeded successfully!');
            await refreshAllData();
          } else {
            alert('Error seeding database: ' + result.error);
          }
        } catch (e) {
          alert('Failed to contact server.');
        }
      }
    });
  }
}

// ==================== UI STATE MANAGEMENT ====================

/**
 * Show loading state
 */
function showLoadingState() {
  const coursesContainer = document.getElementById("courses-container");
  const assignmentsContainer = document.getElementById("assignments-container");

  if (coursesContainer) {
    coursesContainer.innerHTML =
      '<div class="text-center">Loading courses...</div>';
  }

  if (assignmentsContainer) {
    assignmentsContainer.innerHTML =
      '<div class="text-center">Loading assignments...</div>';
  }
}

/**
 * Show error state
 */
function showErrorState() {
  const mainContent = document.querySelector(".app-main");
  if (mainContent) {
    mainContent.innerHTML = `
            <div style="text-align: center; padding: 4rem 2rem;">
                <h2 style="color: var(--color-red); margin-bottom: 1rem;">⚠️ Connection Error</h2>
                <p style="color: var(--color-text-secondary); margin-bottom: 2rem;">
                    Failed to connect to the backend server.
                </p>
                <p style="color: var(--color-text-secondary); margin-bottom: 2rem;">
                    Please make sure the Flask backend is running:
                </p>
                <pre style="background: var(--color-gray-800); color: var(--color-white); padding: 1rem; border-radius: 8px; text-align: left; max-width: 500px; margin: 0 auto;">cd backend
python app.py</pre>
                <button class="btn btn-primary" onclick="location.reload()" style="margin-top: 2rem;">
                    Retry Connection
                </button>
            </div>
        `;
  }
}

// ==================== WINDOW FUNCTIONS ====================

/**
 * Make functions globally accessible for onclick handlers
 */
window.openAddCourseModal = openAddCourseModal;
window.editCourse = editCourse;
window.confirmDeleteCourse = confirmDeleteCourse;
window.openAddAssignmentModal = openAddAssignmentModal;
window.editAssignment = editAssignment;
window.confirmDeleteAssignment = confirmDeleteAssignment;
window.handleToggleComplete = handleToggleComplete;
window.closeModal = closeModal;

// ==================== APPLICATION START ====================

/**
 * Start application when DOM is ready
 */
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp);
} else {
  initializeApp();
}

// Log startup info
console.log(
  "%cClassTrack Module 2",
  "color: #0062B8; font-size: 20px; font-weight: bold;"
);
console.log(
  "%cAPI-Powered with Python Flask + SQLite3",
  "color: #28A745; font-size: 14px;"
);
console.log(
  "%cBYU-Pathway Worldwide | CSE 310",
  "color: #FFB81C; font-size: 12px;"
);
