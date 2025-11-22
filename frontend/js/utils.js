/**
 * Format date to readable string
 * @param {string} dateString - ISO date string (YYYY-MM-DD)
 * @returns {string} Formatted date
 */
function formatDate(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Reset time to compare dates only
  today.setHours(0, 0, 0, 0);
  tomorrow.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  if (date.getTime() === today.getTime()) {
    return "Today";
  } else if (date.getTime() === tomorrow.getTime()) {
    return "Tomorrow";
  } else {
    const options = { month: "short", day: "numeric", year: "numeric" };
    return date.toLocaleDateString("en-US", options);
  }
}

/**
 * Calculate days until due date
 * @param {string} dueDate - ISO date string
 * @returns {number} Days until due (negative if overdue)
 */
function daysUntilDue(dueDate) {
  const today = new Date();
  const due = new Date(dueDate);

  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  const diffTime = due - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Check if assignment is overdue
 * @param {string} dueDate - ISO date string
 * @param {boolean} completed - Completion status
 * @returns {boolean}
 */
function isOverdue(dueDate, completed) {
  if (completed) return false;
  return daysUntilDue(dueDate) < 0;
}

/**
 * Check if due soon (within 3 days)
 * @param {string} dueDate - ISO date string
 * @param {boolean} completed - Completion status
 * @returns {boolean}
 */
function isDueSoon(dueDate, completed) {
  if (completed) return false;
  const days = daysUntilDue(dueDate);
  return days >= 0 && days <= 3;
}

/**
 * Get priority display info
 * @param {string} priority - Priority level (low, medium, high)
 * @returns {object} Priority info
 */
function getPriorityInfo(priority) {
  const priorities = {
    high: { class: "priority-high", label: "High", order: 1 },
    medium: { class: "priority-medium", label: "Medium", order: 2 },
    low: { class: "priority-low", label: "Low", order: 3 },
  };
  return priorities[priority] || priorities.medium;
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Show modal
 * @param {string} modalId - Modal element ID
 */
function showModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add("active");
    // Focus first input
    const firstInput = modal.querySelector("input, select, textarea");
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 100);
    }
  }
}

/**
 * Close modal
 * @param {string} modalId - Modal element ID
 */
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove("active");
    // Reset form if exists
    const form = modal.querySelector("form");
    if (form) {
      form.reset();
      delete form.dataset.editId;
    }
  }
}

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {string} type - Type: success, error, info
 */
function showToast(message, type = "info") {
  // Simple alert for now - can be enhanced with custom toast UI
  console.log(`[${type.toUpperCase()}] ${message}`);

  // You could implement a custom toast notification here
  // For now, using browser alert for critical errors only
  if (type === "error") {
    alert(message);
  }
}

/**
 * Debounce function to limit execution rate
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Get today's date in YYYY-MM-DD format
 * @returns {string} Today's date
 */
function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Sort assignments by criteria
 * @param {Array} assignments - Array of assignments
 * @param {string} sortBy - Sort criteria
 * @returns {Array} Sorted assignments
 */
function sortAssignments(assignments, sortBy) {
  const sorted = [...assignments];

  switch (sortBy) {
    case "dueDate":
      sorted.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
      break;
    case "priority":
      sorted.sort((a, b) => {
        const priorityOrder = { high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
      break;
    case "points":
      sorted.sort((a, b) => b.points - a.points);
      break;
    default:
      sorted.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  }

  return sorted;
}

/**
 * Filter assignments by criteria
 * @param {Array} assignments - Array of assignments
 * @param {object} filters - Filter criteria
 * @returns {Array} Filtered assignments
 */
function filterAssignments(assignments, filters) {
  let filtered = [...assignments];

  // Filter by course
  if (filters.courseId) {
    filtered = filtered.filter(
      (a) => a.courseId === parseInt(filters.courseId)
    );
  }

  // Filter by status
  if (filters.status === "completed") {
    filtered = filtered.filter((a) => a.completed);
  } else if (filters.status === "incomplete") {
    filtered = filtered.filter((a) => !a.completed);
  }

  // Filter by search term
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(
      (a) =>
        a.title.toLowerCase().includes(searchLower) ||
        (a.description && a.description.toLowerCase().includes(searchLower)) ||
        (a.courseName && a.courseName.toLowerCase().includes(searchLower))
    );
  }

  return filtered;
}

/**
 * Calculate progress percentage
 * @param {number} completed - Completed count
 * @param {number} total - Total count
 * @returns {number} Percentage (0-100)
 */
function calculateProgress(completed, total) {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}
