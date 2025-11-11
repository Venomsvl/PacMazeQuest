/**
 * Pac-Man Character Module
 * Handles Pac-Man rendering, animation, and customization
 */

/**
 * Creates vertices for a Pac-Man shape (circle/ellipse with mouth opening)
 * @param {number} centerX - X coordinate of center
 * @param {number} centerY - Y coordinate of center
 * @param {number} radiusX - Horizontal radius of Pac-Man
 * @param {number} radiusY - Vertical radius of Pac-Man
 * @param {number} mouthAngle - Angle of mouth opening in radians (0 = closed, PI/3 = open)
 * @param {number} rotation - Rotation angle in radians (0 = right, PI/2 = down, PI = left, 3*PI/2 = up)
 * @param {number} segments - Number of segments for the circle
 * @returns {Array} Array of vertices
 */
export function createPacManVertices(centerX, centerY, radiusX, radiusY, mouthAngle, rotation, segments = 32) {
    const vertices = [];
    const startAngle = rotation + mouthAngle / 2;
    const endAngle = rotation + 2 * Math.PI - mouthAngle / 2;
    
    // Add center point
    vertices.push(centerX, centerY);
    
    // Create arc from start to end angle
    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const angle = startAngle + t * (endAngle - startAngle);
        // Use ellipse formula for different shapes
        const x = centerX + Math.cos(angle) * radiusX;
        const y = centerY + Math.sin(angle) * radiusY;
        
        if (i === 0) {
            // First point on the arc
            vertices.push(centerX, centerY);
            vertices.push(x, y);
        } else {
            // Connect to previous point
            const prevT = (i - 1) / segments;
            const prevAngle = startAngle + prevT * (endAngle - startAngle);
            const prevX = centerX + Math.cos(prevAngle) * radiusX;
            const prevY = centerY + Math.sin(prevAngle) * radiusY;
            
            vertices.push(prevX, prevY);
            vertices.push(centerX, centerY);
            vertices.push(x, y);
        }
    }
    
    return vertices;
}

/**
 * Pac-Man class to manage character state and rendering
 */
export class PacMan {
    constructor(x, y, radius = 3) { // Classic Pac-Man size (3 pixels radius for 8px cells)
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.direction = 0; // 0 = right, 1 = down, 2 = left, 3 = up
        this.mouthAngle = Math.PI / 3; // Mouth opening angle
        this.mouthAnimation = 0; // Animation counter for mouth opening/closing
        this.speed = 80; // Movement speed (pixels per second) - will be multiplied by deltaTime
        
        // Customization properties
        this.color = [1.0, 1.0, 0.0, 1.0]; // Yellow (RGBA)
        this.size = 1.0; // Size multiplier
        this.shape = 'normal'; // 'normal', 'wide', 'tall'
    }
    
    /**
     * Update Pac-Man animation
     */
    update() {
        // Animate mouth opening/closing - faster animation
        this.mouthAnimation += 0.3;
        // Mouth opens from 0 (closed) to PI/2 (fully open)
        this.mouthAngle = (Math.PI / 2) * (0.3 + 0.7 * (1 + Math.sin(this.mouthAnimation)) / 2);
    }
    
    /**
     * Get rotation angle based on direction
     */
    getRotation() {
        const rotations = [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2];
        return rotations[this.direction];
    }
    
    /**
     * Get effective radius based on size and shape
     * Returns both X and Y radii for ellipse rendering
     */
    getEffectiveRadius() {
        const baseRadius = this.radius * this.size;
        
        if (this.shape === 'wide') {
            return { x: baseRadius * 1.3, y: baseRadius * 0.9 };
        } else if (this.shape === 'tall') {
            return { x: baseRadius * 0.9, y: baseRadius * 1.3 };
        } else {
            return { x: baseRadius, y: baseRadius };
        }
    }
    
    /**
     * Get single radius value for collision detection (uses average)
     */
    getCollisionRadius() {
        const radii = this.getEffectiveRadius();
        return (radii.x + radii.y) / 2;
    }
    
    /**
     * Set direction based on arrow key
     */
    setDirection(key) {
        const directions = {
            'ArrowRight': 0,
            'ArrowDown': 1,
            'ArrowLeft': 2,
            'ArrowUp': 3
        };
        
        if (directions.hasOwnProperty(key)) {
            this.direction = directions[key];
        }
    }
    
    /**
     * Get next position based on current direction
     * @param {number} distance - Distance to move
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
     * Move Pac-Man to new position
     */
    move(x, y) {
        this.x = x;
        this.y = y;
    }
    
    /**
     * Get bounding box for collision detection
     */
    getBoundingBox() {
        const radius = this.getCollisionRadius();
        return {
            left: this.x - radius,
            right: this.x + radius,
            top: this.y - radius,
            bottom: this.y + radius
        };
    }
}

