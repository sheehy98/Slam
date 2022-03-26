const io = require('socket.io')(process.env.PORT || 3000, {
  cors: {
    origin: ['http://localhost:8080', 'https://admin.socket.io/']
  },
})
const { instrument } = require("@socket.io/admin-ui")
const fs = require('fs')

io.on('connection', socket => {
  fs.readFile("words.txt", function (err, text) {
    if(err) throw err;
    let wordList = text.toString().split("\n").map(s => s.substring(0, 4).toUpperCase())
    socket.emit('wordList', wordList)
     
    socket.on('event', (array) => {
      console.log(array)
    })

    socket.on('joinLobby', (text) => {
      socket.join(text)
    })

    socket.on('leaveLobby', (text) => {
      if (io.sockets.adapter.rooms.has(text)) {
        const clients = Array.from(io.sockets.adapter.rooms.get(text)).length
        socket.nsp.to(text).emit("setPop", clients - 1)
        socket.leave(text)
      }
    })

    socket.on('deck', (text, array) => {
      socket.nsp.to(text).emit("deck", array)
    })

    socket.on('choose', (text, text2) => {
      socket.nsp.to(text).emit("choose", text2)
    })

    socket.on('checkPop', (text) => {
      const clients = Array.from(io.sockets.adapter.rooms.get(text)).length
      socket.nsp.to(text).emit("setPop", clients)
    })

    socket.on('readyUp', (text) => {
      socket.nsp.to(text).emit("readyUp")
    })

    socket.on('readyDown', (text) => {
      socket.nsp.to(text).emit("readyDown")
    })

    socket.on('newWord', (lobby, text) => {
      socket.nsp.to(lobby).emit("newWord", text)
    })

    socket.on('win', (text) => {
      socket.nsp.to(text).emit("lose")
    })

    socket.on('disconnecting', () => {
      const lastRoom = Array.from(io.sockets.adapter.sids.get(socket.id))[0]
      const clients = Array.from(io.sockets.adapter.rooms.get(lastRoom)).length - 1
      socket.to(lastRoom).emit("setPop", clients)
    })
  })
})


instrument(io, { auth: false })