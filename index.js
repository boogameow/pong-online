var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

http.listen(process.env.PORT || 3030);

// variables

var users = {}

// template

function template(id){
    if (!id) id = "";
    return {
        id: id,
        y: 0,
        dir: 0,
        time: 0,
    }
}

// main system

io.on('connection', (socket) => {
    var user = new template(socket.id);
    user.id = socket.id;
    users[socket.id] = user;

    // disconnect hookup
    socket.on("disconnect", ()=>{
        io.emit("stop", users[socket.id])
        delete users[socket.id];
        io.emit('usercount', Object.keys(users).length)
    })

    // paddle movement
    socket.on("paddle", (data)=> {
        users[socket.id].y = data.contents[0]
        users[socket.id].dir = data.contents[1]
        users[socket.id].time = data.contents[2]
        io.emit("paddle", users[socket.id])
    })

    // ball movement
    socket.on("ball", (data)=> {
        io.emit("ball", {
            x: data.contents[0],
            y: data.contents[1],
            id: users[socket.id].id
        })
    })

    // dub scores
    socket.on("score", (data)=> {
        io.emit("score", {
            blue: data.contents[0],
            red: data.contents[1],
            id: users[socket.id].id
        })
    })

    // send the client starting data.
    socket.emit('init', {id: socket.id})
    io.emit('usercount', Object.keys(users).length) // we use io because its directed at everyone.

    // find another client if applicable.
    Object.keys(users).forEach(u => {
        if (users[u].id !== socket.id && users[u].found == null && users[socket.id].found == null){
            socket.emit('join', {user: users[u], id: u, host: false});
            io.emit('join', {user: users[u], id: u, host: true});
            users[socket.id].found = true
            users[socket.id].id = u
            users[socket.id].host = false
            users[u].found = true
            users[u].host = true
        }
    });
})