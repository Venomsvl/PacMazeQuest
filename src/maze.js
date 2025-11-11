// Classic Pac-Man maze layout - exact match to arcade version
// 0 = empty space, 1 = wall, 2 = pellet, 3 = power pellet, 4 = tunnel, 5 = ghost house

export const MAZE_LAYOUT = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
    [1,3,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,3,1],
    [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,2,1],
    [1,2,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,2,1],
    [1,2,2,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,2,2,1],
    [1,1,1,1,1,1,2,1,1,1,1,1,0,1,1,0,1,1,1,1,1,2,1,1,1,1,1,1],
    [0,0,0,0,0,1,2,1,1,1,1,1,0,1,1,0,1,1,1,1,1,2,1,0,0,0,0,0],
    [0,0,0,0,0,1,2,1,1,0,0,0,0,0,0,0,0,0,0,1,1,2,1,0,0,0,0,0],
    [0,0,0,0,0,1,2,1,1,0,1,1,1,5,5,1,1,1,0,1,1,2,1,0,0,0,0,0],
    [1,1,1,1,1,1,2,1,1,0,1,5,5,5,5,5,5,1,0,1,1,2,1,1,1,1,1,1],
    [4,0,0,0,0,0,2,0,0,0,1,5,5,5,5,5,5,1,0,0,0,2,0,0,0,0,0,4],
    [1,1,1,1,1,1,2,1,1,0,1,5,5,5,5,5,5,1,0,1,1,2,1,1,1,1,1,1],
    [0,0,0,0,0,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,0,0,0,0,0],
    [0,0,0,0,0,1,2,1,1,0,0,0,0,0,0,0,0,0,0,1,1,2,1,0,0,0,0,0],
    [0,0,0,0,0,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,0,0,0,0,0],
    [1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,1,1,1,1,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
    [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
    [1,3,2,2,1,1,2,2,2,2,2,2,2,0,0,2,2,2,2,2,2,2,1,1,2,2,3,1],
    [1,1,1,2,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,2,1,1,1],
    [1,1,1,2,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,2,1,1,1],
    [1,2,2,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,2,2,1],
    [1,2,1,1,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,1,1,2,1],
    [1,2,1,1,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,1,1,2,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

export const CELL_SIZE = 8; // Classic Pac-Man cell size (8x8 pixels per cell)
export const MAZE_WIDTH = MAZE_LAYOUT[0].length;
export const MAZE_HEIGHT = MAZE_LAYOUT.length;

const ORIGINAL_LAYOUT = MAZE_LAYOUT.map(row => [...row]);

export function resetMaze() {
    for (let row = 0; row < MAZE_HEIGHT; row++) {
        for (let col = 0; col < MAZE_WIDTH; col++) {
            MAZE_LAYOUT[row][col] = ORIGINAL_LAYOUT[row][col];
        }
    }
}

export class Maze {
    constructor(gl) {
        this.gl = gl;
    }

    draw(programInfo, canvas, drawRectangle, drawCircle) {
        // Classic Pac-Man colors
        const pelletColor = [1.0, 0.75, 0.8, 1.0]; // Pink
        const powerPelletColor = [1.0, 0.75, 0.8, 1.0]; // Pink

        // Calculate scale to fit canvas while maintaining aspect ratio
        const mazeWidth = MAZE_WIDTH * CELL_SIZE;
        const mazeHeight = MAZE_HEIGHT * CELL_SIZE;
        const scaleX = canvas.width / mazeWidth;
        const scaleY = canvas.height / mazeHeight;
        const scale = Math.min(scaleX, scaleY) * 0.95; // Use 95% to leave some margin

        // Center the maze
        const offsetX = (canvas.width - mazeWidth * scale) / 2;
        const offsetY = (canvas.height - mazeHeight * scale) / 2;

        // Wall thickness - thin blue outlines like classic Pac-Man
        const outlineWidth = Math.max(1.5 * scale, 0.5);
        const blueColor = [0.0, 0.5, 1.0, 1.0]; // Bright blue outline

        // Draw walls as thin blue outlines (classic style)
        for (let row = 0; row < MAZE_HEIGHT; row++) {
            for (let col = 0; col < MAZE_WIDTH; col++) {
                const cell = MAZE_LAYOUT[row][col];
                const x = offsetX + (col * CELL_SIZE) * scale;
                const y = offsetY + (row * CELL_SIZE) * scale;
                const size = CELL_SIZE * scale;

                if (cell === 1) {
                    // Draw wall outlines only where walls meet empty spaces
                    const topIsWall = row > 0 && MAZE_LAYOUT[row - 1][col] === 1;
                    const bottomIsWall = row < MAZE_HEIGHT - 1 && MAZE_LAYOUT[row + 1][col] === 1;
                    const leftIsWall = col > 0 && MAZE_LAYOUT[row][col - 1] === 1;
                    const rightIsWall = col < MAZE_WIDTH - 1 && MAZE_LAYOUT[row][col + 1] === 1;

                    // Draw outlines only on edges facing empty spaces
                    if (!topIsWall) drawRectangle(x, y, size, outlineWidth, blueColor);
                    if (!bottomIsWall) drawRectangle(x, y + size - outlineWidth, size, outlineWidth, blueColor);
                    if (!leftIsWall) drawRectangle(x, y, outlineWidth, size, blueColor);
                    if (!rightIsWall) drawRectangle(x + size - outlineWidth, y, outlineWidth, size, blueColor);
                } 
                else if (cell === 2) {
                    // Draw pellet - small white/pink dot
                    const pelletRadius = Math.max(1 * scale, 0.5);
                    drawCircle(x + size / 2, y + size / 2, pelletRadius, pelletColor);
                } 
                else if (cell === 3) {
                    // Draw power pellet - larger white/pink dot
                    const powerRadius = Math.max(3 * scale, 1.5);
                    drawCircle(x + size / 2, y + size / 2, powerRadius, powerPelletColor);
                }
            }
        }

        // Draw ghost house
        this.drawGhostHouse(scale, offsetX, offsetY, blueColor, outlineWidth, drawRectangle);
    }

    drawGhostHouse(scale = 1, offsetX = 0, offsetY = 0, outlineColor, outlineWidth, drawRectangle) {
        const cellSize = CELL_SIZE * scale;
        
        // Draw ghost house walls as thin blue outlines
        // Left wall
        drawRectangle(offsetX + 11 * cellSize, offsetY + 12 * cellSize, outlineWidth, 3 * cellSize, outlineColor);
        // Right wall
        drawRectangle(offsetX + 16 * cellSize, offsetY + 12 * cellSize, outlineWidth, 3 * cellSize, outlineColor);
        // Bottom wall
        drawRectangle(offsetX + 11 * cellSize, offsetY + 15 * cellSize, 6 * cellSize, outlineWidth, outlineColor);
        // Top left wall
        drawRectangle(offsetX + 11 * cellSize, offsetY + 12 * cellSize, 2 * cellSize, outlineWidth, outlineColor);
        // Top right wall
        drawRectangle(offsetX + 15 * cellSize, offsetY + 12 * cellSize, 2 * cellSize, outlineWidth, outlineColor);
    }
}
