import { Server } from "socket.io";

const connectToSocket = (server) => {
    const io = new Server(server, {
        cors : {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });
    io.on("connection", (socket) => {
        console.log("User Connected!", socket.id);
        socket.on("offer", (offer) => {
            socket.to(socket.roomId).emit("offer", offer);
        });
        socket.on("answer", (answer) => {
            socket.to(socket.roomId).emit("answer", answer);
        });
        socket.on("ice-candidate", (candidate) => {
            console.log("receiving ice candidate")
            socket.to(socket.roomId).emit("ice-candidate", candidate);
        });
        socket.on("room-id", (roomId) => {
            socket.join(roomId);
            socket.roomId = roomId;
            console.log(`${socket.id} joins with ${roomId}`);
        });
        socket.on("disconnect", () => {
            console.log("User Disconnected!");
        });

    });
    return io;
}

export default connectToSocket;