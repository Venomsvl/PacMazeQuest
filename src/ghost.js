/**
 * Ghost Module
 * Handles ghost rendering, movement, and AI
 */

import { CELL_SIZE, MAZE_WIDTH, MAZE_HEIGHT, MAZE_LAYOUT } from './maze.js';
import { checkWallCollision, canMove, handleTunnelWrapping } from './game.js';

/**
 * Create vertices for a ghost shape (semi-circle body with wavy bottom and feet)
 */
export function createGhostVertices(centerX, centerY, radius, segments = 32) {
    const vertices = [];
    
    // Main body - semi-circle (top half)
    const bodyStartAngle = Math.PI; // Start from left
    const bodyEndAngle = 0; // End at right (top half)
    
    // Add center point for body
    vertices.push(centerX, centerY);
    
    // Create semi-circle for body
    for (let i = 0; i <= segments / 2; i++) {
        const t = i / (segments / 2);
        const angle = bodyStartAngle + t * (bodyEndAngle - bodyStartAngle);
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        
        if (i === 0) {
            vertices.push(centerX, centerY);
            vertices.push(x, y);
        } else {
            const prevT = (i - 1) / (segments / 2);
            const prevAngle = bodyStartAngle + prevT * (bodyEndAngle - bodyStartAngle);
            const prevX = centerX + Math.cos(prevAngle) * radius;
            const prevY = centerY + Math.sin(prevAngle) * radius;
            
            vertices.push(prevX, prevY);
            vertices.push(centerX, centerY);
            vertices.push(x, y);
        }
    }
    
    // Wavy bottom - create 3 "feet" using small circles
    const footRadius = radius * 0.4;
    const footY = centerY - radius * 0.3;
    
    // Helper function to create circle vertices (without needing gl parameter)
    function createCircleVertices(cx, cy, r, segs = 16) {
        const circleVerts = [];
        for (let i = 0; i <= segs; i++) {
            const angle = (i / segs) * Math.PI * 2;
            const x = cx + Math.cos(angle) * r;
            const y = cy + Math.sin(angle) * r;
            if (i > 0) {
                circleVerts.push(cx, cy);
                circleVerts.push(x, y);
                const nextAngle = ((i - 1) / segs) * Math.PI * 2;
                const prevX = cx + Math.cos(nextAngle) * r;
                const prevY = cy + Math.sin(nextAngle) * r;
                circleVerts.push(prevX, prevY);
            }
        }
        return circleVerts;
    }
    
    // Left foot
    const leftFootX = centerX - radius * 0.5;
    const leftFootVertices = createCircleVertices(leftFootX, footY, footRadius, 16);
    vertices.push(...leftFootVertices);
    
    // Center foot
    const centerFootX = centerX;
    const centerFootVertices = createCircleVertices(centerFootX, footY, footRadius, 16);
    vertices.push(...centerFootVertices);
    
    // Right foot
    const rightFootX = centerX + radius * 0.5;
    const rightFootVertices = createCircleVertices(rightFootX, footY, footRadius, 16);
    vertices.push(...rightFootVertices);
    
    // Fill in the gaps between body and feet with triangles
    // Left gap
    vertices.push(centerX - radius, centerY - radius * 0.3);
    vertices.push(leftFootX, footY);
    vertices.push(centerX - radius * 0.7, centerY - radius * 0.3);
    
    // Right gap
    vertices.push(centerX + radius, centerY - radius * 0.3);
    vertices.push(rightFootX, footY);
    vertices.push(centerX + radius * 0.7, centerY - radius * 0.3);
    
    return vertices;
}

/**
 * Ghost class to manage ghost state, movement, and rendering
 */
export class Ghost {
    constructor(x, y, color = [1.0, 0.0, 0.0, 1.0]) { // Default red
        this.x = x;
        this.y = y;
        this.color = color;
        this.radius = CELL_SIZE * 0.4; // Slightly smaller than Pac-Man
        this.direction = 0; // 0 = right, 1 = down, 2 = left, 3 = up
        this.speed = 60; // Slightly slower than Pac-Man
        this.targetX = x;
        this.targetY = y;
        this.lastDirectionChange = 0;
        this.directionChangeInterval = 100; // Change direction more frequently for better tracking
    }
    
