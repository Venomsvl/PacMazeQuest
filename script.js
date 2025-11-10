/**
 * Main Game Script
 * Initializes WebGL, handles rendering, input, and game loop
 */

import { createShader, createProgram, createBuffer, setRectangle, setCircle } from './src/utils.js';
import { MAZE_LAYOUT, CELL_SIZE, MAZE_WIDTH, MAZE_HEIGHT, resetMaze } from './src/maze.js';
import { PacMan, createPacManVertices } from './src/pacman.js';
import { checkWallCollision, canMove, handleTunnelWrapping, collectPellet } from './src/game.js';

// WebGL context and program
const canvas = document.getElementById('gameCanvas');
const gl = canvas.getContext('webgl');

if (!gl) {
    console.error('WebGL not supported');
    alert('WebGL is not supported in your browser');
}

// Set canvas size - responsive
const scale = 1;
const baseWidth = MAZE_WIDTH * CELL_SIZE;
const baseHeight = MAZE_HEIGHT * CELL_SIZE;

// Calculate responsive size
function updateCanvasSize() {
    const maxWidth = window.innerWidth - 40; // Account for padding
    const maxHeight = window.innerHeight - 250; // Account for UI elements
    
    let displayWidth = baseWidth;
    let displayHeight = baseHeight;
    
    // Scale to fit screen
    const scaleX = maxWidth / baseWidth;
    const scaleY = maxHeight / baseHeight;
    const scaleFactor = Math.min(scaleX, scaleY, 1); // Don't scale up, only down
    
    displayWidth = baseWidth * scaleFactor;
    displayHeight = baseHeight * scaleFactor;
    
    canvas.style.width = displayWidth + 'px';
    canvas.style.height = displayHeight + 'px';
    canvas.width = displayWidth;
    canvas.height = displayHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
}

updateCanvasSize();
window.addEventListener('resize', updateCanvasSize);

// WebGL program and locations
let program;
let positionLocation;
let colorLocation;
let resolutionLocation;
let translationLocation;
let scaleLocation;
let useTextureLocation;

// Game state
let pacman;
let gameRunning = false;
let gamePaused = false;
let score = 0;
let timer = 60; // 60 seconds countdown
let timerInterval;
let animationFrame;
let currentGameType = 'pacman'; // 'pacman', 'mspacman', 'cookieman', 'learn'
let currentDifficulty = 'medium'; // 'easy', 'medium', 'hard'
let readyScreenShown = false;

// Customization settings (stored)
let customizationSettings = {
    color: [1.0, 1.0, 0.0, 1.0] // Yellow default
};

// Input handling
const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false
};

/**
 * Load shader from file
 */
async function loadShader(url) {
    const response = await fetch(url);
    return await response.text();
}

/**
 * Initialize WebGL shaders and program
 */
async function initShaders() {
    const vertexShaderSource = await loadShader('./shaders/vertex.glsl');
    const fragmentShaderSource = await loadShader('./shaders/fragment.glsl');
    
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    
    const program = createProgram(gl, vertexShader, fragmentShader);
    
    return program;
}

/**
 * Initialize start screen
 */
function initStartScreen() {
    const startScreen = document.getElementById('start-screen');
    const customizeScreen = document.getElementById('customize-screen');
    const difficultyScreen = document.getElementById('difficulty-screen');
    const startBtn = document.getElementById('start-btn');
    const howToPlayBtn = document.getElementById('how-to-play-btn');
    const continueFromCustomize = document.getElementById('continue-from-customize');
    const backFromCustomize = document.getElementById('back-from-customize');
    const backFromDifficulty = document.getElementById('back-from-difficulty');
    
    // Start button - show customization
    startBtn.addEventListener('click', () => {
        startScreen.style.display = 'none';
        customizeScreen.style.display = 'flex';
    });
    
    // Back from customize
    backFromCustomize.addEventListener('click', () => {
        customizeScreen.style.display = 'none';
        startScreen.style.display = 'flex';
    });
    
    // Continue from customize - show difficulty
    continueFromCustomize.addEventListener('click', () => {
        customizeScreen.style.display = 'none';
        difficultyScreen.style.display = 'flex';
    });
    
    // Back from difficulty
    backFromDifficulty.addEventListener('click', () => {
        difficultyScreen.style.display = 'none';
        customizeScreen.style.display = 'flex';
    });
    
    // Difficulty selection buttons
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentDifficulty = btn.dataset.difficulty;
            difficultyScreen.style.display = 'none';
            startScreen.style.display = 'none';
            startGame();
        });
    });
    
    // How to Play button
    howToPlayBtn.addEventListener('click', () => {
        document.getElementById('how-to-play-modal').style.display = 'block';
    });
    
    // Close modals
    document.querySelectorAll('.close-modal').forEach(closeBtn => {
        closeBtn.addEventListener('click', (e) => {
            e.target.closest('.modal').style.display = 'none';
        });
    });
    
    // Close modals on outside click
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
    
    // Setup customization
    setupStartScreenCustomization();
}

