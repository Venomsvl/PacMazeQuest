/**
 * Main Game Script
 * Initializes WebGL, handles rendering, input, and game loop
 */

import { createShader, createProgram, createBuffer, setRectangle, setCircle } from './src/utils.js';
import { Maze, MAZE_LAYOUT, CELL_SIZE, MAZE_WIDTH, MAZE_HEIGHT, resetMaze } from './src/maze.js';
import { PacMan, createPacManVertices } from './src/pacman.js';
import { checkWallCollision, canMove, handleTunnelWrapping, collectPellet } from './src/game.js';

// WebGL context and program
const canvas = document.getElementById('gameCanvas');

if (!canvas) {
    console.error('Canvas element not found!');
    alert('Canvas element not found!');
}

const gl = canvas.getContext('webgl');

if (!gl) {
    console.error('WebGL not supported');
    alert('WebGL is not supported in your browser');
} else {
    console.log('WebGL context created successfully');
    console.log('Canvas element:', canvas);
    console.log('Canvas dimensions:', canvas.width, 'x', canvas.height);
    console.log('Canvas style dimensions:', canvas.style.width, 'x', canvas.style.height);
}

// Set canvas size - responsive
const scale = 1;
const baseWidth = MAZE_WIDTH * CELL_SIZE;
const baseHeight = MAZE_HEIGHT * CELL_SIZE;

