/**
 * Game Logic Module
 * Handles collision detection and game state
 */

import { MAZE_LAYOUT, CELL_SIZE, MAZE_WIDTH, MAZE_HEIGHT } from './maze.js';

/**
 * Check if a position collides with a wall
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {number} radius - Collision radius
 * @returns {boolean} True if collision detected
 */
export function checkWallCollision(x, y, radius) {
    // Use a smaller collision radius for more forgiving collision detection
    const collisionRadius = radius * 0.7;
    
    // Convert pixel coordinates to grid coordinates
    const gridX = Math.floor(x / CELL_SIZE);
    const gridY = Math.floor(y / CELL_SIZE);
    
    // Check center point and a few key points
    const checkPoints = [
        { x: x, y: y }, // center (most important)
        { x: x + collisionRadius, y: y }, // right
        { x: x - collisionRadius, y: y }, // left
        { x: x, y: y + collisionRadius }, // down
        { x: x, y: y - collisionRadius }, // up
    ];
    
    for (const point of checkPoints) {
        const gX = Math.floor(point.x / CELL_SIZE);
        const gY = Math.floor(point.y / CELL_SIZE);
        
        // Check bounds (allow tunnel wrapping)
        if (gY >= 14 && gY < 15) {
            // In tunnel row, allow wrapping
            if (gX < 0 || gX >= MAZE_WIDTH) {
                continue; // Allow tunnel wrapping
            }
        } else if (gX < 0 || gX >= MAZE_WIDTH || gY < 0 || gY >= MAZE_HEIGHT) {
            return true; // Out of bounds
        }
        
        // Check if cell is a wall
        if (MAZE_LAYOUT[gY] && MAZE_LAYOUT[gY][gX] === 1) {
            return true; // Collision with wall
        }
    }
    
    return false;
}

/**
 * Check if Pac-Man can move in a given direction
 * @param {number} x - Current X coordinate
 * @param {number} y - Current Y coordinate
 * @param {number} radius - Collision radius
 * @param {number} direction - Direction (0=right, 1=down, 2=left, 3=up)
 * @param {number} speed - Movement speed
 * @returns {boolean} True if movement is allowed
 */
export function canMove(x, y, radius, direction, speed) {
    const dx = [speed, 0, -speed, 0][direction];
    const dy = [0, speed, 0, -speed][direction];
    const newX = x + dx;
    const newY = y + dy;
    
    return !checkWallCollision(newX, newY, radius);
}

/**
 * Handle tunnel wrapping (left/right tunnels)
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @returns {Object} New coordinates after wrapping
 */
export function handleTunnelWrapping(x, y) {
    let newX = x;
    let newY = y;
    
    // Left tunnel (row 14, column 0)
    if (y >= 14 * CELL_SIZE && y < 15 * CELL_SIZE && x < 0) {
        newX = MAZE_WIDTH * CELL_SIZE;
    }
    
    // Right tunnel (row 14, column 27)
    if (y >= 14 * CELL_SIZE && y < 15 * CELL_SIZE && x > MAZE_WIDTH * CELL_SIZE) {
        newX = 0;
    }
    
    return { x: newX, y: newY };
}

/**
 * Get cell type at a given position
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @returns {number} Cell type (0=empty, 1=wall, 2=pellet, 3=power pellet, etc.)
 */
export function getCellType(x, y) {
    const gridX = Math.floor(x / CELL_SIZE);
    const gridY = Math.floor(y / CELL_SIZE);
    
    if (gridX < 0 || gridX >= MAZE_WIDTH || gridY < 0 || gridY >= MAZE_HEIGHT) {
        return 1; // Wall (out of bounds)
    }
    
    return MAZE_LAYOUT[gridY][gridX];
}

/**
 * Remove pellet at a given position
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @returns {number} Points earned (10 for pellet, 50 for power pellet, 0 for nothing)
 */
export function collectPellet(x, y) {
    const gridX = Math.floor(x / CELL_SIZE);
    const gridY = Math.floor(y / CELL_SIZE);
    
    if (gridX < 0 || gridX >= MAZE_WIDTH || gridY < 0 || gridY >= MAZE_HEIGHT) {
        return 0;
    }
    
    const cellType = MAZE_LAYOUT[gridY][gridX];
    
    if (cellType === 2) {
        // Regular pellet
        MAZE_LAYOUT[gridY][gridX] = 0;
        return 10;
    } else if (cellType === 3) {
        // Power pellet
        MAZE_LAYOUT[gridY][gridX] = 0;
        return 50;
    }
    
    return 0;
}

