import { MAZE_LAYOUT, CELL_SIZE, MAZE_WIDTH, MAZE_HEIGHT } from './maze.js';

/**
 * Red Dot Module
 * Handles the red dot (win condition) placement and rendering
 */

// Find a valid empty space in the maze for the red dot
function findValidPosition() {
    const validPositions = [];
    
    // Find all empty spaces (cell type 0 or 2 for pellet paths)
    for (let row = 0; row < MAZE_HEIGHT; row++) {
        for (let col = 0; col < MAZE_WIDTH; col++) {
            const cellType = MAZE_LAYOUT[row][col];
            // Allow placing on empty spaces or pellet paths (but not walls, tunnels, or ghost house)
            if (cellType === 0 || cellType === 2) {
                validPositions.push({ row, col });
            }
        }
    }
    
    // Pick a random valid position
    if (validPositions.length > 0) {
        const randomIndex = Math.floor(Math.random() * validPositions.length);
        const pos = validPositions[randomIndex];
        return {
            x: pos.col * CELL_SIZE + CELL_SIZE / 2,
            y: pos.row * CELL_SIZE + CELL_SIZE / 2
        };
    }
    
    // Fallback: center of maze
    return {
        x: (MAZE_WIDTH / 2) * CELL_SIZE,
        y: (MAZE_HEIGHT / 2) * CELL_SIZE
    };
}

// Red dot position (in maze coordinates)
let redDotPosition = findValidPosition();

/**
 * Get the red dot position
 * @returns {Object} {x, y} position in maze coordinates
 */
export function getRedDotPosition() {
    return { ...redDotPosition };
}

/**
 * Reset red dot to a new random position
 */
export function resetRedDot() {
    redDotPosition = findValidPosition();
}

/**
 * Check if Pac-Man has collected the red dot
 * @param {number} pacmanX - Pac-Man X coordinate
 * @param {number} pacmanY - Pac-Man Y coordinate
 * @param {number} pacmanRadius - Pac-Man collision radius
 * @returns {boolean} True if red dot is collected
 */
export function checkRedDotCollection(pacmanX, pacmanY, pacmanRadius) {
    const dx = pacmanX - redDotPosition.x;
    const dy = pacmanY - redDotPosition.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const redDotRadius = CELL_SIZE * 0.2; // Red dot radius
    return distance < (pacmanRadius + redDotRadius);
}
