/**
 * Render all assignments in main content area
 * @param {Array} assignmentsData - Array of assignment objects
 */
function renderAssignments(assignmentsData = []) {
  const container = document.getElementById("assignments-container");
  const emptyState = document.getElementById("assignments-empty");

  if (!container) return;

  // Apply filters and sorting
  const filters = {
    courseId: document.getElementById("filter-course")?.value || "",
    status: document.getElementById("filter-status")?.value || "",
    search: document.getElementById("search-assignments")?.value || "",
  };

  const sortBy =
    document.getElementById("sort-assignments")?.value || "dueDate";

  let filtered = filterAssignments(assignmentsData, filters);
  filtered = sortAssignments(filtered, sortBy);

  if (filtered.length === 0) {
    if (emptyState) emptyState.style.display = "block";
    container.innerHTML = "";
    return;
  }

  if (emptyState) emptyState.style.display = "none";

  container.innerHTML = filtered
    .map((assignment) => createAssignmentCard(assignment))
    .join("");
}

/**
 * Create HTML for a single assignment card
 * @param {object} assignment - Assignment object
 * @returns {string} HTML string
 */
function createAssignmentCard(assignment) {
  const overdue = isOverdue(assignment.dueDate, assignment.completed);
  const dueSoon = isDueSoon(assignment.dueDate, assignment.completed);
  const priorityInfo = getPriorityInfo(assignment.priority);

  const cardClasses = [
    "assignment-card",
    assignment.completed ? "completed" : "",
    overdue ? "overdue" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const dueDateClass = dueSoon ? "due-date due-soon" : "due-date";

  return `
        <div class="${cardClasses}" data-assignment-id="${assignment.id}">
            <div class="assignment-header">
                <div class="assignment-main">
                    <div class="checkbox-container">
                        <input 
                            type="checkbox" 
                            ${assignment.completed ? "checked" : ""} 
                            onchange="handleToggleComplete(${assignment.id})"
                            aria-label="Mark as complete"
                        >
                        <span class="checkbox-custom"></span>
                    </div>
                    
                    <div class="assignment-content">
                        <span class="course-badge" style="background-color: ${
                          assignment.courseColor
                        };">
                            ${escapeHtml(assignment.courseCode)}
                        </span>
                        
                        <h3 class="assignment-title">${escapeHtml(
                          assignment.title
                        )}</h3>
                        
                        ${
                          assignment.description
                            ? `
                            <p class="assignment-description">${escapeHtml(
                              assignment.description
                            )}</p>
                        `
                            : ""
                        }
                        
                        <div class="assignment-meta">
                            <div class="meta-item">
                                <span class="${dueDateClass}">
                                    📅 ${formatDate(assignment.dueDate)}
                                    ${
                                      overdue
                                        ? " (Overdue)"
                                        : dueSoon
                                        ? " (Due Soon)"
                                        : ""
                                    }
                                </span>
                            </div>
                            
                            <div class="meta-item">
                                <span class="priority-badge ${
                                  priorityInfo.class
                                }">
                                    ${priorityInfo.label}
                                </span>
                            </div>
                            
                            <div class="meta-item">
                                <span class="points">💯 ${
                                  assignment.points
                                } pts</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="assignment-actions">
                    <button 
                        class="btn-edit-assignment" 
                        onclick="editAssignment(${assignment.id})"
                        aria-label="Edit assignment"
                    >
                        Edit
                    </button>
                    <button 
                        class="btn-delete-assignment" 
                        onclick="confirmDeleteAssignment(${assignment.id})"
                        aria-label="Delete assignment"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Open assignment modal for adding new assignment
 */
function openAddAssignmentModal() {
  const modal = document.getElementById("assignment-modal");
  const form = document.getElementById("assignment-form");
  const title = document.getElementById("assignment-modal-title");

  if (!modal || !form) return;

  form.reset();
  delete form.dataset.editId;

  // Set default due date to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];
  document.getElementById("assignment-duedate").value = tomorrowStr;

  if (title) title.textContent = "Add Assignment";

  showModal("assignment-modal");
}

/**
 * Open assignment modal for editing existing assignment
 * @param {number} assignmentId - Assignment ID to edit
 */
async function editAssignment(assignmentId) {
  try {
    const assignment = await fetchAssignment(assignmentId);

    if (!assignment) {
      showToast("Assignment not found", "error");
      return;
    }

    const modal = document.getElementById("assignment-modal");
    const form = document.getElementById("assignment-form");
    const title = document.getElementById("assignment-modal-title");

    if (!form) return;

    // Populate form
    document.getElementById("assignment-course").value = assignment.courseId;
    document.getElementById("assignment-title").value = assignment.title;
    document.getElementById("assignment-description").value =
      assignment.description || "";
    document.getElementById("assignment-duedate").value = assignment.dueDate;
    document.getElementById("assignment-priority").value = assignment.priority;
    document.getElementById("assignment-points").value = assignment.points;

    // Set edit mode
    form.dataset.editId = assignmentId;

    if (title) title.textContent = "Edit Assignment";

    showModal("assignment-modal");
  } catch (error) {
    console.error("Failed to load assignment for editing:", error);
    showToast("Failed to load assignment", "error");
  }
}

/**
 * Handle assignment form submission
 * @param {Event} e - Submit event
 */
async function handleAssignmentSubmit(e) {
  e.preventDefault();

  const form = e.target;
  const editId = form.dataset.editId;

  const assignmentData = {
    courseId: parseInt(document.getElementById("assignment-course").value),
    title: document.getElementById("assignment-title").value.trim(),
    description: document.getElementById("assignment-description").value.trim(),
    dueDate: document.getElementById("assignment-duedate").value,
    priority: document.getElementById("assignment-priority").value,
    points: parseInt(document.getElementById("assignment-points").value) || 0,
  };

  // Validate course selection
  if (!assignmentData.courseId) {
    showToast("Please select a course", "error");
    return;
  }

  try {
    if (editId) {
      // Update existing assignment
      await updateAssignmentAPI(editId, assignmentData);
      showToast("Assignment updated successfully", "success");
    } else {
      // Create new assignment
      await createAssignmentAPI(assignmentData);
      showToast("Assignment created successfully", "success");
    }

    // Refresh data
    await refreshAllData();

    // Close modal
    closeModal("assignment-modal");
  } catch (error) {
    console.error("Failed to save assignment:", error);
    showToast("Failed to save assignment. Please try again.", "error");
  }
}

/**
 * Handle toggle assignment completion
 * @param {number} assignmentId - Assignment ID
 */
async function handleToggleComplete(assignmentId) {
  try {
    await toggleAssignmentCompleteAPI(assignmentId);

    // Refresh data
    await refreshAllData();
  } catch (error) {
    console.error("Failed to toggle completion:", error);
    showToast("Failed to update assignment. Please try again.", "error");
  }
}

/**
 * Confirm and delete assignment
 * @param {number} assignmentId - Assignment ID to delete
 */
async function confirmDeleteAssignment(assignmentId) {
  const confirmed = confirm("Delete this assignment?");

  if (!confirmed) return;

  try {
    await deleteAssignmentAPI(assignmentId);
    showToast("Assignment deleted successfully", "success");

    // Refresh data
    await refreshAllData();
  } catch (error) {
    console.error("Failed to delete assignment:", error);
    showToast("Failed to delete assignment. Please try again.", "error");
  }
}
