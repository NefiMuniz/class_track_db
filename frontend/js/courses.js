/**
 * Render all courses in sidebar
 * @param {Array} coursesData - Array of course objects
 */
function renderCourses(coursesData = []) {
  const container = document.getElementById("courses-container");
  const emptyState = document.getElementById("courses-empty");

  if (!container) return;

  if (coursesData.length === 0) {
    if (emptyState) emptyState.style.display = "block";
    container.innerHTML = "";
    return;
  }

  if (emptyState) emptyState.style.display = "none";

  container.innerHTML = coursesData
    .map((course) => createCourseCard(course))
    .join("");

  // Update course select dropdown in assignment form
  updateCourseSelect(coursesData);

  // Update filter dropdown
  updateCourseFilter(coursesData);
}

/**
 * Create HTML for a single course card
 * @param {object} course - Course object
 * @returns {string} HTML string
 */
function createCourseCard(course) {
  const progress = course.progress || 0;
  const total = course.totalAssignments || 0;
  const completed = course.completedAssignments || 0;

  return `
        <div class="course-card" data-course-id="${course.id}" data-color="${
    course.color
  }">
            <div class="course-header">
                <h3 class="course-name">${escapeHtml(course.name)}</h3>
                <span class="course-code">${escapeHtml(course.code)}</span>
            </div>
            
            <div class="course-info">
                <span>📚 ${course.credits} credits</span>
                <span>📅 ${escapeHtml(course.semester)}</span>
            </div>
            
            <div class="course-progress">
                <div class="course-progress-label">
                    <span>Progress</span>
                    <span>${completed}/${total} (${progress}%)</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-bar-fill" style="width: ${progress}%; background-color: ${
    course.color
  };"></div>
                </div>
            </div>
            
            <div class="course-actions">
                <button class="btn-icon btn-edit" onclick="editCourse(${
                  course.id
                })" title="Edit Course">
                    ✏️
                </button>
                <button class="btn-icon btn-delete" onclick="confirmDeleteCourse(${
                  course.id
                })" title="Delete Course">
                    🗑️
                </button>
            </div>
        </div>
    `;
}

/**
 * Update course select dropdown in assignment form
 * @param {Array} coursesData - Array of courses
 */
function updateCourseSelect(coursesData) {
  const select = document.getElementById("assignment-course");
  if (!select) return;

  // Keep current selection
  const currentValue = select.value;

  select.innerHTML =
    '<option value="">Select a course</option>' +
    coursesData
      .map(
        (course) =>
          `<option value="${course.id}">${escapeHtml(
            course.code
          )} - ${escapeHtml(course.name)}</option>`
      )
      .join("");

  // Restore selection if still valid
  if (currentValue && coursesData.find((c) => c.id == currentValue)) {
    select.value = currentValue;
  }
}

/**
 * Update course filter dropdown
 * @param {Array} coursesData - Array of courses
 */
function updateCourseFilter(coursesData) {
  const filter = document.getElementById("filter-course");
  if (!filter) return;

  const currentValue = filter.value;

  filter.innerHTML =
    '<option value="">All Courses</option>' +
    coursesData
      .map(
        (course) =>
          `<option value="${course.id}">${escapeHtml(course.code)}</option>`
      )
      .join("");

  if (currentValue && coursesData.find((c) => c.id == currentValue)) {
    filter.value = currentValue;
  }
}

/**
 * Open course modal for adding new course
 */
function openAddCourseModal() {
  const modal = document.getElementById("course-modal");
  const form = document.getElementById("course-form");
  const title = document.getElementById("course-modal-title");

  if (!modal || !form) return;

  form.reset();
  delete form.dataset.editId;

  if (title) title.textContent = "Add Course";

  showModal("course-modal");
}

/**
 * Open course modal for editing existing course
 * @param {number} courseId - Course ID to edit
 */
async function editCourse(courseId) {
  try {
    const course = await fetchCourse(courseId);

    if (!course) {
      showToast("Course not found", "error");
      return;
    }

    const modal = document.getElementById("course-modal");
    const form = document.getElementById("course-form");
    const title = document.getElementById("course-modal-title");

    if (!form) return;

    // Populate form
    document.getElementById("course-name").value = course.name;
    document.getElementById("course-code").value = course.code;
    document.getElementById("course-color").value = course.color;
    document.getElementById("course-credits").value = course.credits;
    document.getElementById("course-semester").value = course.semester;

    // Set edit mode
    form.dataset.editId = courseId;

    if (title) title.textContent = "Edit Course";

    showModal("course-modal");
  } catch (error) {
    console.error("Failed to load course for editing:", error);
    showToast("Failed to load course", "error");
  }
}

/**
 * Handle course form submission
 * @param {Event} e - Submit event
 */
async function handleCourseSubmit(e) {
  e.preventDefault();

  const form = e.target;
  const editId = form.dataset.editId;

  const courseData = {
    name: document.getElementById("course-name").value.trim(),
    code: document.getElementById("course-code").value.trim().toUpperCase(),
    color: document.getElementById("course-color").value,
    credits: parseInt(document.getElementById("course-credits").value),
    semester: document.getElementById("course-semester").value.trim(),
  };

  try {
    if (editId) {
      // Update existing course
      await updateCourseAPI(editId, courseData);
      showToast("Course updated successfully", "success");
    } else {
      // Create new course
      await createCourseAPI(courseData);
      showToast("Course created successfully", "success");
    }

    // Refresh data
    await refreshAllData();

    // Close modal
    closeModal("course-modal");
  } catch (error) {
    console.error("Failed to save course:", error);
    showToast("Failed to save course. Please try again.", "error");
  }
}

/**
 * Confirm and delete course
 * @param {number} courseId - Course ID to delete
 */
async function confirmDeleteCourse(courseId) {
  const confirmed = confirm(
    "Delete this course? All assignments will also be deleted."
  );

  if (!confirmed) return;

  try {
    await deleteCourseAPI(courseId);
    showToast("Course deleted successfully", "success");
    refreshAllData();
    // Refresh data
    await refreshAllData();
  } catch (error) {
    console.error("Failed to delete course:", error);
    showToast("Failed to delete course. Please try again.", "error");
  }
}
