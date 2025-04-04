const http = require('http');
const url = require('url');

// In-memory data stores
let items = [
    { id: 1, name: 'Default Item 1', description: 'Description 1', createdAt: new Date().toISOString() },
    { id: 2, name: 'Default Item 2', description: 'Description 2', createdAt: new Date().toISOString() }
];
let users = [
    { id: 1, username: 'admin', email: 'admin@example.com', fullName: 'Administrator' },
    { id: 2, username: 'testuser', email: 'test@example.com', fullName: 'Test User' }
];
let nextItemId = 3;
let nextUserId = 3;

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;
    const method = req.method;
    const query = parsedUrl.query;
    const headers = req.headers;

    // Helper function to send JSON response
    const sendJson = (statusCode, data) => {
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
    };

    // Helper function to send text response
    const sendText = (statusCode, data) => {
        res.writeHead(statusCode, { 'Content-Type': 'text/plain' });
        res.end(data);
    };

    // Helper function to send empty response
    const sendEmpty = (statusCode) => {
        res.writeHead(statusCode);
        res.end();
    };

    // Helper function to parse request body
    const parseBody = (callback) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                callback(null, JSON.parse(body || '{}'));
            } catch (error) {
                callback(error, null);
            }
        });
        req.on('error', (err) => {
            callback(err, null);
        });
    };

    console.log(`${method} ${path}`);

    // Routing
    // Items
    if (path === '/items' && method === 'GET') {
        sendJson(200, items);
    } else if (path === '/items' && method === 'POST') {
        parseBody((err, newItemData) => {
            if (err || !newItemData.name) {
                return sendJson(400, { error: 'Invalid input data' });
            }
            const newItem = {
                id: nextItemId++,
                name: newItemData.name,
                description: newItemData.description || null,
                createdAt: new Date().toISOString()
            };
            items.push(newItem);
            sendJson(201, newItem);
        });
    } else if (path.match(/^\/items\/(\d+)$/) && method === 'GET') {
        const id = parseInt(path.split('/')[2]);
        const item = items.find(i => i.id === id);
        if (item) {
            sendJson(200, item);
        } else {
            sendJson(404, { error: 'Item not found' });
        }
    } else if (path.match(/^\/items\/(\d+)$/) && method === 'PUT') {
        const id = parseInt(path.split('/')[2]);
        parseBody((err, updateData) => {
            if (err || !updateData.name) {
                return sendJson(400, { error: 'Invalid input data' });
            }
            const itemIndex = items.findIndex(i => i.id === id);
            if (itemIndex !== -1) {
                items[itemIndex] = { ...items[itemIndex], ...updateData }; // Simple merge, might need validation
                sendJson(200, items[itemIndex]);
            } else {
                sendJson(404, { error: 'Item not found' });
            }
        });
    } else if (path.match(/^\/items\/(\d+)$/) && method === 'DELETE') {
        const id = parseInt(path.split('/')[2]);
        const initialLength = items.length;
        items = items.filter(i => i.id !== id);
        if (items.length < initialLength) {
            sendEmpty(204);
        } else {
            sendJson(404, { error: 'Item not found' });
        }
    }
    // Users
    else if (path === '/users' && method === 'GET') {
        // Strip password before sending
        const usersToSend = users.map(({ password, ...rest }) => rest);
        sendJson(200, usersToSend);
    } else if (path === '/users' && method === 'POST') {
        parseBody((err, newUserData) => {
            if (err || !newUserData.username || !newUserData.email || !newUserData.password) {
                return sendJson(400, { error: 'Invalid input data' });
            }
            // Basic validation (e.g., check if email exists)
            if (users.some(u => u.email === newUserData.email)) {
                return sendJson(400, { error: 'Email already exists' });
            }
            const newUser = {
                id: nextUserId++,
                username: newUserData.username,
                email: newUserData.email,
                fullName: newUserData.fullName || null,
                // NOTE: In a real app, hash the password!
                password: newUserData.password // Storing plaintext password - VERY INSECURE, for demo only
            };
            users.push(newUser);
            const { password, ...userToSend } = newUser; // Don't send password back
            sendJson(201, userToSend);
        });
    } else if (path.match(/^\/users\/(\d+)$/) && method === 'GET') {
        const id = parseInt(path.split('/')[2]);
        const user = users.find(u => u.id === id);
        if (user) {
            const { password, ...userToSend } = user; // Don't send password
            sendJson(200, userToSend);
        } else {
            sendJson(404, { error: 'User not found' });
        }
    }
    // Utility
    else if (path === '/status' && method === 'GET') {
        sendJson(200, { status: 'OK' });
    } else if (path === '/ping' && method === 'GET') {
        sendText(200, 'pong');
    }
    // Authentication (Placeholder)
    else if (path === '/login' && method === 'POST') {
        parseBody((err, loginData) => {
            if (err || !loginData.username || !loginData.password) {
                return sendJson(400, { error: 'Username and password required' });
            }
            // VERY basic auth check (insecure)
            const user = users.find(u => u.username === loginData.username && u.password === loginData.password);
            if (user) {
                // In real app, generate JWT
                sendJson(200, { token: 'fake-jwt-token-' + Date.now() });
            } else {
                sendJson(401, { error: 'Invalid credentials' });
            }
        });
    }
    // Config (Placeholder Auth Check)
    else if (path === '/config' && method === 'GET') {
        // Super basic auth check - expects 'Authorization: Bearer fake-jwt-token-...'
        const authHeader = headers['authorization'];
        if (authHeader && authHeader.startsWith('Bearer fake-jwt-token-')) {
            sendJson(200, { featureFlags: { featureA: true, featureB: false }, logLevel: 'info' });
        } else {
            sendJson(401, { error: 'Unauthorized' });
            // Could also send 403 Forbidden if token is valid but user lacks permissions
        }
    }
    // Not Found
    else {
        sendJson(404, { error: 'Not Found' });
    }
});

const port = 3000;
server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
