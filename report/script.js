window.addEventListener("load", () => {
  const loader = document.getElementById("loader");
  const content = document.getElementById("content");

  // Simulate a delay to show the loader (optional, for demo purposes)
  setTimeout(() => {
    loader.style.display = "none";
    content.style.display = "block";
  }, 1000); // Adjust the time as needed
});

// Function to toggle the folder structure section
function toggleReports(category, data) {
  const folderStructure = document.getElementById("folder-structure");
  const reportContainer = document.getElementById("report-container");

  // Check if the reports section is already visible and contains the current category
  if (
    folderStructure.style.display === "block" &&
    reportContainer.dataset.category === category
  ) {
    folderStructure.style.display = "none"; // Hide the section
    reportContainer.dataset.category = ""; // Reset the category
  } else {
    // Render the reports and show the section
    renderReports(category, data);
    folderStructure.style.display = "block";
    reportContainer.dataset.category = category; // Store the current category
  }
}

// Function to render folder categories dynamically
function renderCategories(folderStructure) {
  console.log("Rendering categories:", folderStructure);

  const categoriesContainer = document.getElementById("categories");
  if (!categoriesContainer) {
    console.error("Categories container not found in the DOM!");
    return;
  }

  categoriesContainer.innerHTML = ""; // Clear existing content

  Object.keys(folderStructure).forEach((category) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
          <h3>${category.replace(/-/g, " ")}</h3>
          <p>Explore detailed performance reports.</p>
          <a href="javascript:void(0);" data-category="${category}">View Reports</a>
        `;

    console.log(`Created card for category: ${category}`);

    card.querySelector("a").addEventListener("click", () => {
      console.log(`Toggling reports for category: ${category}`);
      toggleReports(category, folderStructure[category]);
    });

    categoriesContainer.appendChild(card);
  });
}

// Utility to create a list of files with nested paths
function createFileList(subfolderName, files) {
  console.log("Creating file list for:", subfolderName, files); // Debug log
  const ul = document.createElement("ul");
  console.log(files);
  Object.entries(files).forEach(([fileName, fileType]) => {
    console.log(fileType);
    if (fileType === "file") {
      const li = document.createElement("li");
      console.log("first");
      const filePath = `/${subfolderName}/${fileName}`; // Adjusted to root folder path
      li.innerHTML = `<a href="${filePath}" target="_blank">${fileName}</a>`;
      ul.appendChild(li);
    }
  });

  return ul;
}

// Utility to create subfolder content
function createSubfolders(parentFolderName, subfolders) {
  // console.log("create sub folder ", parentFolderName, subfolders);
  const div = document.createElement("div");

  Object.entries(subfolders).forEach(([folderName, folderContent]) => {
    if (typeof folderContent === "object") {
      const folderDiv = document.createElement("div");
      folderDiv.className = "subfolder";
      folderDiv.innerHTML = `<h4>${folderName}</h4>`;
      folderDiv.appendChild(
        createFileList(`${parentFolderName}/${folderName}`, folderContent)
      );
      div.appendChild(folderDiv);
    } else if (folderContent === "file") {
      const fileDiv = document.createElement("div");
      fileDiv.className = "file";
      const filePath = `/${parentFolderName}/${folderName}`;
      fileDiv.innerHTML = `<a href="${filePath}" target="_blank">${folderName}</a>`;
      div.appendChild(fileDiv);
    }
  });

  return div;
}

// Function to render reports dynamically
function renderReports(category, data) {
  const container = document.getElementById("report-container");
  container.innerHTML = `<h3>${category.replace(/-/g, " ")}</h3>`;
  container.appendChild(createSubfolders(category, data));
}

// Initialize the app
async function setupReportViewer() {
  const folderStructure = await fetchFolderStructure();
  if (!folderStructure) return;

  renderCategories(folderStructure);
}
// Function to fetch folder structure JSON
async function fetchFolderStructure() {
  try {
    const response = await fetch("report/folderStructure.json"); // Adjusted path to root folder
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch folder structure:", error);
    return null;
  }
}

// Function to toggle dark mode
async function toggleDarkMode() {
  const body = document.body;
  const toggleButton = document.getElementById("dark-mode-toggle");

  // Toggle the dark-mode class
  body.classList.toggle("dark-mode");

  // Save the user's preference
  const isDarkMode = body.classList.contains("dark-mode");
  localStorage.setItem("darkMode", isDarkMode ? "enabled" : "disabled");

  // Update the icon based on the current mode
  toggleButton.textContent = isDarkMode ? "🌞" : "🌙";
}

// Function to load the user's dark mode preference
async function loadDarkModePreference() {
  const darkMode = localStorage.getItem("darkMode");
  const toggleButton = document.getElementById("dark-mode-toggle");

  if (darkMode === "enabled") {
    document.body.classList.add("dark-mode");
    toggleButton.textContent = "🌞"; // Sun icon for dark mode
  } else {
    toggleButton.textContent = "🌙"; // Moon icon for light mode
  }
}

// Add event listener to the dark mode toggle button
document
  .getElementById("dark-mode-toggle")
  .addEventListener("click", toggleDarkMode);

// Load dark mode preference on page load
window.addEventListener("DOMContentLoaded", loadDarkModePreference);

setupReportViewer();
