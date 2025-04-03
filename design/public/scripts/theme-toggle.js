// Initialize theme based on local storage or system preference
const userTheme = localStorage.getItem("theme");
const systemDarkMode = window.matchMedia("(prefers-color-scheme: dark)");

// Function to update the theme
function updateTheme(isDark) {
  document.documentElement.classList.toggle("dark", isDark);
}

// Set the initial theme
if (userTheme === "dark") {
  updateTheme(true);
} else if (userTheme === "light") {
  updateTheme(false);
} else {
  // If no preference is stored, use system preference
  updateTheme(systemDarkMode.matches);
}

// Watch for system preference changes if no user preference is set
systemDarkMode.addEventListener("change", (e) => {
  if (!localStorage.getItem("theme")) {
    updateTheme(e.matches);
  }
});

// Theme toggle functionality will be initialized after DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  const themeToggle = document.getElementById("theme-toggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      // Check current theme
      const isDark = document.documentElement.classList.contains("dark");

      // Toggle theme
      updateTheme(!isDark);

      // Save preference to local storage
      localStorage.setItem("theme", !isDark ? "dark" : "light");
    });
  }
});
