import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import path from  'path'

const app = express();
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
        if (currentRoom){
            socket.leave(currentRoom);
            rooms.get(currentRoom).delete(currentUser);
            io.to(currentRoom).emit("userJoined",Array.from(rooms.get(currentRoom)));
        }
        currentRoom = roomId
        currentUser = userName

        socket.join(roomId);
        if (!rooms.has(roomId)){
            rooms.set(roomId,new Set())
        }
        rooms.get(roomId).add(userName);
        io.to(roomId).emit("userJoined",Array.from(rooms.get(roomId)));
        
    })
    socket.on("codechange",({roomId,code}) =>{
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
