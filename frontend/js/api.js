/**
 * api.js - API Service Layer
 * Handles all communication with Flask backend
 *
 * ENVIRONMENT DETECTION:
 * - Local Development: Uses http://localhost:5000/api
 * - Production: Uses same origin (https://your-app.com/api)
 */

// ==================== ENVIRONMENT DETECTION ====================

/**
 * Determine API base URL based on environment
 *
 * LOCAL: hostname is 'localhost' or '127.0.0.1'
 * PRODUCTION: any other hostname (e.g., your-app.onrender.com)
 */
const isLocalEnvironment = () => {
  const hostname = window.location.hostname;
  return hostname === "localhost" || hostname === "127.0.0.1";
};

const API_BASE_URL = isLocalEnvironment()
  ? "http://localhost:5000/api" // Local development
  : `${window.location.origin}/api`; // Production (same origin)

// Log for debugging
console.log("🌐 Environment:", isLocalEnvironment() ? "LOCAL" : "PRODUCTION");
console.log("📡 API Base URL:", API_BASE_URL);

// ==================== API HELPER FUNCTION ====================

/**
 * Helper function for all API calls
 * Handles errors, JSON parsing, and error messages
 */
async function apiCall(endpoint, options = {}) {
  try {
    const url = `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

// ==================== COURSE API CALLS ====================

/**
 * GET all courses
 */
async function fetchCourses() {
  try {
    const response = await apiCall("/courses");
    return response.data || [];
  } catch (error) {
    console.error("Failed to fetch courses:", error);
    return [];
  }
}

/**
 * GET single course by ID
 */
async function fetchCourse(id) {
  try {
    const response = await apiCall(`/courses/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch course ${id}:`, error);
    return null;
  }
}

/**
 * POST create new course
 */
async function createCourseAPI(courseData) {
  try {
    const response = await apiCall("/courses", {
      method: "POST",
      body: JSON.stringify(courseData),
    });
    return response.data;
  } catch (error) {
    console.error("Failed to create course:", error);
    throw error;
  }
}

/**
 * PUT update course
 */
async function updateCourseAPI(id, courseData) {
  try {
    const response = await apiCall(`/courses/${id}`, {
      method: "PUT",
      body: JSON.stringify(courseData),
    });
    return response;
  } catch (error) {
    console.error(`Failed to update course ${id}:`, error);
    throw error;
  }
}

/**
 * DELETE course
 */
async function deleteCourseAPI(id) {
  try {
    const response = await apiCall(`/courses/${id}`, {
      method: "DELETE",
    });
    return response;
  } catch (error) {
    console.error(`Failed to delete course ${id}:`, error);
    throw error;
  }
}

// ==================== ASSIGNMENT API CALLS ====================

/**
 * GET all assignments
 */
async function fetchAssignments() {
  try {
    const response = await apiCall("/assignments");
    return response.data || [];
  } catch (error) {
    console.error("Failed to fetch assignments:", error);
    return [];
  }
}

/**
 * GET single assignment by ID
 */
async function fetchAssignment(id) {
  try {
    const response = await apiCall(`/assignments/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch assignment ${id}:`, error);
    return null;
  }
}

/**
 * POST create new assignment
 */
async function createAssignmentAPI(assignmentData) {
  try {
    const response = await apiCall("/assignments", {
      method: "POST",
      body: JSON.stringify(assignmentData),
    });
    return response.data;
  } catch (error) {
    console.error("Failed to create assignment:", error);
    throw error;
  }
}

/**
 * PUT update assignment
 */
async function updateAssignmentAPI(id, assignmentData) {
  try {
    const response = await apiCall(`/assignments/${id}`, {
      method: "PUT",
      body: JSON.stringify(assignmentData),
    });
    return response;
  } catch (error) {
    console.error(`Failed to update assignment ${id}:`, error);
    throw error;
  }
}

/**
 * PATCH toggle assignment completion
 */
async function toggleAssignmentCompleteAPI(id) {
  try {
    const response = await apiCall(`/assignments/${id}/complete`, {
      method: "PATCH",
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to toggle assignment ${id}:`, error);
    throw error;
  }
}

/**
 * DELETE assignment
 */
async function deleteAssignmentAPI(id) {
  try {
    const response = await apiCall(`/assignments/${id}`, {
      method: "DELETE",
    });
    return response;
  } catch (error) {
    console.error(`Failed to delete assignment ${id}:`, error);
    throw error;
  }
}

// ==================== STATISTICS API CALLS ====================

/**
 * GET overall statistics
 */
async function fetchStatistics() {
  try {
    const response = await apiCall("/stats");
    return (
      response.data || {
        total: 0,
        completed: 0,
        overdue: 0,
        completionRate: 0,
        totalPoints: 0,
        earnedPoints: 0,
      }
    );
  } catch (error) {
    console.error("Failed to fetch statistics:", error);
    return {
      total: 0,
      completed: 0,
      overdue: 0,
      completionRate: 0,
      totalPoints: 0,
      earnedPoints: 0,
    };
  }
}

/**
 * GET assignments due this week
 */
async function fetchWeekAssignments() {
  try {
    const response = await apiCall("/assignments/week");
    return response.data || [];
  } catch (error) {
    console.error("Failed to fetch week assignments:", error);
    return [];
  }
}