// Calculate responsive size - make it MUCH bigger
function updateCanvasSize() {
    // Use almost the entire screen - minimal padding
    const maxWidth = window.innerWidth - 5; // Almost no padding
    const maxHeight = window.innerHeight - 120; // Minimal space for UI elements
    
    let displayWidth = baseWidth;
    let displayHeight = baseHeight;
    
    // Scale to fill screen - use maximum scale to make it as big as possible
    const scaleX = maxWidth / baseWidth;
    const scaleY = maxHeight / baseHeight;
    // Use 100% of available space - make it HUGE
    const scaleFactor = Math.min(scaleX, scaleY) * 1.0; // Use 100% of available space
    
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
let maze;
let pacman;
let gameRunning = false;
let gamePaused = false;
let score = 2770; // Initial score to match the image
let timer = 60; // 60 seconds countdown
let timerInterval;
let animationFrame;
let currentGameType = 'pacman'; // 'pacman', 'mspacman', 'cookieman', 'learn'
let currentDifficulty = 'medium'; // 'easy', 'medium', 'hard'
let readyScreenShown = false;
let cherriesCollected = 1; // Track cherries (pellets collected) - set to 1 to match image

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
            // Don't close the submenu - let user stay and choose or click BACK
        });
    });
    
    // Custom color button (in color submenu)
    const customColorBtn = document.getElementById('custom-color-btn-submenu');
    const colorPicker = document.getElementById('pacman-color-submenu');
    
    if (customColorBtn && colorPicker) {
        customColorBtn.addEventListener('click', () => {
            colorPicker.click();
        });
        
        colorPicker.addEventListener('input', (e) => {
            const hex = e.target.value;
            customizationSettings.color = hexToRgb(hex);
            // Update the preview color
            const preview = customColorBtn.querySelector('.color-preview');
            if (preview) {
                preview.style.background = hex;
                preview.style.border = '2px solid #333';
            }
            // Update active state
            document.querySelectorAll('.color-option-btn').forEach(b => {
                b.style.border = '2px solid #666';
            });
            customColorBtn.style.border = '2px solid #ffd700';
            // Don't close the submenu - let user stay and choose or click BACK
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
    console.log('Initializing game...');
    
    // Initialize WebGL
    program = await initShaders();
    
    if (!program) {
        console.error('Failed to create WebGL program!');
        return;
    }
    
    console.log('WebGL program created successfully');
    
    // Get attribute and uniform locations
    positionLocation = gl.getAttribLocation(program, 'a_position');
    colorLocation = gl.getUniformLocation(program, 'u_color');
    resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    translationLocation = gl.getUniformLocation(program, 'u_translation');
    scaleLocation = gl.getUniformLocation(program, 'u_scale');
    useTextureLocation = gl.getUniformLocation(program, 'u_useTexture');
    
    console.log('WebGL locations:', {
        positionLocation,
        colorLocation,
        resolutionLocation,
        translationLocation,
        scaleLocation
    });
    
    // Set up input handlers
    setupInputHandlers();
    
    // Set up game controls
    setupGameControls();
    
    // Initialize maze
    maze = new Maze(gl);
    
    // Make canvas focusable for keyboard input
    canvas.setAttribute('tabindex', '0');
    canvas.setAttribute('autofocus', 'true');
    
    // Ensure canvas stays focused when clicked
    canvas.addEventListener('click', () => {
        canvas.focus();
    });
    
    // Auto-focus canvas when game screen is shown
    const gameScreen = document.getElementById('game-screen');
    if (gameScreen) {
        const observer = new MutationObserver(() => {
            if (gameScreen.style.display !== 'none') {
                setTimeout(() => canvas.focus(), 100);
            }
        });
        observer.observe(gameScreen, { attributes: true, attributeFilter: ['style'] });
    }
}

/**
 * Set up keyboard input handlers
 */
function setupInputHandlers() {
    // Listen on window for better responsiveness - allow input even during ready screen
    window.addEventListener('keydown', (e) => {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
            e.stopPropagation();
            keys[e.key] = true;
            
            // Immediate response - change direction instantly (even during ready screen)
            if (pacman) {
                pacman.setDirection(e.key);
            }
        }
        
        // Space bar to pause/resume
        if (e.key === ' ' && gameRunning) {
            e.preventDefault();
            togglePause();
        }
    }, { passive: false });
    
    window.addEventListener('keyup', (e) => {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
            keys[e.key] = false;
        }
    }, { passive: false });
    
    // Also listen on document for better capture
    document.addEventListener('keydown', (e) => {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
            keys[e.key] = true;
            
            if (pacman) {
                pacman.setDirection(e.key);
            }
        }
    }, { passive: false });
    
    // Also listen on canvas for focus
    canvas.addEventListener('keydown', (e) => {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
            keys[e.key] = true;
            
            if (pacman) {
                pacman.setDirection(e.key);
            }
        }
    }, { passive: false });
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
    
    // Allow movement to start immediately, but show ready screen for 2 seconds
    // This way player can start moving right away
    setTimeout(() => {
        readyScreen.style.display = 'none';
        gameRunning = true;
        readyScreenShown = false;
        startTimer();
    }, 2000); // Reduced to 2 seconds
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
    score = 2770; // Set to match the image
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
    updateCherryDisplay();
    
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
    // Start position: near bottom-center, slightly above horizontal midline (row 23, col 14)
    // This should be in an open path (cell type 2 = pellet path)
    const startX = 14 * CELL_SIZE + CELL_SIZE / 2;
    const startY = 23 * CELL_SIZE + CELL_SIZE / 2;
    
    if (!pacman) {
        pacman = new PacMan(startX, startY, 3);
    } else {
        // Reset Pac-Man position to starting position
        pacman.x = startX;
        pacman.y = startY;
        pacman.direction = 0; // Start facing right
    }
    
    // Ensure Pac-Man is in a valid position (not stuck in a wall)
    // If starting position is invalid, try nearby positions
    const radius = pacman.getCollisionRadius();
    if (checkWallCollision(pacman.x, pacman.y, radius)) {
        // Try moving slightly to find a valid position
        pacman.x = 14 * CELL_SIZE + CELL_SIZE / 2;
        pacman.y = 28 * CELL_SIZE + CELL_SIZE / 2; // Try one row up
    }
    pacman.color = [...customizationSettings.color];
    
    // Reset game state
    gameRunning = false; // Don't start until ready screen is done
    gamePaused = false;
    readyScreenShown = false;
    lastTime = performance.now(); // Reset time for delta calculation
    score = 2770; // Set to match the image
    timer = 60;
    cherriesCollected = 1; // Set to match the image
    
    // Reset maze
    resetMaze();
    
    // Initialize cherry display
    initCherryDisplay();
    
    // Update score display to show initial score
    updateScoreDisplay();
    
    // Show game screen
    document.getElementById('game-screen').style.display = 'flex';
    
    // Update canvas size when game starts (after screen is shown)
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
        updateCanvasSize();
        // Force a render to ensure canvas is ready
        render();
        // Focus canvas for keyboard input
        canvas.focus();
        // Start rendering loop
        if (!animationFrame) {
            gameLoop();
        }
    });
    
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
    document.getElementById('score').textContent = score.toString().padStart(4, '0');
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

