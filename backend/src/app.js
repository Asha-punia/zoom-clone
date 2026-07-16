import dotenv from "dotenv";
if(process.env.NODE_ENV != "production") {
    dotenv.config();
}
import express from "express";
import {createServer} from "node:http";
import mongoose from "mongoose";
import connectToSocket from "./controllers/socketManager.js";
import cors from "cors";
import router from "./routes/users.js";
const dbUrl = process.env.MONGO_URL;

const app = express();

const server = createServer(app);
const io = connectToSocket(server);
const port = process.env.PORT || 8000;
app.use(cors());
app.use(express.json({ limit : "40kb" }));
app.use(express.urlencoded({ limit : "40kb" , extended: true}));
app.use("/api/v1/users", router);

const start = async () => {
    const connectionDB = await mongoose.connect(dbUrl);
    server.listen(port, () => {
        console.log(`App is listening on port : ${port}`);
    });
}
start();