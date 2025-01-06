// DOM Elements (Shared for both pages)
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const clearButton = document.getElementById('clear-button');
const fullListButton = document.getElementById('full-list-button');
const resultsDiv = document.getElementById('results');
const fullListDiv = document.getElementById('full-list');
const monsterNamesList = document.getElementById('monster-names');
const loadingSpinner = document.getElementById('loading-spinner');
const themeToggle = document.getElementById('theme-toggle');
const paginationDiv = document.getElementById('pagination');
const perPageSelect = document.getElementById('per-page-select');
const prevButton = document.getElementById('prev-button');
const nextButton = document.getElementById('next-button');
const jumpToPageInput = document.getElementById('jump-to-page');

// Constants
let currentPage = 1;
let totalMonsters = 0;
let allMonsters = [];
let monstersPerPage = 10;

// Cache for API responses
const cache = new Map();

// Theme Toggle
if (themeToggle) {
  // Load saved theme from localStorage
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    document.body.dataset.theme = savedTheme;
  }

  themeToggle.addEventListener('click', () => {
    const newTheme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
    document.body.dataset.theme = newTheme;
    localStorage.setItem('theme', newTheme); // Save theme to localStorage
  });
}

// Fetch Monster Data (Home Page)
async function fetchMonsters(query) {
  try {
    loadingSpinner.classList.remove('hidden'); // Show loading spinner

    // Check cache first
    if (cache.has(query)) {
      allMonsters = cache.get(query);
      totalMonsters = allMonsters.length;
      displayResults(allMonsters);
      updatePagination(allMonsters.length);
      return;
    }

    const response = await fetch(`https://www.dnd5eapi.co/api/monsters`);
    if (!response.ok) {
      throw new Error('Failed to fetch monsters');
    }
    const data = await response.json();
    allMonsters = data.results;
    totalMonsters = allMonsters.length;

    // Cache the results
    cache.set(query, allMonsters);

    // Filter monsters based on search query
    const filteredMonsters = allMonsters.filter(monster =>
      monster.name.toLowerCase().includes(query.toLowerCase())
    );

    displayResults(filteredMonsters);
    updatePagination(filteredMonsters.length);
  } catch (error) {
    console.error(error);
    resultsDiv.innerHTML = `<p class="error-message">Error: ${error.message}</p>`;
    paginationDiv.innerHTML = ''; // Clear pagination on error
  } finally {
    loadingSpinner.classList.add('hidden'); // Hide loading spinner
  }
}

// Display Results (Home Page)
function displayResults(monsters) {
  resultsDiv.innerHTML = '';
  if (monsters.length === 0) {
    resultsDiv.innerHTML = '<p>No monsters found.</p>';
    return;
  }

  const start = (currentPage - 1) * monstersPerPage;
  const end = start + monstersPerPage;
  const paginatedMonsters = monsters.slice(start, end);

  paginatedMonsters.forEach(async (monster) => {
    const monsterDetails = await fetchMonsterDetails(monster.url);
    const monsterCard = document.createElement('div');
    monsterCard.classList.add('monster-card');

    // Fetch monster image (if available)
    const monsterImage = monsterDetails.image ? `<img src="https://www.dnd5eapi.co${monsterDetails.image}" alt="${monster.name}">` : '';

    monsterCard.innerHTML = `
      ${monsterImage}
      <h2>${monster.name}</h2>
      <p><strong>Type:</strong> ${monsterDetails.type}</p>
      <p><strong>Challenge Rating:</strong> ${monsterDetails.challenge_rating}</p>
      <p><strong>Hit Points:</strong> ${monsterDetails.hit_points}</p>
      <button class="expand-button">Expand Stats</button>
      <div class="monster-stats">
        <p><strong>Size:</strong> ${monsterDetails.size}</p>
        <p><strong>Alignment:</strong> ${monsterDetails.alignment}</p>
        <p><strong>Speed:</strong> ${monsterDetails.speed.walk} ft (walk)</p>
        <p><strong>Strength:</strong> ${monsterDetails.strength}</p>
        <p><strong>Dexterity:</strong> ${monsterDetails.dexterity}</p>
        <p><strong>Constitution:</strong> ${monsterDetails.constitution}</p>
        <p><strong>Intelligence:</strong> ${monsterDetails.intelligence}</p>
        <p><strong>Wisdom:</strong> ${monsterDetails.wisdom}</p>
        <p><strong>Charisma:</strong> ${monsterDetails.charisma}</p>
      </div>
    `;
    resultsDiv.appendChild(monsterCard);

    // Add event listener to the expand button
    const expandButton = monsterCard.querySelector('.expand-button');
    const monsterStats = monsterCard.querySelector('.monster-stats');
    expandButton.addEventListener('click', () => {
      monsterStats.style.display = monsterStats.style.display === 'block' ? 'none' : 'block';
      expandButton.textContent = monsterStats.style.display === 'block' ? 'Collapse Stats' : 'Expand Stats';
    });
  });
}

// Fetch Monster Details
async function fetchMonsterDetails(url) {
  try {
    const response = await fetch(`https://www.dnd5eapi.co${url}`);
    if (!response.ok) {
      throw new Error('Failed to fetch monster details');
    }
    return await response.json();
  } catch (error) {
    console.error(error);
    return { type: 'Unknown', challenge_rating: 'Unknown', hit_points: 'Unknown' };
  }
}

