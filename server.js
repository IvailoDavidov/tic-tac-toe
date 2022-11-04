const http = require('http');
const express = require('express');
const socketIO = require('socket.io');

const app = express();
app.use('/', express.static('static'));
const server = http.createServer(app);
const io = socketIO(server);

const rooms = {};
const users = new Set();

io.on('connect', socket => {
  
    let currNickname = undefined;
    socket.on('init', nickname => {
        
        if(!users.has(nickname)){
            users.add(nickname);
            currNickname = nickname;           
            console.log(nickname + ' ' + 'joined');
            socket.emit('initOk');
            initClient(socket, nickname);
        }else{          
           socket.disconnect();
        }
    });
    socket.on('selectRoom', roomId => {
        if (rooms[roomId] == undefined) {
            rooms[roomId] = new Map();
        }
        const players = rooms[roomId];

        if (players.size >= 2) {
            debugger;
            socket.emit('error', 'Room is full!');
            socket.disconnect();
        } else {
            socket.join(roomId);
            initGame(roomId, players, socket); 
        }
    });
    socket.on('disconnect', () => {
        users.delete(currNickname);
    })
});

function initGame(roomId, players, socket) {  
    
    socket.on('position', pos => {
        console.log('Position:', pos);
        io.to(roomId).emit('position', pos);
    });
    
    socket.on('newGame', () => {
        console.log('New game initited');
        io.to(roomId).emit('newGame');
    });

    socket.on('disconnect', () => {
        console.log('Player left');
        players.delete(socket); 
    });

    let symbol = 'X';
    if (players.size > 0) {
        const otherSymbol = [...players.values()][0];
        if (otherSymbol == 'X') {
            symbol = 'O';
        }
    }
    players.set(socket, symbol);
    console.log('Assigning symbol', symbol);
    socket.emit('symbol', symbol);
}

function initClient(socket, nickname) {
    socket.emit('message', {
        source: 'Server',
        message: 'Welcome to SocketIO Chat'
    });

    socket.on('message', message => {
        console.log(message);
        socket.broadcast.emit('message', {
            source:nickname,
            message: message
        });
    });
}

server.listen(3000, () => console.log('Server is listening on port 3000'));