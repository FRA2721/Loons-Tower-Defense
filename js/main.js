// Get canvas reference and 2D drawing context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Variables for turret dragging and positions
let turretDragging = false;
let turretX = 0;
let turretY = 0;

// Arrays to handle enemies, missiles, turrets, and game data
let enemies = [];
let missiles = [];
let turrets = [];
let destroyedEnemies = 0;
let score = 0;

// Get reference to score table
const scoreTable = document.getElementById('scoreTableBody');
let gameEnded = false;

// Add an enemy every 3 seconds
setInterval(() => {
  if (!gameEnded) {
    const enemy = {
      x: canvas.width,
      y: Math.floor(Math.random() * canvas.height),
      width: 20,
      height: 20,
      speed: 1
    };
    enemies.push(enemy);
  }
}, 3000);

// Function to fire a missile from turret to enemy position
function fireMissile(turretX, turretY, enemy) {
  const missileX = turretX + 20;
  const missileY = turretY + 10;
  missiles.push({ x: missileX, y: missileY, enemy });
}

// Function to draw missiles and handle collisions with enemies
function drawMissiles() {
  ctx.fillStyle = 'green';
  for (let i = 0; i < missiles.length; i++) {
    ctx.fillRect(missiles[i].x, missiles[i].y, 5, 5);
    const dx = missiles[i].enemy.x - missiles[i].x;
    const dy = missiles[i].enemy.y - missiles[i].y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const velX = (dx / distance) * 3;
    const velY = (dy / distance) * 3;
    missiles[i].x += velX;
    missiles[i].y += velY;

    // Check collisions with enemies
    if (
      missiles[i].x < missiles[i].enemy.x + missiles[i].enemy.width &&
      missiles[i].x + 5 > missiles[i].enemy.x &&
      missiles[i].y < missiles[i].enemy.y + missiles[i].enemy.height &&
      missiles[i].y + 5 > missiles[i].enemy.y
    ) {
      // Remove enemy and missile on collision
      enemies.splice(enemies.indexOf(missiles[i].enemy), 1);
      missiles.splice(i, 1);
      i--;
      destroyedEnemies++;
      score += 10;
      updateScoreTable();
    }
  }
}

// Function to draw enemies
function drawEnemies() {
  ctx.fillStyle = 'blue'; // Enemies color
  for (let i = 0; i < enemies.length; i++) {
    ctx.fillRect(enemies[i].x, enemies[i].y, enemies[i].width, enemies[i].height);
    enemies[i].x -= enemies[i].speed;

    // End game if enemy reaches the left limit of canvas
    if (enemies[i].x < 0) {
      gameEnded = true;
    }

    // Check collisions with turrets
    for (let j = 0; j < turrets.length; j++) {
      if (
        enemies[i].x < turrets[j].x + turrets[j].width &&
        enemies[i].x + enemies[i].width > turrets[j].x &&
        enemies[i].y < turrets[j].y + turrets[j].height &&
        enemies[i].y + enemies[i].height > turrets[j].y
      ) {
        turrets.splice(j, 1);
        j--;
      }
    }
  }
  // Show "Game Over" if game has ended
  if (gameEnded) {
    ctx.fillStyle = 'red';
    ctx.font = '40px Arial';
    ctx.fillText('Game Over - You Lost!', canvas.width / 2 - 150, canvas.height / 2);
    restartButton.style.display = 'block'; // Display the restart button
  }
}

// Function to draw turrets and check if they should fire
function drawTurrets() {
  ctx.fillStyle = 'red'; // Turrets color
  for (let i = 0; i < turrets.length; i++) {
    ctx.beginPath();
    ctx.arc(turrets[i].x + 10, turrets[i].y + 10, 50, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 255, 0, 0.3)'; // Light green action radius
    ctx.fill();

    ctx.fillRect(turrets[i].x, turrets[i].y, turrets[i].width, turrets[i].height);

    // Fire at enemies within turret's action radius
    for (let j = 0; j < enemies.length; j++) {
      if (
        enemies[j].x > turrets[i].x - 50 &&
        enemies[j].x < turrets[i].x + 70 &&
        enemies[j].y > turrets[i].y - 50 &&
        enemies[j].y < turrets[i].y + 70 &&
        missiles.filter(m => m.enemy === enemies[j]).length === 0 // Fire only if there's no missile towards this enemy
      ) {
        fireMissile(turrets[i].x, turrets[i].y, enemies[j]);
      }
    }
  }
}

