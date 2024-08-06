const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const userRoutes = require("./routes/userRoutes");
const socketConnections = require("./routes/socketConnections");
const voteRoute = require("./routes/voteRoute");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.use("/users", userRoutes(io));
app.use("/votes", voteRoute(io));

const users = [];
const time = [];
let adminAssigned = false;

socketConnections(
  io,
  users,
  time,
  () => adminAssigned,
  (newAdminAssigned) => {
    adminAssigned = newAdminAssigned;
  }
);

server.listen(3000, () => {
  console.log("Server listening on port 3000");
});
