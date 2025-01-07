
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


let currentPage = 1;
let totalMonsters = 0;
let allMonsters = [];
let monstersPerPage = 10;


const cache = new Map();


if (themeToggle) {
  
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    document.body.dataset.theme = savedTheme;
  }

  themeToggle.addEventListener('click', () => {
    const newTheme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
    document.body.dataset.theme = newTheme;
    localStorage.setItem('theme', newTheme); 
  });
}


async function fetchMonsters(query) {
  try {
    loadingSpinner.classList.remove('hidden'); 

   
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

    
    cache.set(query, allMonsters);

    
    const filteredMonsters = allMonsters.filter(monster =>
      monster.name.toLowerCase().includes(query.toLowerCase())
    );

    displayResults(filteredMonsters);
    updatePagination(filteredMonsters.length);
  } catch (error) {
    console.error(error);
    resultsDiv.innerHTML = `<p class="error-message">Error: ${error.message}</p>`;
    paginationDiv.innerHTML = ''; 
  } finally {
    loadingSpinner.classList.add('hidden'); 
  }
}


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

    
    const expandButton = monsterCard.querySelector('.expand-button');
    const monsterStats = monsterCard.querySelector('.monster-stats');
    expandButton.addEventListener('click', () => {
      monsterStats.style.display = monsterStats.style.display === 'block' ? 'none' : 'block';
      expandButton.textContent = monsterStats.style.display === 'block' ? 'Collapse Stats' : 'Expand Stats';
    });
  });
}


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


function updatePagination(totalFilteredMonsters) {
  const totalPages = Math.ceil(totalFilteredMonsters / monstersPerPage);

  prevButton.disabled = currentPage === 1;
  nextButton.disabled = currentPage === totalPages;

  
  jumpToPageInput.value = currentPage;
  jumpToPageInput.max = totalPages;
}


if (monsterNamesList) {
  fetchFullMonsterList();
}

async function fetchFullMonsterList() {
  try {
    loadingSpinner.classList.remove('hidden'); 
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
    loadingSpinner.classList.add('hidden'); 
  }
}


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


function displayMonsterDetails(listItem, monsterDetails) {
  
  const existingDetails = listItem.nextElementSibling;
  if (existingDetails && existingDetails.classList.contains('monster-details')) {
    existingDetails.remove();
    return;
  }

 
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


if (searchButton) {
  searchButton.addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (query) {
      currentPage = 1; 
      fetchMonsters(query);
    }
  });
}

if (searchInput) {
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const query = searchInput.value.trim();
      if (query) {
        currentPage = 1; 
        fetchMonsters(query);
      }
    }
  });
}

if (clearButton) {
  clearButton.addEventListener('click', () => {
    searchInput.value = ''; 
    resultsDiv.innerHTML = ''; 
    paginationDiv.innerHTML = ''; 
  });
}

if (perPageSelect) {
  perPageSelect.addEventListener('change', () => {
    monstersPerPage = parseInt(perPageSelect.value, 10);
    currentPage = 1; 
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
      jumpToPageInput.value = currentPage; 
    }
  });
}

function applySavedTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      document.body.dataset.theme = savedTheme;
    }
  }
  
  
  applySavedTheme();

 
function playClickSound() {
  const clickSound = document.getElementById('click-sound');
  clickSound.currentTime = 0; 
  clickSound.play();
}


document.querySelectorAll('button, a').forEach((element) => {
  element.addEventListener('click', (event) => {
    playClickSound();

    
    if (element.tagName === 'A') {
      event.preventDefault(); 
      setTimeout(() => {
        window.location.href = element.href; 
      }, 200); 
    }
  });
});


