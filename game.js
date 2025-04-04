// HarmonyNation - A nation-building strategy game
// A game about balancing resources and maintaining harmony

// Core game variables
let gameState = {
  dailyTasks: {
    required: 4,
    completed: 0,
    storyProgress: 0,
    levelModifier: 1, // Added level modifier
    storyTasks: [
      // Initial crisis
      ['Survey food resources', 'Meet with advisors', 'Review resource maps', 'Plan emergency measures'],
      // Building solutions
      ['Evaluate field conditions', 'Gather advisor proposals', 'Draft recovery plan', 'Rally public support'],
      // Implementation
      ['Mobilize work forces', 'Distribute resources', 'Coordinate village efforts', 'Monitor progress'],
      // Storm crisis
      ['Assess storm damage', 'Organize relief efforts', 'Rebuild infrastructure', 'Maintain public morale'],
      // Recovery
      ['Restore damaged fields', 'Strengthen defenses', 'Unite communities', 'Plan for future']
    ],
    tasks: ['Survey food resources', 'Meet with advisors', 'Review resource maps', 'Plan emergency measures']
  },
  resources: {
    food: 50,
    wealth: 100,
    materials: 75,
    technology: 10
  },
  metrics: {
    harmony: 50, // 0-100 scale, below 25 is critical
    infrastructure: 10,
    agriculture: 10,
    education: 10,
    healthcare: 10,
    diplomacy: 10
  },
  groups: {
    farmers: { satisfaction: 50, influence: 1 },
    workers: { satisfaction: 50, influence: 1 },
    merchants: { satisfaction: 50, influence: 1 },
    scholars: { satisfaction: 50, influence: 0.5 }
  },
  level: 1,
  // Using wealth instead of separate coins
  day: 1,
  events: [],
  activeEvent: null,
  gameOver: false,
  paused: false
};

// Constants
const HARMONY_CRITICAL = 25;
const DAYS_PER_LEVEL = 30;
const MAX_RESOURCES = 1000;

// DOM Elements
let elements = {};

import { sprites, Cloud, ResourceIcon } from './sprites.js';

// Game animation state
const gameAnimations = {
  clouds: [],
  resourceIcons: {},
  background: new Image(),
  city: new Image(),
  backgroundIndex: 0,
  cityIndex: 0
};

// Load game assets and initialize animations
function loadGameAssets() {
  return new Promise((resolve, reject) => {
    let loadedImages = 0;
    const totalImages = 2; // background and city

    function checkAllLoaded() {
      loadedImages++;
      if (loadedImages === totalImages) {
        initializeGameSprites();
        resolve();
      }
    }

    // Load background and city with handlers
    gameAnimations.background = new Image();
    gameAnimations.background.onload = checkAllLoaded;
    gameAnimations.background.onerror = reject;
    gameAnimations.background.src = sprites.backgrounds[0].src;

    gameAnimations.city = new Image();
    gameAnimations.city.onload = checkAllLoaded;
    gameAnimations.city.onerror = reject;
    gameAnimations.city.src = sprites.buildings[0].src;
  });
}

function initializeGameSprites() {
  // Create clouds
  for (let i = 0; i < 3; i++) {
    const cloudSprite = sprites.clouds[Math.floor(Math.random() * sprites.clouds.length)];
    const x = Math.random() * window.innerWidth;
    const y = Math.random() * (window.innerHeight * 0.2);
    gameAnimations.clouds.push(new Cloud(x, y, cloudSprite));
  }

  // Create resource icons
  Object.entries(sprites.resources).forEach(([resource, sprite], index) => {
    const x = (window.innerWidth / 5) * (index + 1);
    const y = 20;
    gameAnimations.resourceIcons[resource] = new ResourceIcon(x, y, sprite);
  });
}

// Initialize the game
async function initGame() {
  try {
    createGameInterface();
    await loadGameAssets();
    setupCanvas();
    updateDisplay();
    startGameLoop();
    showIntroduction();
  } catch (error) {
    console.error('Failed to load game assets:', error);
  }
}

// Setup canvas
function setupCanvas() {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  // Make canvas responsive
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight * 0.3; // Take 30% of viewport height
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // Animation loop
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background with parallax effect
    ctx.drawImage(gameAnimations.background, 0, 0, canvas.width, canvas.height);

    // Update and draw clouds
    gameAnimations.clouds.forEach(cloud => {
      cloud.update(canvas);
      cloud.draw(ctx);
    });

    // Draw city with scaling
    const cityHeight = canvas.height * 0.8;
    const cityWidth = cityHeight * (gameAnimations.city.width / gameAnimations.city.height);
    const cityX = (canvas.width - cityWidth) / 2;
    const cityY = canvas.height - cityHeight;

    ctx.drawImage(gameAnimations.city, cityX, cityY, cityWidth, cityHeight);

    // Update and draw resource icons with animations
    Object.entries(gameAnimations.resourceIcons).forEach(([resource, icon], index) => {
      icon.update();
      icon.draw(ctx);

      // Draw resource values
      ctx.font = '16px Arial';
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.fillText(Math.round(gameState.resources[resource]),
                  icon.x + icon.sprite.width/2,
                  icon.y + icon.sprite.height + 20);
    });

    requestAnimationFrame(animate);
  }

  animate();
}

