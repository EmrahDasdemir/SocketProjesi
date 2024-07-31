// index.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { v4: uuidv4 } = require("uuid");
const cors = require("cors");
const userRoutes = require("./routes/userRoutes");
const socketConnections = require("./routes/socketConnections"); // Import burada

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});
app.use("/users", userRoutes);

const users = [];
const msgs = [];
let adminAssigned = false; // Bu değişkenin değiştirilebilir olduğunu unutma

socketConnections(io, users, msgs, adminAssigned);

server.listen(3000, () => {
  console.log("Server listening on port 3000");
});