/**
 * Setup customization on start screen
 */
function setupStartScreenCustomization() {
    // Main customization option buttons
    document.querySelectorAll('.customize-option-btn[data-option]').forEach(btn => {
        btn.addEventListener('click', () => {
            const option = btn.dataset.option;
            // Hide main menu, show submenu
            document.querySelector('.customize-content').style.display = 'none';
            document.getElementById(`${option}-submenu`).style.display = 'flex';
        });
    });
    
    // Continue button
    const continueBtn = document.getElementById('continue-from-customize');
    if (continueBtn) {
        continueBtn.addEventListener('click', () => {
            document.getElementById('customize-screen').style.display = 'none';
            document.getElementById('difficulty-screen').style.display = 'flex';
        });
    }
    
    // Color options
    document.querySelectorAll('.color-option-btn[data-color]').forEach(btn => {
        btn.addEventListener('click', () => {
            const hex = btn.dataset.color;
            customizationSettings.color = hexToRgb(hex);
            // Update active state
            document.querySelectorAll('.color-option-btn').forEach(b => {
                b.style.border = '2px solid #666';
            });
            btn.style.border = '2px solid #ffd700';
            // Go back to main customize menu
            document.getElementById('color-submenu').style.display = 'none';
            document.querySelector('.customize-content').style.display = 'flex';
        });
    });
    
    // Custom color button
    const customColorBtn = document.getElementById('custom-color-btn');
    const colorPicker = document.getElementById('pacman-color');
    
    if (customColorBtn && colorPicker) {
        customColorBtn.addEventListener('click', () => {
            colorPicker.click();
        });
        
        colorPicker.addEventListener('input', (e) => {
            const hex = e.target.value;
            customizationSettings.color = hexToRgb(hex);
            document.getElementById('color-submenu').style.display = 'none';
            document.querySelector('.customize-content').style.display = 'flex';
        });
    }
    
    // Back from color
    const backFromColor = document.getElementById('back-from-color');
    if (backFromColor) {
        backFromColor.addEventListener('click', () => {
            document.getElementById('color-submenu').style.display = 'none';
            document.querySelector('.customize-content').style.display = 'flex';
        });
    }
}

/**
 * Convert hex to RGB array
 */
function hexToRgb(hex) {
    const r = parseInt(hex.substr(1, 2), 16) / 255;
    const g = parseInt(hex.substr(3, 2), 16) / 255;
    const b = parseInt(hex.substr(5, 2), 16) / 255;
    return [r, g, b, 1.0];
}

/**
 * Initialize game
 */
async function initGame() {
    // Initialize WebGL
    program = await initShaders();
    
    // Get attribute and uniform locations
    positionLocation = gl.getAttribLocation(program, 'a_position');
    colorLocation = gl.getUniformLocation(program, 'u_color');
    resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    translationLocation = gl.getUniformLocation(program, 'u_translation');
    scaleLocation = gl.getUniformLocation(program, 'u_scale');
    useTextureLocation = gl.getUniformLocation(program, 'u_useTexture');
    
    // Set up input handlers
    setupInputHandlers();
    
    // Set up game controls
    setupGameControls();
    
    // Make canvas focusable for keyboard input
    canvas.setAttribute('tabindex', '0');
    canvas.focus();
    
    // Ensure canvas stays focused when clicked
    canvas.addEventListener('click', () => {
        canvas.focus();
    });
}

/**
 * Set up keyboard input handlers
 */
function setupInputHandlers() {
    document.addEventListener('keydown', (e) => {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
            keys[e.key] = true;
            
            if (gameRunning && !gamePaused) {
                pacman.setDirection(e.key);
            }
        }
        
        // Space bar to pause/resume
        if (e.key === ' ' && gameRunning) {
            e.preventDefault();
            togglePause();
        }
    });
    
    document.addEventListener('keyup', (e) => {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            keys[e.key] = false;
        }
    });
}

/**
 * Setup game control buttons
 */