// Create game interface
function createGameInterface() {
  const gameContainer = document.createElement('div');
  gameContainer.className = 'game-container';

  // Header
  const header = document.createElement('div');
  header.className = 'header';
  header.innerHTML = `
    <h1>HarmonyNation</h1>
    <div class="level-info">
      <span>Level: <span id="level">1</span></span>
      <span>Wealth: <span id="wealth">0</span></span>
      <span>Day: <span id="day">1</span>/<span id="days-per-level">${DAYS_PER_LEVEL}</span></span>
    </div>
  `;
  gameContainer.appendChild(header);

  // Main game area
  const gameArea = document.createElement('div');
  gameArea.className = 'game-area';

  // Resources panel
  const resourcesPanel = document.createElement('div');
  resourcesPanel.className = 'panel resources-panel';
  resourcesPanel.innerHTML = `
    <h2>Resources</h2>
    <div class="resource-bar">
      <label>Food:</label>
      <div class="progress-container">
        <div id="food-bar" class="progress-bar"></div>
      </div>
      <span id="food-value">0</span>
    </div>
    <div class="resource-bar">
      <label>Wealth:</label>
      <div class="progress-container">
        <div id="wealth-bar" class="progress-bar"></div>
      </div>
      <span id="wealth-value">0</span>
    </div>
    <div class="resource-bar">
      <label>Materials:</label>
      <div class="progress-container">
        <div id="materials-bar" class="progress-bar"></div>
      </div>
      <span id="materials-value">0</span>
    </div>
    <div class="resource-bar">
      <label>Technology:</label>
      <div class="progress-container">
        <div id="technology-bar" class="progress-bar"></div>
      </div>
      <span id="technology-value">0</span>
    </div>
  `;
  gameArea.appendChild(resourcesPanel);

  // Metrics panel
  const metricsPanel = document.createElement('div');
  metricsPanel.className = 'panel metrics-panel';
  metricsPanel.innerHTML = `
    <h2>Nation Metrics</h2>
    <div class="metric-bar critical">
      <label>Harmony:</label>
      <div class="progress-container">
        <div id="harmony-bar" class="progress-bar"></div>
      </div>
      <span id="harmony-value">0</span>
    </div>
    <div class="metric-bar">
      <label>Infrastructure:</label>
      <div class="progress-container">
        <div id="infrastructure-bar" class="progress-bar"></div>
      </div>
      <span id="infrastructure-value">0</span>
    </div>
    <div class="metric-bar">
      <label>Agriculture:</label>
      <div class="progress-container">
        <div id="agriculture-bar" class="progress-bar"></div>
      </div>
      <span id="agriculture-value">0</span>
    </div>
    <div class="metric-bar">
      <label>Education:</label>
      <div class="progress-container">
        <div id="education-bar" class="progress-bar"></div>
      </div>
      <span id="education-value">0</span>
    </div>
    <div class="metric-bar">
      <label>Healthcare:</label>
      <div class="progress-container">
        <div id="healthcare-bar" class="progress-bar"></div>
      </div>
      <span id="healthcare-value">0</span>
    </div>
    <div class="metric-bar">
      <label>Diplomacy:</label>
      <div class="progress-container">
        <div id="diplomacy-bar" class="progress-bar"></div>
      </div>
      <span id="diplomacy-value">0</span>
    </div>
  `;
  gameArea.appendChild(metricsPanel);

  // Group satisfaction panel
  const groupsPanel = document.createElement('div');
  groupsPanel.className = 'panel groups-panel';
  groupsPanel.innerHTML = `
    <h2>Population Groups</h2>
    <div class="group-bar">
      <label>Farmers:</label>
      <div class="progress-container">
        <div id="farmers-bar" class="progress-bar"></div>
      </div>
      <span id="farmers-value">0</span>
    </div>
    <div class="group-bar">
      <label>Workers:</label>
      <div class="progress-container">
        <div id="workers-bar" class="progress-bar"></div>
      </div>
      <span id="workers-value">0</span>
    </div>
    <div class="group-bar">
      <label>Merchants:</label>
      <div class="progress-container">
        <div id="merchants-bar" class="progress-bar"></div>
      </div>
      <span id="merchants-value">0</span>
    </div>
    <div class="group-bar">
      <label>Scholars:</label>
      <div class="progress-container">
        <div id="scholars-bar" class="progress-bar"></div>
      </div>
      <span id="scholars-value">0</span>
    </div>
  `;
  gameArea.appendChild(groupsPanel);

  // Event display
  const eventDisplay = document.createElement('div');
  eventDisplay.className = 'panel event-display';
  eventDisplay.innerHTML = `
    <h2>Current Event</h2>
    <div id="event-content" class="event-content">
      <p>No active events</p>
    </div>
    <div id="event-choices" class="event-choices"></div>
  `;
  gameArea.appendChild(eventDisplay);

  // Task tracking panel
  const taskPanel = document.createElement('div');
  taskPanel.className = 'panel task-panel';
  taskPanel.innerHTML = `
    <h2>Daily Tasks</h2>
    <div id="task-list" class="task-list">
      <p>Complete these tasks to advance:</p>
      <ul></ul>
    </div>
    <div class="task-progress">
      <p>Progress: <span id="task-progress">0/0</span></p>
    </div>
  `;
  gameArea.appendChild(taskPanel);

  // Actions panel
  const actionsPanel = document.createElement('div');
  actionsPanel.className = 'panel actions-panel';
  actionsPanel.innerHTML = `
    <h2>Actions</h2>
    <div class="action-buttons">
      <button id="invest-agriculture">Invest in Agriculture (15 wealth)</button>
      <button id="invest-infrastructure">Invest in Infrastructure (15 wealth)</button>
      <button id="invest-education">Invest in Education (15 wealth)</button>
      <button id="invest-healthcare">Invest in Healthcare (15 wealth)</button>
      <button id="invest-diplomacy">Invest in Diplomacy (15 wealth)</button>
      <button id="distribute-food">Distribute Food (10 units)</button>
      <button id="trade">Trade Resources</button>
    </div>
  `;
  gameArea.appendChild(actionsPanel);

  // Add game area to container
  gameContainer.appendChild(gameArea);

  // Status bar
  const statusBar = document.createElement('div');
  statusBar.className = 'status-bar';
  statusBar.innerHTML = `
    <div id="status-message">Welcome to HarmonyNation</div>
    <button id="next-day">Next Day</button>
  `;
  gameContainer.appendChild(statusBar);

  // Append to document
  document.body.appendChild(gameContainer);

  // Store references to elements
  storeElementReferences();

  // Add event listeners
  addEventListeners();

  // Add game styles
  addGameStyles();
}