// Fixed timestep for consistent movement
let lastTime = 0;
const FIXED_DELTA = 1 / 60; // 60 FPS fixed timestep
const SPEED_MULTIPLIER = 80; // Pixels per second

/**
 * Update game state
 */
function update() {
    if (!pacman) return;
    
    // Always update animation, even if game not running
    pacman.update();
    
    // Only allow movement if game is running and not paused
    if (!gameRunning || gamePaused || readyScreenShown) {
        return;
    }
    
    const currentTime = performance.now();
    const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1); // Cap at 100ms
    lastTime = currentTime;
    
    // Handle direction changes based on key presses - immediate response
    if (keys.ArrowRight) {
        pacman.setDirection('ArrowRight');
    } else if (keys.ArrowDown) {
        pacman.setDirection('ArrowDown');
    } else if (keys.ArrowLeft) {
        pacman.setDirection('ArrowLeft');
    } else if (keys.ArrowUp) {
        pacman.setDirection('ArrowUp');
    }
    
    // Calculate movement distance
    const radius = pacman.getCollisionRadius();
    const moveDistance = SPEED_MULTIPLIER * deltaTime;
    
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
            cherriesCollected++;
            updateScoreDisplay();
            updateCherryDisplay();
        }
    }
    // If can't move, just stop (no snapping, no bouncing)
}

/**
 * Render everything
 */
function render() {
    // Debug: Log render calls
    if (!window.renderCount) {
        window.renderCount = 0;
    }
    window.renderCount++;
    if (window.renderCount <= 3) {
        console.log('Render called #' + window.renderCount);
    }
    
    if (!gl) {
        console.error('WebGL context is null!');
        return;
    }
    
    // Check if WebGL is initialized
    // Note: positionLocation can be 0, which is valid! Use -1 for invalid
    if (!program || positionLocation === null || positionLocation === -1) {
        if (window.renderCount < 3) {
            console.warn('WebGL not initialized yet - program:', program, 'positionLocation:', positionLocation);
        }
        return; // WebGL not initialized yet
    }
    
    // Ensure canvas has valid dimensions
    if (canvas.width === 0 || canvas.height === 0) {
        console.warn('Canvas has zero dimensions, updating...');
        updateCanvasSize();
        if (canvas.width === 0 || canvas.height === 0) {
            console.error('Canvas still has zero dimensions after update!');
            return; // Still invalid, skip rendering
        }
    }
    
    // Ensure viewport is set correctly
    gl.viewport(0, 0, canvas.width, canvas.height);
    
    // Clear canvas with black background (classic Pac-Man)
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    // Make sure program is valid before using it
    if (!program) {
        console.error('WebGL program is null!');
        return;
    }
    
    gl.useProgram(program);
    
    // Check for errors after using program
    let glError = gl.getError();
    if (glError !== gl.NO_ERROR && window.renderCount < 3) {
        console.error('WebGL error after useProgram:', glError);
    }
    
    // Set uniforms - transform from maze coordinates to normalized device coordinates
    // Maze is 28*20 = 560 wide, 31*20 = 620 tall
    const mazeWidth = MAZE_WIDTH * CELL_SIZE;
    const mazeHeight = MAZE_HEIGHT * CELL_SIZE;
    
    // SIMPLIFIED: Use canvas coordinates directly for testing
    // The vertex shader does: (position * scale + translation) / resolution * 2.0 - 1.0
    // To use canvas pixel coordinates directly: scale=1, resolution=canvas size
    // This maps: 0 -> -1, canvas.width -> 1
    if (resolutionLocation !== null) gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
    if (translationLocation !== null) gl.uniform2f(translationLocation, 0, 0);
    if (scaleLocation !== null) gl.uniform2f(scaleLocation, 1.0, 1.0);
    if (useTextureLocation !== null) gl.uniform1f(useTextureLocation, 0);
    
    // Check for errors after setting uniforms
    glError = gl.getError();
    if (glError !== gl.NO_ERROR && window.renderCount < 3) {
        console.error('WebGL error after setting uniforms:', glError);
    }
    
    // Enable blending for transparency
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    
    // Create programInfo object
    const programInfo = {
        positionLocation,
        colorLocation,
        resolutionLocation,
        translationLocation,
        scaleLocation
    };
    
    // Draw maze using Maze class
    if (maze) {
        maze.draw(programInfo, canvas, drawRectangle, drawCircle);
    }
    
    // Draw Pac-Man
    if (pacman) {
        drawPacMan();
    }
    
    // Debug: Check for WebGL errors
    const error = gl.getError();
    if (error !== gl.NO_ERROR) {
        console.error('WebGL Error:', error);
    }
}