function setupGameControls() {
    // Menu button in game
    const menuBtnGame = document.getElementById('menu-btn-game');
    if (menuBtnGame) {
        menuBtnGame.addEventListener('click', () => {
            togglePause();
        });
    }
    
    // Resume button
    const resumeBtn = document.getElementById('resume-btn');
    if (resumeBtn) {
        resumeBtn.addEventListener('click', togglePause);
    }
    
    // Quit button
    const quitBtn = document.getElementById('quit-btn');
    if (quitBtn) {
        quitBtn.addEventListener('click', () => {
            document.getElementById('pause-overlay').style.display = 'none';
            document.getElementById('quit-confirm').style.display = 'flex';
        });
    }
    
    // Quit confirmation buttons
    const quitYes = document.getElementById('quit-yes');
    if (quitYes) {
        quitYes.addEventListener('click', () => {
            goToMainMenu();
        });
    }
    
    const quitNo = document.getElementById('quit-no');
    if (quitNo) {
        quitNo.addEventListener('click', () => {
            document.getElementById('quit-confirm').style.display = 'none';
            togglePause(); // Resume game
        });
    }
    
    const quitCancel = document.getElementById('quit-cancel');
    if (quitCancel) {
        quitCancel.addEventListener('click', () => {
            document.getElementById('quit-confirm').style.display = 'none';
            togglePause(); // Resume game
        });
    }
    
    // Play again button
    const playAgainBtn = document.getElementById('play-again-btn');
    if (playAgainBtn) {
        playAgainBtn.addEventListener('click', () => {
            restartGame();
            document.getElementById('time-up').style.display = 'none';
        });
    }
    
    // Main menu button (from game over)
    const mainMenuBtn = document.getElementById('main-menu-btn');
    if (mainMenuBtn) {
        mainMenuBtn.addEventListener('click', goToMainMenu);
    }
}

/**
 * Show ready screen
 */
function showReadyScreen() {
    const readyScreen = document.getElementById('ready-screen');
    readyScreen.style.display = 'flex';
    readyScreenShown = true;
    
    // Start rendering immediately (but don't start game logic)
    gameLoop();
    
    // Hide after 3 seconds and start game
    setTimeout(() => {
        readyScreen.style.display = 'none';
        gameRunning = true;
        readyScreenShown = false;
        startTimer();
    }, 3000);
}

/**
 * Toggle pause
 */
function togglePause() {
    if (!gameRunning || readyScreenShown) return;
    
    gamePaused = !gamePaused;
    const pauseOverlay = document.getElementById('pause-overlay');
    const quitConfirm = document.getElementById('quit-confirm');
    
    if (gamePaused) {
        pauseOverlay.style.display = 'flex';
        if (timerInterval) clearInterval(timerInterval);
    } else {
        pauseOverlay.style.display = 'none';
        quitConfirm.style.display = 'none';
        startTimer();
    }
}

/**
 * Restart game
 */
function restartGame() {
    // Reset game state
    gameRunning = true;
    gamePaused = false;
    score = 0;
    timer = 60;
    
    // Clear intervals
    if (timerInterval) clearInterval(timerInterval);
    if (animationFrame) cancelAnimationFrame(animationFrame);
    
    // Hide overlays
    document.getElementById('pause-overlay').style.display = 'none';
    document.getElementById('time-up').style.display = 'none';
    
    // Reset maze to original state
    resetMaze();
    
    // Reinitialize Pac-Man with customization
    pacman = new PacMan(14 * CELL_SIZE + CELL_SIZE / 2, 29 * CELL_SIZE + CELL_SIZE / 2, 8);
    pacman.color = [...customizationSettings.color];
    
    // Update displays
    updateScoreDisplay();
    updateTimerDisplay();
    
    // Start game
    startGame();
}

/**
 * Go to main menu
 */
function goToMainMenu() {
    // Stop game
    gameRunning = false;
    gamePaused = false;
    readyScreenShown = false;
    
    if (timerInterval) clearInterval(timerInterval);
    if (animationFrame) cancelAnimationFrame(animationFrame);
    
    // Hide game screen, show start screen
    document.getElementById('game-screen').style.display = 'none';
    document.getElementById('start-screen').style.display = 'flex';
    
    // Hide all overlays
    document.getElementById('pause-overlay').style.display = 'none';
    document.getElementById('time-up').style.display = 'none';
    document.getElementById('quit-confirm').style.display = 'none';
    document.getElementById('ready-screen').style.display = 'none';
}

/**
 * Start the game
 */