// Store references to DOM elements
function storeElementReferences() {
  elements = {
    level: document.getElementById('level'),
    wealth: document.getElementById('wealth'),
    day: document.getElementById('day'),
    food: {
      bar: document.getElementById('food-bar'),
      value: document.getElementById('food-value')
    },
    wealth: {
      bar: document.getElementById('wealth-bar'),
      value: document.getElementById('wealth-value')
    },
    materials: {
      bar: document.getElementById('materials-bar'),
      value: document.getElementById('materials-value')
    },
    technology: {
      bar: document.getElementById('technology-bar'),
      value: document.getElementById('technology-value')
    },
    harmony: {
      bar: document.getElementById('harmony-bar'),
      value: document.getElementById('harmony-value')
    },
    infrastructure: {
      bar: document.getElementById('infrastructure-bar'),
      value: document.getElementById('infrastructure-value')
    },
    agriculture: {
      bar: document.getElementById('agriculture-bar'),
      value: document.getElementById('agriculture-value')
    },
    education: {
      bar: document.getElementById('education-bar'),
      value: document.getElementById('education-value')
    },
    healthcare: {
      bar: document.getElementById('healthcare-bar'),
      value: document.getElementById('healthcare-value')
    },
    diplomacy: {
      bar: document.getElementById('diplomacy-bar'),
      value: document.getElementById('diplomacy-value')
    },
    farmers: {
      bar: document.getElementById('farmers-bar'),
      value: document.getElementById('farmers-value')
    },
    workers: {
      bar: document.getElementById('workers-bar'),
      value: document.getElementById('workers-value')
    },
    merchants: {
      bar: document.getElementById('merchants-bar'),
      value: document.getElementById('merchants-value')
    },
    scholars: {
      bar: document.getElementById('scholars-bar'),
      value: document.getElementById('scholars-value')
    },
    eventContent: document.getElementById('event-content'),
    eventChoices: document.getElementById('event-choices'),
    statusMessage: document.getElementById('status-message'),
    nextDayButton: document.getElementById('next-day'),
    investAgriculture: document.getElementById('invest-agriculture'),
    investInfrastructure: document.getElementById('invest-infrastructure'),
    investEducation: document.getElementById('invest-education'),
    investHealthcare: document.getElementById('invest-healthcare'),
    investDiplomacy: document.getElementById('invest-diplomacy'),
    distributeFood: document.getElementById('distribute-food'),
    trade: document.getElementById('trade')
  };
}

// Add event listeners to interactive elements
function addEventListeners() {
  elements.nextDayButton.addEventListener('click', advanceDay);
  elements.investAgriculture.addEventListener('click', () => investInSector('agriculture'));
  elements.investInfrastructure.addEventListener('click', () => investInSector('infrastructure'));
  elements.investEducation.addEventListener('click', () => investInSector('education'));
  elements.investHealthcare.addEventListener('click', () => investInSector('healthcare'));
  elements.investDiplomacy.addEventListener('click', () => investInSector('diplomacy'));
  elements.distributeFood.addEventListener('click', distributeFood);
  elements.trade.addEventListener('click', openTradeDialog);
}

