const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 4000 });

let messages = [];
let users = new Set();

wss.on('connection', (ws) => {
    console.log('New client connected');

    // Send chat history
    ws.send(JSON.stringify({ type: 'history', data: messages }));

    ws.on('message', (message) => {
        try {
            const parsed = JSON.parse(message);
            console.log('Received:', parsed);

            // Handle user join
            if (parsed.type === 'userJoin') {
                ws.username = parsed.username || 'Anonymous';
                users.add(ws.username);
                broadcastUserCount();
                return;
            }

            // Don't allow messages before username is set
            if (!ws.username) {
                console.warn('Ignoring message before username set.');
                return;
            }

            const messageObj = {
                id: Date.now(),
                text: parsed.text,
                sender: ws.username,
                timestamp: new Date().toISOString()
            };

            messages.push(messageObj);
            broadcastMessage(messageObj);

        } catch (err) {
            console.error('Error processing message:', err);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        if (ws.username) {
            users.delete(ws.username);
            broadcastUserCount();
        }
    });
});

function broadcastMessage(message) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
                type: 'message',
                data: message
            }));
        }
    });
}

function broadcastUserCount() {
    const count = users.size;
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
                type: 'userCount',
                count: count
            }));
        }
    });
}