function startGame() {
    // Initialize Pac-Man with customization
    if (!pacman) {
        pacman = new PacMan(14 * CELL_SIZE + CELL_SIZE / 2, 29 * CELL_SIZE + CELL_SIZE / 2, 8);
    }
    pacman.color = [...customizationSettings.color];
    
    // Reset game state
    gameRunning = false; // Don't start until ready screen is done
    gamePaused = false;
    readyScreenShown = false;
    score = 0;
    timer = 60;
    
    // Reset maze
    resetMaze();
    
    // Show game screen
    document.getElementById('game-screen').style.display = 'flex';
    
    // Update canvas size when game starts (after screen is shown)
    setTimeout(() => {
        updateCanvasSize();
        // Start rendering
        if (!animationFrame) {
            gameLoop();
        }
    }, 100);
    
    // Show ready screen
    showReadyScreen();
}

/**
 * Start timer
 */
function startTimer() {
    timerInterval = setInterval(() => {
        if (gameRunning && !gamePaused) {
            timer--;
            updateTimerDisplay();
            
            if (timer <= 0) {
                endGame();
            }
        }
    }, 1000);
}

/**
 * End the game
 */
function endGame() {
    gameRunning = false;
    gamePaused = false;
    clearInterval(timerInterval);
    
    // Show "Time's up!" message
    const timeUpDiv = document.getElementById('time-up');
    const finalScoreSpan = document.getElementById('final-score');
    finalScoreSpan.textContent = score.toString().padStart(5, '0');
    timeUpDiv.style.display = 'block';
    
    // Stop animation
    if (animationFrame) {
        cancelAnimationFrame(animationFrame);
    }
}

/**
 * Update timer display
 */
function updateTimerDisplay() {
    const timerDisplay = document.getElementById('timer');
    timerDisplay.textContent = timer.toString().padStart(2, '0');
}

/**
 * Update score display
 */
function updateScoreDisplay() {
    document.getElementById('score').textContent = score.toString();
}

/**
 * Game loop
 */
function gameLoop() {
    // Always render (even during ready screen)
    render();
    
    // Only update game logic if game is running and not paused
    if (gameRunning && !gamePaused && !readyScreenShown) {
        update();
    }
    
    // Continue loop
    animationFrame = requestAnimationFrame(gameLoop);
}

// Delta time for smooth movement
let lastTime = 0;
const targetFPS = 60;
const frameTime = 1000 / targetFPS;

/**
 * Update game state
 */
function update() {
    if (!pacman || !gameRunning || gamePaused) return;
    
    const currentTime = performance.now();
    const deltaTime = Math.min((currentTime - lastTime) / frameTime, 2); // Cap at 2x speed
    lastTime = currentTime;
    
    // Update Pac-Man animation
    pacman.update();
    
    // Handle movement - try to move in current direction
    const radius = pacman.getCollisionRadius();
    const moveDistance = pacman.speed * deltaTime;
    
    // Check if movement is allowed in current direction
    if (canMove(pacman.x, pacman.y, radius, pacman.direction, moveDistance)) {
        const nextPos = pacman.getNextPosition(moveDistance);
        // Handle tunnel wrapping
        const wrappedPos = handleTunnelWrapping(nextPos.x, nextPos.y);
        pacman.move(wrappedPos.x, wrappedPos.y);
        
        // Check for pellet collection
        const points = collectPellet(pacman.x, pacman.y);
        if (points > 0) {
            score += points;
            updateScoreDisplay();
        }
    } else {
        // If can't move in current direction, try to align to grid center for smoother movement
        const gridX = Math.round(pacman.x / CELL_SIZE) * CELL_SIZE;
        const gridY = Math.round(pacman.y / CELL_SIZE) * CELL_SIZE;
        
        // Snap to grid center if close enough (helps with cornering)
        if (Math.abs(pacman.x - gridX) < 3 && Math.abs(pacman.y - gridY) < 3) {
            pacman.move(gridX, gridY);
        }
    }
}

/**
 * Render everything
 */
function render() {
    if (!program || !positionLocation) {
        return; // WebGL not initialized yet
    }
    
    // Clear canvas
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    gl.useProgram(program);
    
    // Set uniforms - transform from maze coordinates to screen coordinates
    // Maze is 28*20 = 560 wide, 31*20 = 620 tall
    const mazeWidth = MAZE_WIDTH * CELL_SIZE;
    const mazeHeight = MAZE_HEIGHT * CELL_SIZE;
    
    // The vertex shader does: (position * scale + translation) / resolution * 2.0 - 1.0
    // We want to map maze coords (0-560, 0-620) to canvas, then to NDC
    // Scale maze coords to canvas coords, then resolution normalizes to NDC
    const scaleX = canvas.width / mazeWidth;
    const scaleY = canvas.height / mazeHeight;
    
    gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
    gl.uniform2f(translationLocation, 0, 0);
    gl.uniform2f(scaleLocation, scaleX, scaleY);
    gl.uniform1f(useTextureLocation, 0);
    
    // Enable blending for transparency
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    
    // Draw maze
    drawMaze();
    
    // Draw Pac-Man
    if (pacman) {
        drawPacMan();
    }
}