/**
 * Draw Pac-Man character
 */
function drawPacMan() {
    if (!pacman) return;
    
    // Calculate scale and offset to match maze (same as in drawMaze)
    const mazeWidth = MAZE_WIDTH * CELL_SIZE;
    const mazeHeight = MAZE_HEIGHT * CELL_SIZE;
    const scaleX = canvas.width / mazeWidth;
    const scaleY = canvas.height / mazeHeight;
    const scale = Math.min(scaleX, scaleY);
    const offsetX = (canvas.width - mazeWidth * scale) / 2;
    const offsetY = (canvas.height - mazeHeight * scale) / 2;
    
    // Convert Pac-Man position to canvas coordinates
    const canvasX = offsetX + pacman.x * scale;
    const canvasY = offsetY + pacman.y * scale;
    const scaledRadiusX = pacman.getEffectiveRadius().x * scale;
    const scaledRadiusY = pacman.getEffectiveRadius().y * scale;
    
    const vertices = createPacManVertices(
        canvasX,
        canvasY,
        scaledRadiusX,
        scaledRadiusY,
        pacman.mouthAngle,
        pacman.getRotation(),
        32
    );
    
    if (!vertices || vertices.length === 0) return;
    
    const buffer = createBuffer(gl, vertices);
    
    if (!buffer) return;
    
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    
    gl.uniform4f(colorLocation, pacman.color[0], pacman.color[1], pacman.color[2], pacman.color[3]);
    
    gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 2);
    
    // Clean up buffer
    gl.deleteBuffer(buffer);
}


/**
 * Draw a rectangle
 */
function drawRectangle(x, y, width, height, color) {
    // Check if WebGL is ready (positionLocation can be 0, which is valid)
    if (!gl || !program || positionLocation === null || positionLocation === -1 || colorLocation === null || colorLocation === -1) {
        return; // WebGL not ready
    }
    
    const vertices = setRectangle(gl, x, y, width, height);
    const buffer = createBuffer(gl, vertices);
    
    if (!buffer) {
        console.error('Failed to create buffer for rectangle');
        return;
    }
    
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    
    gl.uniform4f(colorLocation, color[0], color[1], color[2], color[3]);
    
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    
    // Clean up buffer to prevent memory leaks
    gl.deleteBuffer(buffer);
    
    // Check for errors
    const error = gl.getError();
    if (error !== gl.NO_ERROR && window.renderCount < 5) {
        console.error('WebGL error in drawRectangle:', error);
    }
}

/**
 * Draw a circle
 */
function drawCircle(centerX, centerY, radius, color) {
    // Check if WebGL is ready (positionLocation can be 0, which is valid)
    if (!gl || !program || positionLocation === null || positionLocation === -1 || colorLocation === null || colorLocation === -1) {
        return; // WebGL not ready
    }
    
    if (radius <= 0) {
        return; // Invalid radius
    }
    
    const vertices = setCircle(gl, centerX, centerY, radius, 16);
    if (!vertices || vertices.length === 0) {
        return;
    }
    
    const buffer = createBuffer(gl, vertices);
    
    if (!buffer) {
        console.error('Failed to create buffer for circle');
        return;
    }
    
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    
    gl.uniform4f(colorLocation, color[0], color[1], color[2], color[3]);
    
    gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 2);
    
    // Clean up buffer to prevent memory leaks
    gl.deleteBuffer(buffer);
    
    // Check for errors (only log first few to avoid spam)
    const error = gl.getError();
    if (error !== gl.NO_ERROR && window.renderCount < 5) {
        console.error('WebGL error in drawCircle:', error);
    }
}