// Add game styles
function addGameStyles() {
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    * {
      box-sizing: border-box;
      font-family: 'Arial', sans-serif;
    }

    body {
      margin: 0;
      padding: 20px;
      background-color: #f0f0f0;
    }

    .game-container {
      max-width: 1200px;
      margin: 0 auto;
      background-color: #fff;
      border-radius: 10px;
      box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .header {
      background-color: #3a7ca5;
      color: white;
      padding: 20px;
      text-align: center;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header h1 {
      margin: 0;
      flex-grow: 1;
    }

    .level-info {
      display: flex;
      gap: 20px;
    }

    .game-area {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      grid-template-rows: repeat(3, auto);
      gap: 20px;
      padding: 20px;
    }

    .panel {
      background-color: #f9f9f9;
      border-radius: 5px;
      padding: 15px;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
    }

    .panel h2 {
      margin-top: 0;
      color: #3a7ca5;
      border-bottom: 1px solid #ddd;
      padding-bottom: 10px;
      margin-bottom: 15px;
    }

    .resource-bar, .metric-bar, .group-bar {
      display: flex;
      align-items: center;
      margin-bottom: 10px;
    }

    .resource-bar label, .metric-bar label, .group-bar label {
      width: 100px;
      font-weight: bold;
    }

    .progress-container {
      flex-grow: 1;
      height: 15px;
      background-color: #e0e0e0;
      border-radius: 10px;
      overflow: hidden;
      margin: 0 10px;
    }

    .progress-bar {
      height: 100%;
      width: 0%;
      border-radius: 10px;
      transition: width 0.3s, background-color 0.3s;
    }

    #food-bar { background-color: #4caf50; }
    #wealth-bar { background-color: #ffc107; }
    #materials-bar { background-color: #795548; }
    #technology-bar { background-color: #2196f3; }
    #harmony-bar { background-color: #9c27b0; }
    #infrastructure-bar { background-color: #607d8b; }
    #agriculture-bar { background-color: #8bc34a; }
    #education-bar { background-color: #3f51b5; }
    #healthcare-bar { background-color: #e91e63; }
    #diplomacy-bar { background-color: #00bcd4; }

    .group-bar .progress-bar {
      background-color: #ff9800;
    }

    .task-panel {
      grid-column: span 1;
    }

    .task-list ul {
      list-style-type: none;
      padding: 0;
    }

    .task-list li {
      padding: 8px;
      margin: 5px 0;
      background: #f5f5f5;
      border-radius: 4px;
      border-left: 3px solid #3a7ca5;
    }

    .task-progress {
      margin-top: 15px;
      font-weight: bold;
    }

    .action-buttons {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    button {
      background-color: #3a7ca5;
      color: white;
      border: none;
      padding: 10px 15px;
      border-radius: 5px;
      cursor: pointer;
      transition: background-color 0.3s;
    }

    button:hover {
      background-color: #2c6083;
    }

    button:disabled {
      background-color: #cccccc;
      cursor: not-allowed;
    }

    .status-bar {
      background-color: #f5f5f5;
      padding: 15px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid #ddd;
    }

    .event-content {
      min-height: 100px;
      margin-bottom: 15px;
    }

    .event-choices {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }

    .modal-content {
      background-color: white;
      padding: 20px;
      border-radius: 5px;
      max-width: 500px;
      width: 90%;
    }

    .modal-buttons {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 20px;
    }

    .critical .progress-bar {
      background-color: #f44336;
    }

    .storyline-progress {
      border-top: 1px solid #ddd;
      padding-top: 15px;
      margin-top: 15px;
    }

    @media (max-width: 768px) {
      .game-area {
        grid-template-columns: 1fr;
      }

      .action-buttons {
        grid-template-columns: 1fr;
      }
    }
  `;
  document.head.appendChild(styleElement);
}

// Update display based on game state
function updateDisplay() {
  // Update basic info
  elements.level.textContent = gameState.level;
  elements.wealth.textContent = gameState.wealth;
  elements.day.textContent = gameState.day;

  // Show/hide next day button based on tasks completion
  elements.nextDayButton.style.display =
    gameState.dailyTasks.completed >= gameState.dailyTasks.required ? 'block' : 'none';

  // Update resources
  updateProgressBar('food', gameState.resources.food);
  updateProgressBar('wealth', gameState.resources.wealth);
  updateProgressBar('materials', gameState.resources.materials);
  updateProgressBar('technology', gameState.resources.technology);

  // Update metrics
  updateProgressBar('harmony', gameState.metrics.harmony);
  updateProgressBar('infrastructure', gameState.metrics.infrastructure);
  updateProgressBar('agriculture', gameState.metrics.agriculture);
  updateProgressBar('education', gameState.metrics.education);
  updateProgressBar('healthcare', gameState.metrics.healthcare);
  updateProgressBar('diplomacy', gameState.metrics.diplomacy);

  // Update groups
  updateProgressBar('farmers', gameState.groups.farmers.satisfaction);
  updateProgressBar('workers', gameState.groups.workers.satisfaction);
  updateProgressBar('merchants', gameState.groups.merchants.satisfaction);
  updateProgressBar('scholars', gameState.groups.scholars.satisfaction);

  // Update critical status
  if (gameState.metrics.harmony < HARMONY_CRITICAL) {
    elements.harmony.bar.parentElement.parentElement.classList.add('critical');
    elements.statusMessage.textContent = "WARNING: Harmony levels critical!";
    elements.statusMessage.style.color = "#f44336";
  } else {
    elements.harmony.bar.parentElement.parentElement.classList.remove('critical');
    elements.statusMessage.textContent = "Nation is stable";
    elements.statusMessage.style.color = "";
  }

  // Update buttons based on available wealth
  updateActionButtons();
  
  // Update task list
  const taskList = document.querySelector('#task-list ul');
  const taskProgress = document.getElementById('task-progress');
  if (taskList && taskProgress) {
    taskList.innerHTML = gameState.dailyTasks.tasks.map(task => 
      `<li>${task}</li>`
    ).join('');
    taskProgress.textContent = `${gameState.dailyTasks.completed}/${gameState.dailyTasks.required + ((gameState.level - 1) * gameState.dailyTasks.levelModifier)}`;
  }
}

// Update a single progress bar
function updateProgressBar(id, value) {
  const percentage = Math.min(Math.max(value, 0), 100);
  elements[id].bar.style.width = `${percentage}%`;
  elements[id].value.textContent = Math.round(value);
}

// Update action buttons based on available wealth
function updateActionButtons() {
  elements.investAgriculture.disabled = gameState.wealth < 15;
  elements.investInfrastructure.disabled = gameState.wealth < 15;
  elements.investEducation.disabled = gameState.wealth < 15;
  elements.investHealthcare.disabled = gameState.wealth < 15;
  elements.investDiplomacy.disabled = gameState.wealth < 15;
  elements.distributeFood.disabled = gameState.resources.food < 10;
}

// Start the game loop
function startGameLoop() {
  // Generate initial events
  queueRandomEvent();
}

// Advance to the next day
function advanceDay() {
  if (gameState.gameOver || gameState.paused) return;

  // Calculate required tasks based on level
  const requiredTasks = gameState.dailyTasks.required + ((gameState.level - 1) * gameState.dailyTasks.levelModifier);

  if (gameState.dailyTasks.completed < requiredTasks) {
    elements.statusMessage.textContent = `Complete ${requiredTasks - gameState.dailyTasks.completed} more tasks to advance!`;
    return;
  }

  // Progress story based on completed tasks
  gameState.dailyTasks.storyProgress++;

  // Update tasks based on story progress
  if (gameState.dailyTasks.storyProgress < gameState.dailyTasks.storyTasks.length) {
    gameState.dailyTasks.tasks = gameState.dailyTasks.storyTasks[gameState.dailyTasks.storyProgress];

    // Show story progression message
    const storyMessages = [
      "As you survey your nation, the gravity of the food crisis becomes clear...",
      "Your advisors gather to propose bold solutions to the growing crisis...",
      "The nation mobilizes under your leadership to implement the recovery plan...",
      "A devastating storm threatens to undo all your progress...",
      "Despite the setback, your people's resilience shines through..."
    ];

    elements.statusMessage.textContent = storyMessages[gameState.dailyTasks.storyProgress];
    elements.statusMessage.style.color = "#2c6083";
  }

  // Reset daily tasks
  gameState.dailyTasks.completed = 0;
  gameState.day++;

  // Process daily changes
  processResources();
  updateHarmony();

  // Check for end of level
  if (gameState.day > DAYS_PER_LEVEL) {
    completeLevel();
  }

  // Check for game over
  if (gameState.metrics.harmony <= 0) {
    gameOver();
    return;
  }

  // Random chance for new event
  if (!gameState.activeEvent && Math.random() < 0.3) {
    queueRandomEvent();
  }

  updateDisplay();
}

// Process daily resource changes
function processResources() {
  // Food production based on agriculture level
  gameState.resources.food += gameState.metrics.agriculture * 0.5;

  // Wealth generation based on infrastructure and merchant satisfaction
  gameState.resources.wealth +=
    (gameState.metrics.infrastructure * 0.3) +
    (gameState.groups.merchants.satisfaction * gameState.groups.merchants.influence * 0.05);

  // Materials generation based on workers satisfaction
  gameState.resources.materials +=
    (gameState.groups.workers.satisfaction * gameState.groups.workers.influence * 0.05);

  // Technology progress based on education and scholar satisfaction
  gameState.resources.technology +=
    (gameState.metrics.education * 0.1) +
    (gameState.groups.scholars.satisfaction * gameState.groups.scholars.influence * 0.02);

  // Daily food consumption
  const foodConsumption = 5 + (gameState.level * 2);
  gameState.resources.food -= foodConsumption;

  // Food shortage leads to game over
  if (gameState.resources.food <= 0) {
    gameState.resources.food = 0;
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.backgroundColor = 'rgba(244, 67, 54, 0.95)';

    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    modalContent.style.textAlign = 'center';
    modalContent.innerHTML = `
      <h2 style="color: #fff; font-size: 2.5em; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">CATASTROPHIC FAMINE</h2>
      <p style="color: #fff; font-size: 1.2em;">Your nation has collapsed due to severe food shortage.</p>
      <p style="color: #fff;">You reached Level ${gameState.level} and survived for ${gameState.day} days.</p>
      <div class="modal-buttons">
        <button id="restart-game" style="background-color: #fff; color: #f44336;">Start New Game</button>
      </div>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    document.getElementById('restart-game').addEventListener('click', () => {
      modal.remove();
      resetGame();
    });

    gameState.gameOver = true;
  }

  // Cap resources at maximum
  Object.keys(gameState.resources).forEach(resource => {
    gameState.resources[resource] = Math.min(gameState.resources[resource], MAX_RESOURCES);
    gameState.resources[resource] = Math.max(gameState.resources[resource], 0);
  });
}

// Update harmony based on group satisfaction
function updateHarmony() {
  let totalInfluence = 0;
  let weightedSatisfaction = 0;

  Object.keys(gameState.groups).forEach(group => {
    totalInfluence += gameState.groups[group].influence;
    weightedSatisfaction += gameState.groups[group].satisfaction * gameState.groups[group].influence;
  });

  const targetHarmony = weightedSatisfaction / totalInfluence;

  // Harmony changes gradually
  gameState.metrics.harmony += (targetHarmony - gameState.metrics.harmony) * 0.1;

  // Additional factors
  gameState.metrics.harmony += (gameState.metrics.diplomacy * 0.05);

  // Cap harmony at 0-100
  gameState.metrics.harmony = Math.min(Math.max(gameState.metrics.harmony, 0), 100);
}

// Invest in a sector (agriculture, infrastructure, etc.)
function investInSector(sector) {
  const cost = 15;

  if (gameState.wealth < cost) return;

  gameState.wealth -= cost;
  gameState.dailyTasks.completed++;
  elements.statusMessage.textContent = `Task completed! (${gameState.dailyTasks.completed}/${gameState.dailyTasks.required})`;
  gameState.metrics[sector] += 5;

  // Cap at 100
  gameState.metrics[sector] = Math.min(gameState.metrics[sector], 100);

  // Sector-specific benefits
  switch (sector) {
    case 'agriculture':
      gameState.groups.farmers.satisfaction += 10;
      elements.statusMessage.textContent = "Invested in agriculture. Farmers are pleased!";
      break;
    case 'infrastructure':
      gameState.groups.workers.satisfaction += 10;
      elements.statusMessage.textContent = "Invested in infrastructure. Workers are pleased!";
      break;
    case 'education':
      gameState.groups.scholars.satisfaction += 10;
      elements.statusMessage.textContent = "Invested in education. Scholars are pleased!";
      break;
    case 'healthcare':
      // All groups benefit from healthcare
      Object.keys(gameState.groups).forEach(group => {
        gameState.groups[group].satisfaction += 3;
      });
      elements.statusMessage.textContent = "Invested in healthcare. Everyone appreciates it!";
      break;
    case 'diplomacy':
      // Diplomacy helps prevent negative events
      elements.statusMessage.textContent = "Invested in diplomacy. International relations improved!";
      break;
  }

  // Cap satisfaction at 100
  Object.keys(gameState.groups).forEach(group => {
    gameState.groups[group].satisfaction = Math.min(gameState.groups[group].satisfaction, 100);
  });

  updateDisplay();
}

// Distribute food to improve satisfaction
function distributeFood() {
  const amount = 10;

  if (gameState.resources.food < amount) return;

  gameState.resources.food -= amount;
  gameState.dailyTasks.completed++;
  elements.statusMessage.textContent = `Task completed! (${gameState.dailyTasks.completed}/${gameState.dailyTasks.required})`;

  // All groups get a satisfaction boost
  Object.keys(gameState).forEach(group => {
    gameState.groups[group].satisfaction += 5;
    gameState.groups[group].satisfaction = Math.min(gameState.groups[group].satisfaction, 100);
  });

  elements.statusMessage.textContent = "Food distributed. Population satisfaction improved!";
  updateDisplay();
}

// Open trade dialog
function openTradeDialog() {
  const modal = document.createElement('div');
  modal.className = 'modal';

  const modalContent = document.createElement('div');
  modalContent.className = 'modal-content';
  modalContent.innerHTML = `
    <h2>Trade Resources</h2>
    <p>Exchange resources to balance your nation's needs:</p>

    <div>
      <h3>Convert Food to Wealth</h3>
      <p>Exchange 20 Food for 10 Wealth</p>
      <button id="food-to-wealth" ${gameState.resources.food < 20 ? 'disabled' : ''}>Trade</button>
    </div>

    <div>
      <h3>Convert Wealth to Food</h3>
      <p>Exchange 15 Wealth for 25 Food</p>
      <button id="wealth-to-food" ${gameState.resources.wealth < 15 ? 'disabled' : ''}>Trade</button>
    </div>

    <div>
      <h3>Convert Materials to Technology</h3>
      <p>Exchange 30 Materials for 10 Technology</p>
      <button id="materials-to-tech" ${gameState.resources.materials < 30 ? 'disabled' : ''}>Trade</button>
    </div>

    <div>
      <h3>Convert Wealth to Materials</h3>
      <p>Exchange 20 Wealth for 25 Materials</p>
      <button id="wealth-to-materials" ${gameState.resources.wealth < 20 ? 'disabled' : ''}>Trade</button>
    </div>

    <div class="modal-buttons">
      <button id="close-trade">Close</button>
    </div>
  `;

  modal.appendChild(modalContent);
  document.body.appendChild(modal);

  // Add trade event listeners
  document.getElementById('food-to-wealth').addEventListener('click', () => {
    if (gameState.resources.food >= 20) {
      gameState.resources.food -= 20;
      gameState.resources.wealth += 10;
      updateDisplay();
      elements.statusMessage.textContent = "Traded food for wealth";
      modal.remove();
    }
  });

  document.getElementById('wealth-to-food').addEventListener('click', () => {
    if (gameState.resources.wealth >= 15) {
      gameState.resources.wealth -= 15;
      gameState.resources.food += 25;
      updateDisplay();
      elements.statusMessage.textContent = "Traded wealth for food";
      modal.remove();
    }
  });

  document.getElementById('materials-to-tech').addEventListener('click', () => {
    if (gameState.resources.materials >= 30) {
      gameState.resources.materials -= 30;
      gameState.resources.technology += 10;
      updateDisplay();
      elements.statusMessage.textContent = "Traded materials for technology";
      modal.remove();
    }
  });

  document.getElementById('wealth-to-materials').addEventListener('click', () => {
    if (gameState.resources.wealth >= 20) {
      gameState.resources.wealth -= 20;
      gameState.resources.materials += 25;
      updateDisplay();
      elements.statusMessage.textContent = "Traded wealth for materials";
      modal.remove();
    }
  });

  document.getElementById('close-trade').addEventListener('click', () => {
    modal.remove();
  });
}

// Queue a random event
function queueRandomEvent() {
  const events = [
    {
      title: "Drought Warning",
      description: "Meteorologists predict a drought that could severely impact food production in the coming days.",
      choices: [
        {
          text: "Ration food supplies (costs 10 food)",
          effect: () => {
            gameState.resources.food -= 10;
            gameState.groups.farmers.satisfaction -= 5;
            elements.statusMessage.textContent = "Food rationed. Farmers unhappy but disaster averted.";
          },
          available: () => gameState.resources.food >= 10
        },
        {
          text: "Invest in irrigation (costs 15 wealth)",
          effect: () => {
            gameState.resources.wealth -= 15;
            gameState.metrics.agriculture += 3;
            elements.statusMessage.textContent = "Irrigation systems improved. Agriculture capability increased!";
          },
          available: () => gameState.resources.wealth >= 15
        },
        {
          text: "Do nothing and hope for rain",
          effect: () => {
            gameState.resources.food -= 20;
            gameState.resources.food -= 20;
            gameState.groups.farmers.satisfaction -= 15;
            elements.statusMessage.textContent = "The drought hit hard. Food supplies diminished and farmers are upset.";
          },
          available: () => true
        }
      ]
    },
    {
      title: "Border Dispute",
      description: "A neighboring nation is disputing your border claims, creating tension.",
      choices: [
        {
          text: "Negotiate diplomatically (requires diplomacy level 15)",
          effect: () => {
            gameState.metrics.diplomacy += 5;
            elements.statusMessage.textContent = "Diplomatic solution reached. International relations improved!";
          },
          available: () => gameState.metrics.diplomacy >= 15
        },
        {
          text: "Show military strength (costs 25 wealth)",
          effect: () => {
            gameState.resources.wealth -= 25;
            gameState.metrics.diplomacy -= 10;
            elements.statusMessage.textContent = "Border secured but international relations damaged.";
          },
          available: () => gameState.resources.wealth >= 25
        },
        {
          text: "Cede small territory (lose 10 harmony)",
          effect: () => {
            gameState.metrics.harmony -= 10;
            elements.statusMessage.textContent = "Territory ceded. Population morale has decreased.";
          },
          available: () => true
        }
      ]
    },
    {
      title: "Worker Strike",
      description: "Workers are demanding better conditions and higher pay.",
      choices: [
        {
          text: "Meet their demands (costs 20 wealth)",
          effect: () => {
            gameState.resources.wealth -= 20;
            gameState.groups.workers.satisfaction += 15;
            elements.statusMessage.textContent = "Workers' demands met. They are very satisfied!";
          },
          available: () => gameState.resources.wealth >= 20
        },
        {
          text: "Partial compromise (costs 10 wealth)",
          effect: () => {
            gameState.resources.wealth -= 10;
            gameState.groups.workers.satisfaction += 5;
            elements.statusMessage.textContent = "Compromise reached. Workers are somewhat satisfied.";
          },
          available: () => gameState.resources.wealth >= 10
        },
        {
          text: "Refuse demands",
          effect: () => {
            gameState.groups.workers.satisfaction -= 20;
            gameState.metrics.harmony -= 10;
            elements.statusMessage.textContent = "Workers furious! Production decreased and harmony suffered.";
          },
          available: () => true
        }
      ]
    },
    {
      title: "Technological Breakthrough",
      description: "Your scholars have made a breakthrough! How will you utilize this discovery?",
      choices: [
        {
          text: "Improve agriculture (requires 15 technology)",
          effect: () => {
            gameState.resources.technology -= 15;
            gameState.metrics.agriculture += 10;
            gameState.groups.farmers.satisfaction += 10;
            elements.statusMessage.textContent = "Agricultural technology improved! Food production increased.";
          },
          available: () => gameState.resources.technology >= 15
        },
        {
          text: "Enhance infrastructure (requires 15 technology)",
          effect: () => {
            gameState.resources.technology -= 15;
            gameState.metrics.infrastructure += 10;
            gameState.groups.workers.satisfaction += 10;
            elements.statusMessage.textContent = "Infrastructure technology improved! Production efficiency increased.";
          },
          available: () => gameState.resources.technology >= 15
        },
        {
          text: "Sell the technology (gain 30 wealth)",
          effect: () => {
            gameState.resources.wealth += 30;
            gameState.groups.scholars.satisfaction -= 10;
            elements.statusMessage.textContent = "Technology sold for wealth. Scholars disappointed about lost opportunity.";
          },
          available: () => true
        }
      ]
    },
    {
      title: "Natural Disaster",
      description: "A severe earthquake has struck your nation, causing widespread damage.",
      choices: [
        {
          text: "Focus on infrastructure repairs (costs 30 materials)",
          effect: () => {
            gameState.resources.materials -= 30;
            elements.statusMessage.textContent = "Infrastructure restored quickly. Impact minimized.";
          },
          available: () => gameState.resources.materials >= 30
        },
        {
          text: "Prioritize emergency relief (costs 25 food and 15 wealth)",
          effect: () => {
            gameState.resources.food -= 25;
            gameState.resources.wealth -= 15;
            gameState.metrics.harmony += 5;
            elements.statusMessage.textContent = "Relief efforts successful. Population appreciates your response.";
          },
          available: () => gameState.resources.food >= 25 && gameState.resources.wealth >= 15
        },
        {
          text: "Request international aid",
          effect: () => {
            gameState.metrics.diplomacy -= 5;
            gameState.resources.food += 10;
            gameState.resources.materials += 10;
            elements.statusMessage.textContent = "Aid received, but diplomatic standing decreased due to perceived weakness.";
          },
          available: () => true
        }
      ]
    },
    {
      title: "Educational Reform",
      description: "Educational leaders are proposing reforms to the nation's education system.",
      choices: [
        {
          text: "Implement progressive reforms (costs 20 wealth)",
          effect: () => {
            gameState.resources.wealth -= 20;
            gameState.metrics.education += 10;
            gameState.groups.scholars.satisfaction += 15;
            elements.statusMessage.textContent = "Progressive reforms implemented. Education system improved!";
          },
          available: () => gameState.resources.wealth >= 20
        },
        {
          text: "Modest improvements (costs 10 wealth)",
          effect: () => {
            gameState.resources.wealth -= 10;
            gameState.metrics.education += 5;
            gameState.groups.scholars.satisfaction += 5;
            elements.statusMessage.textContent = "Modest improvements made to education system.";
          },
          available: () => gameState.resources.wealth >= 10
        },
        {
          text: "Maintain current system",
          effect: () => {
            gameState.groups.scholars.satisfaction -= 10;
            elements.statusMessage.textContent = "Education system unchanged. Scholars dissatisfied.";
          },
          available: () => true
        }
      ]
    },
    {
      title: "Trade Opportunity",
      description: "A foreign nation proposes a trade agreement that could benefit your economy.",
      choices: [
        {
          text: "Accept the deal (trade influence)",
          effect: () => {
            gameState.resources.wealth += 25;
            gameState.metrics.diplomacy -= 5;
            gameState.groups.merchants.satisfaction += 10;
            elements.statusMessage.textContent = "Trade deal accepted. Economy boosted but some diplomatic leverage lost.";
          },
          available: () => true
        },
        {
          text: "Negotiate better terms (requires diplomacy level 20)",
          effect: () => {
            gameState.resources.wealth += 40;
            gameState.metrics.diplomacy += 5;
            gameState.groups.merchants.satisfaction += 15;
            elements.statusMessage.textContent = "Better terms negotiated! Excellent deal that pleases everyone.";
          },
          available: () => gameState.metrics.diplomacy >= 20
        },
        {
          text: "Decline the offer",
          effect: () => {
            gameState.groups.merchants.satisfaction -= 10;
            elements.statusMessage.textContent = "Trade offer declined. Merchants disappointed about missed opportunity.";
          },
          available: () => true
        }
      ]
    }
  ];

  // Add level-specific events
  if (gameState.level >= 2) {
    events.push({
      title: "Refugee Crisis",
      description: "A conflict in neighboring countries has led to refugees seeking asylum in your nation.",
      choices: [
        {
          text: "Welcome refugees (costs 20 food, gain 5 harmony)",
          effect: () => {
            gameState.resources.food -= 20;
            gameState.metrics.harmony += 5;
            gameState.metrics.diplomacy += 10;
            elements.statusMessage.textContent = "Refugees welcomed. International standing improved but resources strained.";
          },
          available: () => gameState.resources.food >= 20
        },
        {
          text: "Limited acceptance (costs 10 food)",
          effect: () => {
            gameState.resources.food -= 10;
            gameState.metrics.diplomacy += 3;
            elements.statusMessage.textContent = "Limited refugee acceptance policy enacted.";
          },
          available: () => gameState.resources.food >= 10
        },
        {
          text: "Close borders",
          effect: () => {
            gameState.metrics.diplomacy -= 15;
            gameState.metrics.harmony -= 5;
            elements.statusMessage.textContent = "Borders closed to refugees. International criticism strong.";
          },
          available: () => true
        }
      ]
    });
  }

  if (gameState.level >= 3) {
    events.push({
      title: "Technological Revolution",
      description: "A new technological era is dawning. How will your nation adapt?",
      choices: [
        {
          text: "Invest heavily (costs 40 wealth, 30 materials)",
          effect: () => {
            gameState.resources.wealth -= 40;
            gameState.resources.materials -= 30;
            gameState.resources.technology += 50;
            gameState.groups.scholars.satisfaction += 20;
            elements.statusMessage.textContent = "Heavy investment in technology. Your nation leaps ahead!";
          },
          available: () => gameState.resources.wealth >= 40 && gameState.resources.materials >= 30
        },
        {
          text: "Moderate investment (costs 20 wealth, 15 materials)",
          effect: () => {
            gameState.resources.wealth -= 20;
            gameState.resources.materials -= 15;
            gameState.resources.technology += 25;
            gameState.groups.scholars.satisfaction += 10;
            elements.statusMessage.textContent = "Moderate technology investment. Your nation keeps pace.";
          },
          available: () => gameState.resources.wealth >= 20 && gameState.resources.materials >= 15
        },
        {
          text: "Minimal investment",
          effect: () => {
            gameState.resources.technology += 5;
            gameState.groups.scholars.satisfaction -= 15;
            elements.statusMessage.textContent = "Minimal technology investment. Your nation falls behind.";
          },
          available: () => true
        }
      ]
    });
  }

  // Select random event
  const randomEvent = events[Math.floor(Math.random() * events.length)];
  gameState.activeEvent = randomEvent;
  displayEvent(randomEvent);
}

// Display event and choices
function displayEvent(event) {
  gameState.paused = true;

  elements.eventContent.innerHTML = `
    <h3>${event.title}</h3>
    <p>${event.description}</p>
    <div class="storyline-progress">
      <h4>Your Nation's Journey</h4>
      <p>${getStorylineProgress()}</p>
    </div>
  `;

  elements.eventChoices.innerHTML = '';

  event.choices.forEach((choice, index) => {
    const button = document.createElement('button');
    button.textContent = choice.text;
    button.disabled = !choice.available();

    button.addEventListener('click', () => {
      choice.effect();
      gameState.activeEvent = null;
      gameState.paused = false;
      elements.eventContent.innerHTML = '<p>No active events</p>';
      elements.eventChoices.innerHTML = '';
      updateDisplay();
    });

    elements.eventChoices.appendChild(button);
  });
}

// Complete level and give rewards
function completeLevel() {
  gameState.level++;
  const baseReward = 50;
  const harmonyBonus = Math.floor(gameState.metrics.harmony / 10) * 5;
  const totalReward = baseReward + harmonyBonus;

  gameState.wealth += totalReward;
  gameState.day = 1;

  // Display level completion modal
  const modal = document.createElement('div');
  modal.className = 'modal';

  const modalContent = document.createElement('div');
  modalContent.className = 'modal-content';
  modalContent.innerHTML = `
    <h2>Level ${gameState.level - 1} Complete!</h2>
    <p>Your nation has survived and grown stronger!</p>
    <p>Base reward: ${baseReward} wealth</p>
    <p>Harmony bonus: ${harmonyBonus} wealth</p>
    <p>Total reward: ${totalReward} wealth</p>
    <p>You have now advanced to Level ${gameState.level}. New challenges await!</p>

    <div class="modal-buttons">
      <button id="continue-game">Continue</button>
    </div>
  `;

  modal.appendChild(modalContent);
  document.body.appendChild(modal);

  // Level-specific challenges
  switch (gameState.level) {
    case 2:
      gameState.groups.scholars.influence += 0.5; // Scholars become more influential
      break;
    case 3:
      // Add merchants influence
      gameState.groups.merchants.influence += 0.5;
      break;
    case 4:
      // All groups become more demanding
      Object.keys(gameState.groups).forEach(group => {
        gameState.groups[group].satisfaction -= 10;
      });
      break;
  }

  document.getElementById('continue-game').addEventListener('click', () => {
    modal.remove();
    updateDisplay();
  });
}

// Game over
function gameOver() {
  gameState.gameOver = true;

  // Display game over modal
  const modal = document.createElement('div');
  modal.className = 'modal';

  const modalContent = document.createElement('div');
  modalContent.className = 'modal-content';
  modalContent.innerHTML = `
    <h2>Game Over</h2>
    <p>Your nation has collapsed into chaos. Harmony levels reached critical lows.</p>
    <p>You reached Level ${gameState.level} and survived for ${gameState.day} days.</p>

    <div class="modal-buttons">
      <button id="restart-game">Start New Game</button>
    </div>
  `;

  modal.appendChild(modalContent);
  document.body.appendChild(modal);

  document.getElementById('restart-game').addEventListener('click', () => {
    modal.remove();
    resetGame();
  });
}

// Reset game to initial state
function resetGame() {
  gameState = {
    resources: {
      food: 50,
      wealth: 100,
      materials: 75,
      technology: 10
    },
    metrics: {
      harmony: 50,
      infrastructure: 10,
      agriculture: 10,
      education: 10,
      healthcare: 10,
      diplomacy: 10
    },
    groups: {
      farmers: { satisfaction: 50, influence: 1 },
      workers: { satisfaction: 50, influence: 1 },
      merchants: { satisfaction: 50, influence: 1 },
      scholars: { satisfaction: 50, influence: 0.5 }
    },
    level: 1,
    wealth: 0,
    day: 1,
    events: [],
    activeEvent: null,
    gameOver: false,
    paused: false
  };

  updateDisplay();
  queueRandomEvent();
}

// Show introduction modal
function showIntroduction() {
  const modal = document.createElement('div');
  modal.className = 'modal';

  const modalContent = document.createElement('div');
  modalContent.className = 'modal-content';
  modalContent.innerHTML = `
    <h2>Welcome to HarmonyNation</h2>
    <p>As the leader of a struggling nation, your mission is to guide your people to prosperity and peace.</p>
    <p>Your challenges:</p>
    <ul>
      <li>Maintain harmony above critical levels</li>
      <li>Balance the needs of various population groups</li>
      <li>Manage limited resources carefully</li>
      <li>Respond to crises and opportunities</li>
    </ul>
    <p>Complete each level to earn wealth that can be invested in your nation's future.</p>

    <div class="modal-buttons">
      <button id="start-game">Begin Your Journey</button>
    </div>
  `;

  modal.appendChild(modalContent);
  document.body.appendChild(modal);

  document.getElementById('start-game').addEventListener('click', () => {
    modal.remove();
  });
}

// Get storyline progress
function getStorylineProgress() {
  const storylinePhases = [
    "Your nation faces a severe food crisis. As leader, you must navigate through these challenging times.",
    "With your advisors' support, you work to develop solutions to the growing food shortage.",
    "The nation unites in implementing recovery plans, showing signs of progress.",
    "A devastating storm threatens to undo your progress. Your leadership is crucial.",
    "Despite setbacks, your people's resilience shines through as you rebuild."
  ];

  return storylinePhases[Math.min(gameState.dailyTasks.storyProgress, storylinePhases.length - 1)];
}

// Initialize the game when the page loads
window.onload = initGame;