    /**
     * Update ghost AI and movement
     * @param {number} deltaTime - Time since last update in seconds
     * @param {Object} pacman - Pac-Man object to chase
     */
    update(deltaTime, pacman) {
        const currentTime = Date.now();
        const moveDistance = this.speed * deltaTime;
        const radius = this.radius;
        
        // More aggressive AI: Always try to move towards Pac-Man
        if (pacman) {
            const dx = pacman.x - this.x;
            const dy = pacman.y - this.y;
            
            // Calculate distance to Pac-Man
            const distanceToPacman = Math.sqrt(dx * dx + dy * dy);
            
            // Check direction more frequently when close to Pac-Man
            const shouldReevaluate = currentTime - this.lastDirectionChange > this.directionChangeInterval;
            //const isCloseToPacman = distanceToPacman < CELL_SIZE * 10; // Within 10 cells
            
            if (distanceToPacman == 0 ) {
                // Find the best direction towards Pac-Man that's valid
                const directions = [
                    { dir: 0, dx: 1, dy: 0, priority: dx > 0 ? Math.abs(dx) : -1 },  // Right
                    { dir: 1, dx: 0, dy: 1, priority: dy > 0 ? Math.abs(dy) : -1 },  // Down
                    { dir: 2, dx: -1, dy: 0, priority: dx < 0 ? Math.abs(dx) : -1 }, // Left
                    { dir: 3, dx: 0, dy: -1, priority: dy < 0 ? Math.abs(dy) : -1 }  // Up
                ];
                
                // Sort by priority (highest first)
                directions.sort((a, b) => b.priority - a.priority);
                
                // Try directions towards Pac-Man first
                let directionChosen = false;
                for (const dirInfo of directions) {
                    if (dirInfo.priority > 0 && canMove(this.x, this.y, radius, dirInfo.dir, moveDistance)) {
                        this.direction = dirInfo.dir;
                        directionChosen = true;
                        break;
                    }
                }
                
                // If no valid direction towards Pac-Man, try any valid direction
                if (!directionChosen) {
                    const allDirections = [0, 1, 2, 3];
                    const shuffled = allDirections.sort(() => Math.random() - 0.5);
                    for (const dir of shuffled) {
                        if (canMove(this.x, this.y, radius, dir, moveDistance)) {
                            this.direction = dir;
                            directionChosen = true;
                            break;
                        }
                    }
                }
                
                this.lastDirectionChange = currentTime;
                // Faster updates when close to Pac-Man
                this.directionChangeInterval = isCloseToPacman ? 50 + Math.random() * 100 : 100 + Math.random() * 200;
            }
        } else {
            // No Pac-Man, move randomly but less frequently
            if (currentTime - this.lastDirectionChange > this.directionChangeInterval) {
                const directions = [0, 1, 2, 3];
                const shuffled = directions.sort(() => Math.random() - 0.5);
                for (const dir of shuffled) {
                    if (canMove(this.x, this.y, radius, dir, moveDistance)) {
                        this.direction = dir;
                        break;
                    }
                }
                this.lastDirectionChange = currentTime;
                this.directionChangeInterval = 200 + Math.random() * 300;
            }
        }
        
        // Try to move in current direction
        if (canMove(this.x, this.y, radius, this.direction, moveDistance)) {
            const nextPos = this.getNextPosition(moveDistance);
            const wrappedPos = handleTunnelWrapping(nextPos.x, nextPos.y);
            this.x = wrappedPos.x;
            this.y = wrappedPos.y;
        } else {
            // Can't move in current direction, immediately try to find a new valid direction
            const directions = [0, 1, 2, 3];
            const shuffled = directions.sort(() => Math.random() - 0.5);
            
            for (const dir of shuffled) {
                if (canMove(this.x, this.y, radius, dir, moveDistance)) {
                    this.direction = dir;
                    const nextPos = this.getNextPosition(moveDistance);
                    const wrappedPos = handleTunnelWrapping(nextPos.x, nextPos.y);
                    this.x = wrappedPos.x;
                    this.y = wrappedPos.y;
                    // Reset direction change timer to allow immediate re-evaluation
                    this.lastDirectionChange = currentTime - this.directionChangeInterval;
                    break;
                }
            }
        }
    }
    
    /**
     * Get next position based on current direction
     */
    getNextPosition(distance) {
        const dx = [distance, 0, -distance, 0][this.direction];
        const dy = [0, distance, 0, -distance][this.direction];
        return {
            x: this.x + dx,
            y: this.y + dy
        };
    }
    
    /**
     * Check collision with Pac-Man
     */
    checkCollision(pacmanX, pacmanY, pacmanRadius) {
        const dx = pacmanX - this.x;
        const dy = pacmanY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (pacmanRadius + this.radius);
    }
    
    /**
     * Get collision radius
     */
    getCollisionRadius() {
        return this.radius;
    }
}

/**
 * Create initial ghosts array based on difficulty
 */
export function createGhosts(difficulty) {
    const ghosts = [];
    
    // Only create ghosts for medium and hard difficulty
    if (difficulty === 'easy') {
        return ghosts;
    }
    
    // Spawn ghosts in valid paths (cell type 2 = pellet paths, guaranteed to be open)
    // Using positions that are definitely valid paths in the maze
    const spawnPositions = [
        { x: 6 * CELL_SIZE + CELL_SIZE / 2, y: 14 * CELL_SIZE + CELL_SIZE / 2 },   // Row 14, col 6 (pellet path)
        { x: 21 * CELL_SIZE + CELL_SIZE / 2, y: 14 * CELL_SIZE + CELL_SIZE / 2 },  // Row 14, col 21 (pellet path)
        { x: 6 * CELL_SIZE + CELL_SIZE / 2, y: 15 * CELL_SIZE + CELL_SIZE / 2 },   // Row 15, col 6 (pellet path)
        { x: 21 * CELL_SIZE + CELL_SIZE / 2, y: 15 * CELL_SIZE + CELL_SIZE / 2 }   // Row 15, col 21 (pellet path)
    ];
    
    // Ghost colors (classic Pac-Man colors)
    const ghostColors = [
        [1.0, 0.0, 0.0, 1.0],   // Red
        [1.0, 0.5, 0.0, 1.0],   // Orange
        [1.0, 0.0, 1.0, 1.0],   // Pink
        [0.0, 1.0, 1.0, 1.0]    // Cyan
    ];
    
    // Number of ghosts based on difficulty
    const numGhosts = difficulty === 'medium' ? 2 : 4;
    
    // Create ghosts at valid spawn positions
    for (let i = 0; i < numGhosts; i++) {
        const spawnPos = spawnPositions[i % spawnPositions.length];
        const ghost = new Ghost(
            spawnPos.x,
            spawnPos.y,
            ghostColors[i % ghostColors.length]
        );
        ghosts.push(ghost);
    }
    
    return ghosts;
}