// Function to update score table
function updateScoreTable() {
  scoreTable.innerHTML = `
    <tr>
      <td>${destroyedEnemies}</td>
      <td>${score}</td>
    </tr>
  `;
}

// Main function to draw the game
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw enemies
  drawEnemies();

  // Draw turrets
  drawTurrets();

  // Draw missiles
  drawMissiles();

  // Continue game loop if game has not ended
  if (!gameEnded) {
    requestAnimationFrame(draw);
  }
}

// Function to check object overlap
const checkOverlap = (x1, y1, w1, h1, x2, y2, w2, h2) => {
  return (
    x1 < x2 + w2 &&
    x1 + w1 > x2 &&
    y1 < y2 + h2 &&
    y1 + h1 > y2
  );
};

// Mouse event handling for dragging and placing turrets
canvas.addEventListener('mousedown', (event) => {
  if (!gameEnded) {
    turretDragging = true;
    turretX = event.clientX - canvas.offsetLeft;
    turretY = event.clientY - canvas.offsetTop;
  }
});

canvas.addEventListener('mousemove', (event) => {
  if (!gameEnded && turretDragging) {
    turretX = event.clientX - canvas.offsetLeft;
    turretY = event.clientY - canvas.offsetTop;
  }
});

canvas.addEventListener('mouseup', () => {
  if (!gameEnded) {
    turretDragging = false;

    // Check if a new turret overlaps an existing turret
    let turretOverlap = false;
    for (let i = 0; i < turrets.length; i++) {
      if (
        checkOverlap(
          turretX,
          turretY,
          20,
          20,
          turrets[i].x,
          turrets[i].y,
          20,
          20
        )
      ) {
        turretOverlap = true;
        break;
      }
    }

    // Add a new turret if it does not overlap an existing turret
    if (!turretOverlap) {
      const newTurret = {
        x: turretX,
        y: turretY,
        width: 20,
        height: 20
      };
      turrets.push(newTurret);
    }
  }
});

// ... Codice precedente

// Start button functionality
const startButton = document.createElement('button');
startButton.innerText = 'Start Game';
startButton.style.position = 'absolute';
startButton.style.top = '50%';
startButton.style.left = '50%';
startButton.style.transform = 'translate(-50%, -50%)';
document.body.appendChild(startButton);

// Restart button functionality
const restartButton = document.createElement('button');
restartButton.innerText = 'Restart Game';
restartButton.style.position = 'absolute';
restartButton.style.top = '50%';
restartButton.style.left = '50%';
restartButton.style.transform = 'translate(-50%, -50%)';
restartButton.style.display = 'none'; // Initially hide restart button
document.body.appendChild(restartButton);

// Add an event listener to the Start button
startButton.addEventListener('click', () => {
  startButton.style.display = 'none'; // Hide start button after clicking
  restartButton.style.display = 'none'; // Hide restart button if visible
  // Start the game loop
  gameEnded = false;
  enemies = [];
  missiles = [];
  turrets = [];
  destroyedEnemies = 0;
  score = 0;
  updateScoreTable();
  draw();
});

// Add an event listener to the Restart button
restartButton.addEventListener('click', () => {
  restartButton.style.display = 'none'; // Hide restart button after clicking
  // Restart the game loop
  gameEnded = false;
  enemies = [];
  missiles = [];
  turrets = [];
  destroyedEnemies = 0;
  score = 0;
  updateScoreTable();
  draw();
});