// Update Pagination (Home Page)
function updatePagination(totalFilteredMonsters) {
  const totalPages = Math.ceil(totalFilteredMonsters / monstersPerPage);

  prevButton.disabled = currentPage === 1;
  nextButton.disabled = currentPage === totalPages;

  // Jump to Page input
  jumpToPageInput.value = currentPage;
  jumpToPageInput.max = totalPages;
}

// Fetch Full Monster List (Full List Page)
if (monsterNamesList) {
  fetchFullMonsterList();
}

async function fetchFullMonsterList() {
  try {
    loadingSpinner.classList.remove('hidden'); // Show loading spinner
    const response = await fetch(`https://www.dnd5eapi.co/api/monsters`);
    if (!response.ok) {
      throw new Error('Failed to fetch full monster list');
    }
    const data = await response.json();
    displayFullMonsterList(data.results);
  } catch (error) {
    console.error(error);
    monsterNamesList.innerHTML = `<p class="error-message">Error: ${error.message}</p>`;
  } finally {
    loadingSpinner.classList.add('hidden'); // Hide loading spinner
  }
}

// Display Full Monster List (Full List Page)
function displayFullMonsterList(monsters) {
  monsterNamesList.innerHTML = '';
  monsters.forEach((monster) => {
    const listItem = document.createElement('li');
    listItem.textContent = monster.name;
    listItem.addEventListener('click', async () => {
      const monsterDetails = await fetchMonsterDetails(monster.url);
      displayMonsterDetails(listItem, monsterDetails);
    });
    monsterNamesList.appendChild(listItem);
  });
}

// Display Monster Details (Full List Page)
function displayMonsterDetails(listItem, monsterDetails) {
  // Remove any existing details
  const existingDetails = listItem.nextElementSibling;
  if (existingDetails && existingDetails.classList.contains('monster-details')) {
    existingDetails.remove();
    return;
  }

  // Create and append new details
  const detailsDiv = document.createElement('div');
  detailsDiv.classList.add('monster-details');
  detailsDiv.innerHTML = `
    <p><strong>Type:</strong> ${monsterDetails.type}</p>
    <p><strong>Challenge Rating:</strong> ${monsterDetails.challenge_rating}</p>
    <p><strong>Hit Points:</strong> ${monsterDetails.hit_points}</p>
    <p><strong>Size:</strong> ${monsterDetails.size}</p>
    <p><strong>Alignment:</strong> ${monsterDetails.alignment}</p>
    <p><strong>Speed:</strong> ${monsterDetails.speed.walk} ft (walk)</p>
    <p><strong>Strength:</strong> ${monsterDetails.strength}</p>
    <p><strong>Dexterity:</strong> ${monsterDetails.dexterity}</p>
    <p><strong>Constitution:</strong> ${monsterDetails.constitution}</p>
    <p><strong>Intelligence:</strong> ${monsterDetails.intelligence}</p>
    <p><strong>Wisdom:</strong> ${monsterDetails.wisdom}</p>
    <p><strong>Charisma:</strong> ${monsterDetails.charisma}</p>
  `;
  listItem.insertAdjacentElement('afterend', detailsDiv);
}

// Event Listeners (Home Page)
if (searchButton) {
  searchButton.addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (query) {
      currentPage = 1; // Reset to first page on new search
      fetchMonsters(query);
    }
  });
}

if (searchInput) {
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const query = searchInput.value.trim();
      if (query) {
        currentPage = 1; // Reset to first page on new search
        fetchMonsters(query);
      }
    }
  });
}

if (clearButton) {
  clearButton.addEventListener('click', () => {
    searchInput.value = ''; // Clear search input
    resultsDiv.innerHTML = ''; // Clear results
    paginationDiv.innerHTML = ''; // Clear pagination
  });
}

if (perPageSelect) {
  perPageSelect.addEventListener('change', () => {
    monstersPerPage = parseInt(perPageSelect.value, 10);
    currentPage = 1; // Reset to first page when changing monsters per page
    if (searchInput.value.trim()) {
      fetchMonsters(searchInput.value.trim());
    }
  });
}

if (prevButton) {
  prevButton.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      displayResults(allMonsters);
      updatePagination(allMonsters.length);
    }
  });
}

if (nextButton) {
  nextButton.addEventListener('click', () => {
    const totalPages = Math.ceil(allMonsters.length / monstersPerPage);
    if (currentPage < totalPages) {
      currentPage++;
      displayResults(allMonsters);
      updatePagination(allMonsters.length);
    }
  });
}

if (jumpToPageInput) {
  jumpToPageInput.addEventListener('change', () => {
    const page = parseInt(jumpToPageInput.value, 10);
    const totalPages = Math.ceil(allMonsters.length / monstersPerPage);

    if (page >= 1 && page <= totalPages) {
      currentPage = page;
      displayResults(allMonsters);
      updatePagination(allMonsters.length);
    } else {
      jumpToPageInput.value = currentPage; // Reset to current page if input is invalid
    }
  });
}
// Apply saved theme on page load
function applySavedTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      document.body.dataset.theme = savedTheme;
    }
  }
  
  // Call this function on both pages
  applySavedTheme();
  