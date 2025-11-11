# Pac-Man WebGL Game

A classic Pac-Man game built with WebGL.

## Quick Start

### Option 1: Using Node.js Server (Recommended)
```bash
node server.js
```
Then open http://localhost:3000 in your browser.

### Option 2: Using Python (if Node.js is slow)
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```
Then open http://localhost:8000 in your browser.

### Option 3: Using PHP (if available)
```bash
php -S localhost:8000
```
Then open http://localhost:8000 in your browser.

## Controls

- **Arrow Keys**: Move Pac-Man
- **Space**: Pause/Resume

## Features

- Classic Pac-Man maze
- Smooth movement
- Pellet collection
- Score tracking
- Timer-based gameplay


# 🎮 PacMazeQuest

A WebGL-based Pac-Man Maze Game demonstrating core computer graphics concepts through interactive 2D design, movement, and gameplay logic.

---

## 🧩 Overview

**PacMazeQuest** is a computer graphics project built using **WebGL**, inspired by the classic Pac-Man arcade game.  
Players design their own Pac-Man character, navigate through a maze, and collect a red ball while avoiding walls and racing against time.

This project demonstrates:
- 2D graphical primitives and color filling
- Keyboard-based interactivity
- Collision detection
- Timer and win/loss logic
- Optional difficulty levels and scoring (bonus)

---

## 🕹️ Game Strategy

1. **Objective:** Navigate Pac-Man through a maze to find and collect the red ball.  
2. **Movement:** Players control Pac-Man using arrow keys (↑, ↓, ←, →).  
3. **Challenge:** Avoid maze walls and reach the ball efficiently.  
4. **Win Condition:** Successfully collide with the red ball to win.  
5. **Lose Condition:**  
   - Time expires (60 seconds).  
   - Player gets stuck and cannot reach the ball.  
6. **Bonus Features:**  
   - Time-based score multiplier.  
   - Three difficulty levels (optional).  

---

## 🎨 Character Design

Before starting the game, the user can design a **custom Pac-Man character**:
- A simple canvas with GUI allows resizing and repositioning shapes.  
- 2D primitives such as circles, triangles, squares, and lines are used.  
- Users can fill polygons with colors by mouse click using a color picker.  

---

## 🧱 Game Design

### 🔹 Graphics Design
- The maze is built using WebGL 2D primitives (lines, rectangles, curves, 2D text, shaders, and color filling).
- The Pac-Man character created in the design step is rendered in the maze.
- The red ball appears randomly in the maze.

### 🔹 Interactivity
- Keyboard input controls Pac-Man’s movement.
- Collision detection determines when Pac-Man hits walls or collects the ball.
- A timer and score display enhance gameplay feedback.
