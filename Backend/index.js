import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import path from  'path'

const app = express();
app.use(express.json());
const server = http.createServer(app);
const io = new Server(server,{
    cors: {
        origin: "*",
    },
});

const rooms = new Map();
io.on("connection",(socket)=>{  
    console.log("a user connected",socket.id);

    let currentRoom = null;
    let currentUser = null;
    socket.on("join",({roomId,userName}) =>{
        console.log(`User ${userName} joining room ${roomId}`);
        
        if (currentRoom){
            socket.leave(currentRoom);
            let roomUsers = rooms.get(currentRoom);
            if (roomUsers) {
                roomUsers.delete(currentUser);
                if (roomUsers.size === 0) {
                    rooms.delete(currentRoom);
                } else {
                    io.to(currentRoom).emit("userJoined",Array.from(roomUsers));
                }
            }
        }
        currentRoom = roomId
        currentUser = userName

        socket.join(roomId);
        if (!rooms.has(roomId)){
            rooms.set(roomId,new Set())
        }
        rooms.get(roomId).add(userName);
        console.log(`Room ${roomId} users:`, Array.from(rooms.get(roomId)));
        io.to(roomId).emit("userJoined",Array.from(rooms.get(roomId)));

    })
    socket.on("codechange",({roomId,code}) =>{
        console.log(`Code change in room ${roomId}`);
        socket.to(roomId).emit("codeupdate",code)
    })
    socket.on("leaveRoom",({roomId})=>{
        if (currentRoom && currentUser && rooms.has(currentRoom)){
            rooms.get(currentRoom).delete(currentUser);
            if (rooms.get(currentRoom).size === 0) {
                rooms.delete(currentRoom);
            } else {
                io.to(currentRoom).emit("userJoined",Array.from(rooms.get(currentRoom)));
            }
            socket.leave(currentRoom)
            currentRoom= null;
            currentUser= null;
        }
        console.log("user left room",socket.id);
    })
    socket.on("typing",({roomId})=>{
        socket.to(roomId).emit("userTyping",currentUser)
    })
    socket.on("languageChange",({roomId,language})=>{
        socket.to(roomId).emit("languageUpdate",language)
    })
    socket.on("disconnect",() =>{
        if (currentRoom && currentUser && rooms.has(currentRoom)){
            rooms.get(currentRoom).delete(currentUser);
            if (rooms.get(currentRoom).size === 0) {
                rooms.delete(currentRoom);
            } else {
                io.to(currentRoom).emit("userJoined",Array.from(rooms.get(currentRoom)));
            }
        }
        console.log("user Disconnected",socket.id);
    })
})
const port = process.env.PORT || 5000;
const __dirname = path.resolve();
app.use(express.static(path.join(__dirname,"Frontend","dist")));
app.get('*',(req,res)=>{
    res.sendFile(path.join(__dirname,"Frontend","dist","index.html"))
})

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
