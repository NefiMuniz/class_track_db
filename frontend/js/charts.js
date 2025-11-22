let completionChart = null;

/**
 * Initialize completion chart
 */
function initializeChart() {
  const ctx = document.getElementById("completion-chart");
  if (!ctx) return;

  completionChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Completed", "Incomplete", "Overdue"],
      datasets: [
        {
          data: [0, 0, 0],
          backgroundColor: [
            "#28A745", // Green for completed
            "#6C757D", // Gray for incomplete
            "#DC3545", // Red for overdue
          ],
          borderWidth: 2,
          borderColor: "#FFFFFF",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            padding: 15,
            font: {
              size: 12,
              weight: "600",
            },
            color: "#212529",
          },
        },
        tooltip: {
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          padding: 12,
          titleFont: {
            size: 14,
            weight: "600",
          },
          bodyFont: {
            size: 13,
          },
          callbacks: {
            label: function (context) {
              const label = context.label || "";
              const value = context.parsed || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage =
                total > 0 ? Math.round((value / total) * 100) : 0;
              return `${label}: ${value} (${percentage}%)`;
            },
          },
        },
      },
    },
  });
}

/**
 * Update chart with new statistics
 * @param {object} stats - Statistics object
 */
function updateChart(stats) {
  if (!completionChart) {
    initializeChart();
  }

  if (completionChart) {
    const incomplete = stats.total - stats.completed - stats.overdue;

    completionChart.data.datasets[0].data = [
      stats.completed,
      incomplete > 0 ? incomplete : 0,
      stats.overdue,
    ];

    completionChart.update();
  }
}

/**
 * Destroy and recreate chart
 */
function resetChart() {
  if (completionChart) {
    completionChart.destroy();
    completionChart = null;
  }
  initializeChart();
}

// Initialize chart when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeChart);
} else {
  initializeChart();
}