// Draw heart shape using WebGL
function drawHeartWebGL(glContext, program, size = 20) {
    const width = size;
    const height = size;
    const centerX = width / 2;
    const centerY = height / 2;
    const scale = size / 20;
    
    // Heart shape: two circles at top, triangle at bottom
    const vertices = [];
    
    // Left top circle (simplified as triangle fan)
    const leftCircleX = centerX - 3.5 * scale;
    const leftCircleY = centerY - 3 * scale;
    const circleRadius = 3.5 * scale;
    for (let i = 0; i < 12; i++) {
        const angle1 = (i / 12) * Math.PI * 2;
        const angle2 = ((i + 1) / 12) * Math.PI * 2;
        vertices.push(leftCircleX, leftCircleY);
        vertices.push(leftCircleX + Math.cos(angle1) * circleRadius, leftCircleY + Math.sin(angle1) * circleRadius);
        vertices.push(leftCircleX + Math.cos(angle2) * circleRadius, leftCircleY + Math.sin(angle2) * circleRadius);
    }
    
    // Right top circle
    const rightCircleX = centerX + 3.5 * scale;
    const rightCircleY = centerY - 3 * scale;
    for (let i = 0; i < 12; i++) {
        const angle1 = (i / 12) * Math.PI * 2;
        const angle2 = ((i + 1) / 12) * Math.PI * 2;
        vertices.push(rightCircleX, rightCircleY);
        vertices.push(rightCircleX + Math.cos(angle1) * circleRadius, rightCircleY + Math.sin(angle1) * circleRadius);
        vertices.push(rightCircleX + Math.cos(angle2) * circleRadius, rightCircleY + Math.sin(angle2) * circleRadius);
    }
    
    // Bottom triangle (pointing down) - V shape
    vertices.push(centerX, centerY + 6 * scale);
    vertices.push(centerX - 7 * scale, centerY + 0.5 * scale);
    vertices.push(centerX - 3.5 * scale, centerY - 1 * scale);
    
    vertices.push(centerX, centerY + 6 * scale);
    vertices.push(centerX + 7 * scale, centerY + 0.5 * scale);
    vertices.push(centerX + 3.5 * scale, centerY - 1 * scale);
    
    return vertices;
}

// Draw cherry shape using WebGL
function drawCherryWebGL(glContext, program, size = 20) {
    const width = size;
    const height = size;
    const centerX = width / 2;
    const centerY = height / 2;
    const scale = size / 20;
    
    const vertices = [];
    
    // Left cherry (circle) - red
    const leftCherryX = centerX - 4 * scale;
    const leftCherryY = centerY + 1 * scale;
    const cherryRadius = 4.5 * scale;
    for (let i = 0; i < 16; i++) {
        const angle1 = (i / 16) * Math.PI * 2;
        const angle2 = ((i + 1) / 16) * Math.PI * 2;
        vertices.push(leftCherryX, leftCherryY);
        vertices.push(leftCherryX + Math.cos(angle1) * cherryRadius, leftCherryY + Math.sin(angle1) * cherryRadius);
        vertices.push(leftCherryX + Math.cos(angle2) * cherryRadius, leftCherryY + Math.sin(angle2) * cherryRadius);
    }
    
    // Right cherry (circle) - red
    const rightCherryX = centerX + 4 * scale;
    const rightCherryY = centerY + 1 * scale;
    for (let i = 0; i < 16; i++) {
        const angle1 = (i / 16) * Math.PI * 2;
        const angle2 = ((i + 1) / 16) * Math.PI * 2;
        vertices.push(rightCherryX, rightCherryY);
        vertices.push(rightCherryX + Math.cos(angle1) * cherryRadius, rightCherryY + Math.sin(angle1) * cherryRadius);
        vertices.push(rightCherryX + Math.cos(angle2) * cherryRadius, rightCherryY + Math.sin(angle2) * cherryRadius);
    }
    
    // Stem (small line/triangle) - green
    vertices.push(centerX, centerY - 7 * scale);
    vertices.push(centerX - 1.5 * scale, centerY - 4 * scale);
    vertices.push(centerX + 1.5 * scale, centerY - 4 * scale);
    
    return vertices;
}

// Cache WebGL contexts per canvas to avoid creating too many contexts
const webglContextCache = new WeakMap();

