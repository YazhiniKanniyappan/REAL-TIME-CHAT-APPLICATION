import React, { useState, useEffect, useRef } from 'react';
import './App.css';

const App = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [username, setUsername] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [userCount, setUserCount] = useState(0);
    const [hasJoined, setHasJoined] = useState(false);
    const ws = useRef(null);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        const name = prompt('Enter your username:') || 'Anonymous';
        setUsername(name);

        ws.current = new WebSocket('ws://localhost:4000');

        ws.current.onopen = () => {
            console.log('Connected to WebSocket');
            setIsConnected(true);

            const joinMessage = {
                type: 'userJoin',
                username: name,
            };
            ws.current.send(JSON.stringify(joinMessage));
            setHasJoined(true); // Confirm username sent to server
        };

        ws.current.onmessage = async (event) => {
            try {
                const message = event.data instanceof Blob
                    ? JSON.parse(await event.data.text())
                    : JSON.parse(event.data);

                if (message.type === 'history') {
                    setMessages(message.data);
                } else if (message.type === 'message') {
                    setMessages(prev => [...prev, message.data]);
                } else if (message.type === 'userCount') {
                    setUserCount(message.count);
                }
            } catch (err) {
                console.error('Error parsing message:', err);
            }
        };

        ws.current.onclose = () => {
            console.log('Disconnected from WebSocket');
            setIsConnected(false);
        };

        return () => {
            if (ws.current) {
                ws.current.close();
            }
        };
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const sendMessage = () => {
        if (input.trim() && ws.current && ws.current.readyState === WebSocket.OPEN && hasJoined) {
            const message = {
                text: input
            };
            ws.current.send(JSON.stringify(message));
            setInput('');
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    };

    return (
        <div className="chat-container">
            <header className="chat-header">
                <h1>Real-Time Chat</h1>
                <div className="header-info">
                    <div className="user-count">👥 Users online: {userCount}</div>
                    <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
                        {isConnected ? 'Connected' : 'Disconnected'}
                    </div>
                </div>
            </header>


            <div className="message-list">
                {messages.map((msg) => (
                    <div key={msg.id} className={`message ${msg.sender === username ? 'sent' : 'received'}`}>
                        <div className="message-header">
                            <span className="sender">{msg.sender} </span>
                            <span className="timestamp">
                                {new Date(msg.timestamp).toLocaleTimeString()}
                            </span>
                        </div>
                        <div className="message-text">{msg.text}</div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <div className="input-area">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    disabled={!isConnected}
                />
                <button
                    onClick={sendMessage}
                    disabled={!input.trim() || !isConnected || !hasJoined}
                >
                    Send
                </button>
            </div>
        </div>
    );
};

export default App;