/**
 * Draw the maze
 */
function drawMaze() {
    const wallColor = [0.13, 0.13, 0.87, 1.0]; // Blue #2121de
    const pelletColor = [1.0, 0.75, 0.8, 1.0]; // Pink (matching classic Pac-Man)
    const powerPelletColor = [1.0, 0.75, 0.8, 1.0]; // Pink power pellets
    
    for (let row = 0; row < MAZE_HEIGHT; row++) {
        for (let col = 0; col < MAZE_WIDTH; col++) {
            const cell = MAZE_LAYOUT[row][col];
            const x = col * CELL_SIZE;
            const y = row * CELL_SIZE;
            
            if (cell === 1) {
                // Draw wall
                drawRectangle(x, y, CELL_SIZE, CELL_SIZE, wallColor);
            } else if (cell === 2) {
                // Draw pellet
                drawCircle(x + CELL_SIZE / 2, y + CELL_SIZE / 2, 2, pelletColor);
            } else if (cell === 3) {
                // Draw power pellet
                drawCircle(x + CELL_SIZE / 2, y + CELL_SIZE / 2, 6, powerPelletColor);
            }
        }
    }
    
    // Draw ghost house walls
    drawGhostHouse();
}

/**
 * Draw ghost house
 */
function drawGhostHouse() {
    const wallColor = [0.13, 0.13, 0.87, 1.0];
    
    // Left wall of ghost house
    drawRectangle(11 * CELL_SIZE, 12 * CELL_SIZE, CELL_SIZE, 3 * CELL_SIZE, wallColor);
    // Right wall of ghost house
    drawRectangle(16 * CELL_SIZE, 12 * CELL_SIZE, CELL_SIZE, 3 * CELL_SIZE, wallColor);
    // Bottom wall of ghost house
    drawRectangle(11 * CELL_SIZE, 15 * CELL_SIZE, 6 * CELL_SIZE, CELL_SIZE, wallColor);
    // Top wall left part
    drawRectangle(11 * CELL_SIZE, 12 * CELL_SIZE, 2 * CELL_SIZE, CELL_SIZE, wallColor);
    // Top wall right part
    drawRectangle(15 * CELL_SIZE, 12 * CELL_SIZE, 2 * CELL_SIZE, CELL_SIZE, wallColor);
}

/**
 * Draw Pac-Man character
 */
function drawPacMan() {
    const radii = pacman.getEffectiveRadius();
    const vertices = createPacManVertices(
        pacman.x,
        pacman.y,
        radii.x,
        radii.y,
        pacman.mouthAngle,
        pacman.getRotation(),
        32
    );
    
    const buffer = createBuffer(gl, vertices);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    
    gl.uniform4f(colorLocation, pacman.color[0], pacman.color[1], pacman.color[2], pacman.color[3]);
    
    gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 2);
}

/**
 * Draw a rectangle
 */
function drawRectangle(x, y, width, height, color) {
    const vertices = setRectangle(gl, x, y, width, height);
    const buffer = createBuffer(gl, vertices);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    
    gl.uniform4f(colorLocation, color[0], color[1], color[2], color[3]);
    
    gl.drawArrays(gl.TRIANGLES, 0, 6);
}

/**
 * Draw a circle
 */
function drawCircle(centerX, centerY, radius, color) {
    const vertices = setCircle(gl, centerX, centerY, radius, 16);
    const buffer = createBuffer(gl, vertices);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    
    gl.uniform4f(colorLocation, color[0], color[1], color[2], color[3]);
    
    gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 2);
}

// Initialize lives display
function initLives() {
    const livesContainer = document.getElementById('lives');
    const lives = 2; // 2 lives remaining
    
    for (let i = 0; i < lives; i++) {
        const lifeIcon = document.createElement('div');
        lifeIcon.className = 'life-icon';
        livesContainer.appendChild(lifeIcon);
    }
}

// Initialize everything when page loads
initLives();
initStartScreen();
initGame();
