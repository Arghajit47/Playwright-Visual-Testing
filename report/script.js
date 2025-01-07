const dashboard = document.getElementById("dashboard");
const folderStructureUrl = "report/folderStructure.json"; // Adjust this to your actual file path or API endpoint

window.addEventListener("load", () => {
  const loader = document.getElementById("loader");
  const content = document.getElementById("content");

  // Simulate a delay to show the loader (optional, for demo purposes)
  setTimeout(() => {
    loader.style.display = "none";
    content.style.display = "block";
  }, 1000); // Adjust the time as needed
});

// Function to fetch folder structure JSON
async function fetchFolderStructure() {
  try {
    const response = await fetch(folderStructureUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch folder structure:", error);
    return null;
  }
}

// Function to create a category with subcategories and files
function createCategory(title, subCategories, basePath) {
  const section = document.createElement("section");
  section.classList.add("category");

  const header = document.createElement("h2");
  header.textContent = title;
  section.appendChild(header);

  const subcategoryList = document.createElement("ul");

  // Loop through each subcategory in the current category
  Object.keys(subCategories).forEach((subCategory) => {
    const files = subCategories[subCategory];

    if (Array.isArray(files)) {
      // Handle subcategories with files
      const subcategory = document.createElement("li");
      subcategory.textContent = subCategory;
      subcategory.addEventListener("click", () => {
        const subcategoryFiles = subcategory.querySelector(".subcategory");
        subcategoryFiles.classList.toggle("active");
      });

      const subcategoryFiles = document.createElement("ul");
      subcategoryFiles.classList.add("subcategory");

      files.forEach((file) => {
        const listItem = document.createElement("li");
        const link = document.createElement("a");
        link.href = `${basePath}/${subCategory}/${file}`;
        link.textContent = file.split("-performance")[0];
        listItem.appendChild(link);
        subcategoryFiles.appendChild(listItem);
      });

      subcategory.appendChild(subcategoryFiles);
      subcategoryList.appendChild(subcategory);
    } else {
      // Handle direct files (when files are not in subcategories)
      const listItem = document.createElement("li");
      const link = document.createElement("a");
      link.href = `${basePath}/${subCategory}`;
      link.textContent = subCategory.split("-performance")[0];
      listItem.appendChild(link);
      subcategoryList.appendChild(listItem);
    }
  });

  section.appendChild(subcategoryList);
  return section;
}

// Render categories based on the folder structure
function renderCategories(folderStructure) {
  Object.keys(folderStructure).forEach((category) => {
    const subCategories = folderStructure[category];
    const section = createCategory(category, subCategories, category);
    dashboard.appendChild(section);
  });
}
// Function to change theme based on the selected option
function changeTheme() {
  const body = document.body;
  const themeDropdown = document.getElementById("theme-dropdown");
  const selectedTheme = themeDropdown.value;

  // Remove all existing theme classes
  body.classList.remove("light-mode", "dark-mode");

  // Add the selected theme class
  body.classList.add(`${selectedTheme}-mode`);

  // Save the user's theme preference
  localStorage.setItem("theme", selectedTheme);
}

// Load and apply the user's theme preference from localStorage
function loadThemePreference() {
  const savedTheme = localStorage.getItem("theme");
  const themeDropdown = document.getElementById("theme-dropdown");

  if (savedTheme) {
    document.body.classList.add(`${savedTheme}-mode`);
    themeDropdown.value = savedTheme; // Set the dropdown to the saved theme
  } else {
    // Default to light theme if no preference is saved
    document.body.classList.add("light-mode");
    themeDropdown.value = "light";
  }
}

// Event listener for theme dropdown change
document
  .getElementById("theme-dropdown")
  .addEventListener("change", changeTheme);

// Load theme preference when the page loads
window.addEventListener("DOMContentLoaded", loadThemePreference);

// Initialize the app
async function setupReportViewer() {
  const folderStructure = await fetchFolderStructure();
  if (!folderStructure) return;

  renderCategories(folderStructure);
}

// Call the setup function when the page loads
setupReportViewer();