// Initialize WebGL context for a small canvas (cached per canvas)
function initWebGLCanvas(canvasElement) {
    // Check if we already have a context for this canvas
    if (webglContextCache.has(canvasElement)) {
        return webglContextCache.get(canvasElement);
    }
    
    const gl = canvasElement.getContext('webgl');
    if (!gl) {
        console.error('WebGL not supported for UI canvas');
        return null;
    }
    
    // Use the same shader program setup as main game
    const vertexShaderSource = `
        attribute vec2 a_position;
        uniform vec2 u_resolution;
        uniform vec2 u_translation;
        uniform vec2 u_scale;
        
        void main() {
            vec2 position = (a_position + u_translation) * u_scale / u_resolution * 2.0 - 1.0;
            position.y = -position.y;
            gl_Position = vec4(position, 0.0, 1.0);
        }
    `;
    
    const fragmentShaderSource = `
        precision mediump float;
        uniform vec4 u_color;
        
        void main() {
            gl_FragColor = u_color;
        }
    `;
    
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    const program = createProgram(gl, vertexShader, fragmentShader);
    
    if (!program) {
        console.error('Failed to create WebGL program for UI canvas');
        return null;
    }
    
    const positionLocation = gl.getAttribLocation(program, 'a_position');
    const colorLocation = gl.getUniformLocation(program, 'u_color');
    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    const translationLocation = gl.getUniformLocation(program, 'u_translation');
    const scaleLocation = gl.getUniformLocation(program, 'u_scale');
    
    const webglData = {
        gl,
        program,
        positionLocation,
        colorLocation,
        resolutionLocation,
        translationLocation,
        scaleLocation
    };
    
    // Cache the context for this canvas
    webglContextCache.set(canvasElement, webglData);
    
    return webglData;
}

// Render heart on a canvas
function renderHeart(canvasElement, size = 20) {
    const webglData = initWebGLCanvas(canvasElement);
    if (!webglData) return;
    
    const { gl, program, positionLocation, colorLocation, resolutionLocation, translationLocation, scaleLocation } = webglData;
    
    gl.viewport(0, 0, canvasElement.width, canvasElement.height);
    gl.clearColor(0, 0, 0, 0); // Transparent background
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    gl.useProgram(program);
    
    const vertices = drawHeartWebGL(gl, program, size);
    const buffer = createBuffer(gl, vertices);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    
    gl.uniform2f(resolutionLocation, canvasElement.width, canvasElement.height);
    gl.uniform2f(translationLocation, 0, 0);
    gl.uniform2f(scaleLocation, 1, 1);
    gl.uniform4f(colorLocation, 1.0, 0.0, 0.0, 1.0); // Red color
    
    gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 2);
    
    gl.deleteBuffer(buffer);
}

