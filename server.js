/**
 * Simple HTTP Server for Pac-Man WebGL Game
 * Serves static files on http://localhost:3000
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

// MIME types for different file extensions
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.glsl': 'text/plain',
    '.ico': 'image/x-icon'
};

// Cache for frequently accessed files
const fileCache = {};

const server = http.createServer((req, res) => {
    // Parse URL
    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './index.html';
    }

    // Normalize path to prevent directory traversal
    filePath = path.normalize(filePath).replace(/^(\.\.[\/\\])+/, '');

    // Get file extension
    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    // Check cache first
    if (fileCache[filePath]) {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(fileCache[filePath], 'utf-8');
        return;
    }

    // Read and serve file
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                // File not found
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 - File Not Found</h1>', 'utf-8');
            } else {
                // Server error
                res.writeHead(500);
                res.end(`Server Error: ${error.code}`, 'utf-8');
            }
        } else {
            // Cache the file for faster subsequent access
            fileCache[filePath] = content;
            
            // Success
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`\n🚀 Server running at http://localhost:${PORT}/`);
    console.log(`📁 Serving files from: ${__dirname}`);
    console.log(`\n✨ Open your browser and navigate to: http://localhost:${PORT}`);
    console.log(`\nPress Ctrl+C to stop the server\n`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ Port ${PORT} is already in use. Trying port ${PORT + 1}...\n`);
        server.listen(PORT + 1, () => {
            console.log(`\n🚀 Server running at http://localhost:${PORT + 1}/`);
            console.log(`📁 Serving files from: ${__dirname}`);
            console.log(`\n✨ Open your browser and navigate to: http://localhost:${PORT + 1}`);
            console.log(`\nPress Ctrl+C to stop the server\n`);
        });
    } else {
        console.error(`\n❌ Server error: ${err.message}\n`);
        process.exit(1);
    }
});