// Render cherry on a canvas
function renderCherry(canvasElement, size = 20) {
    const webglData = initWebGLCanvas(canvasElement);
    if (!webglData) return;
    
    const { gl, program, positionLocation, colorLocation, resolutionLocation, translationLocation, scaleLocation } = webglData;
    
    gl.viewport(0, 0, canvasElement.width, canvasElement.height);
    gl.clearColor(0, 0, 0, 0); // Transparent background
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    gl.useProgram(program);
    
    // Draw cherries (red)
    const cherryVertices = [];
    // Left cherry
    const leftCherryX = size / 2 - 4 * (size / 20);
    const leftCherryY = size / 2 + 1 * (size / 20);
    const cherryRadius = 4.5 * (size / 20);
    for (let i = 0; i < 16; i++) {
        const angle1 = (i / 16) * Math.PI * 2;
        const angle2 = ((i + 1) / 16) * Math.PI * 2;
        cherryVertices.push(leftCherryX, leftCherryY);
        cherryVertices.push(leftCherryX + Math.cos(angle1) * cherryRadius, leftCherryY + Math.sin(angle1) * cherryRadius);
        cherryVertices.push(leftCherryX + Math.cos(angle2) * cherryRadius, leftCherryY + Math.sin(angle2) * cherryRadius);
    }
    // Right cherry
    const rightCherryX = size / 2 + 4 * (size / 20);
    const rightCherryY = size / 2 + 1 * (size / 20);
    for (let i = 0; i < 16; i++) {
        const angle1 = (i / 16) * Math.PI * 2;
        const angle2 = ((i + 1) / 16) * Math.PI * 2;
        cherryVertices.push(rightCherryX, rightCherryY);
        cherryVertices.push(rightCherryX + Math.cos(angle1) * cherryRadius, rightCherryY + Math.sin(angle1) * cherryRadius);
        cherryVertices.push(rightCherryX + Math.cos(angle2) * cherryRadius, rightCherryY + Math.sin(angle2) * cherryRadius);
    }
    
    // Draw stem (green)
    const stemVertices = [];
    const centerX = size / 2;
    const centerY = size / 2;
    const scale = size / 20;
    stemVertices.push(centerX, centerY - 7 * scale);
    stemVertices.push(centerX - 1.5 * scale, centerY - 4 * scale);
    stemVertices.push(centerX + 1.5 * scale, centerY - 4 * scale);
    
    // Draw cherries (red)
    const cherryBuffer = createBuffer(gl, cherryVertices);
    gl.bindBuffer(gl.ARRAY_BUFFER, cherryBuffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2f(resolutionLocation, canvasElement.width, canvasElement.height);
    gl.uniform2f(translationLocation, 0, 0);
    gl.uniform2f(scaleLocation, 1, 1);
    gl.uniform4f(colorLocation, 1.0, 0.0, 0.0, 1.0); // Red color
    gl.drawArrays(gl.TRIANGLES, 0, cherryVertices.length / 2);
    gl.deleteBuffer(cherryBuffer);
    
    // Draw stem (green)
    const stemBuffer = createBuffer(gl, stemVertices);
    gl.bindBuffer(gl.ARRAY_BUFFER, stemBuffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.uniform4f(colorLocation, 0.0, 0.8, 0.0, 1.0); // Green color
    gl.drawArrays(gl.TRIANGLES, 0, stemVertices.length / 2);
    gl.deleteBuffer(stemBuffer);
}

// Initialize lives display with red hearts using WebGL
function initLives() {
    const livesContainer = document.getElementById('lives');
    const lives = 2; // 2 lives remaining
    
    livesContainer.innerHTML = '';
    for (let i = 0; i < lives; i++) {
        const lifeIcon = document.createElement('canvas');
        lifeIcon.className = 'life-icon';
        lifeIcon.width = 24;
        lifeIcon.height = 24;
        lifeIcon.style.width = 'clamp(18px, 2vw, 24px)';
        lifeIcon.style.height = 'clamp(18px, 2vw, 24px)';
        livesContainer.appendChild(lifeIcon);
        
        // Render heart using WebGL
        renderHeart(lifeIcon, 20);
    }
}

// Update cherry display
function updateCherryDisplay() {
    const bonusFruit = document.getElementById('bonus-fruit');
    if (bonusFruit) {
        // Check if canvas already exists, reuse it instead of creating new one
        let cherryCanvas = bonusFruit.querySelector('canvas');
        let countSpan = bonusFruit.querySelector('span');
        
        if (!cherryCanvas) {
            // Create canvas for cherry only if it doesn't exist
            cherryCanvas = document.createElement('canvas');
            cherryCanvas.width = 30;
            cherryCanvas.height = 30;
            cherryCanvas.style.width = 'clamp(20px, 2.5vw, 30px)';
            cherryCanvas.style.height = 'clamp(20px, 2.5vw, 30px)';
            cherryCanvas.style.display = 'inline-block';
            bonusFruit.appendChild(cherryCanvas);
            
            // Render cherry using WebGL (only once when created)
            renderCherry(cherryCanvas, 25);
        }
        
        // Update count text
        if (!countSpan) {
            countSpan = document.createElement('span');
            countSpan.style.color = 'white';
            countSpan.style.fontSize = 'clamp(16px, 2vw, 24px)';
            countSpan.style.marginLeft = '5px';
            bonusFruit.appendChild(countSpan);
        }
        countSpan.textContent = cherriesCollected;
    }
}

// Initialize cherry display
function initCherryDisplay() {
    cherriesCollected = 0;
    updateCherryDisplay();
}

// Initialize everything when page loads
initLives();
initCherryDisplay();
initStartScreen();
initGame();
