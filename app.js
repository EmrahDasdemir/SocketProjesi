const express = require("express");
const session = require("express-session");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const socketConnections = require("./routes/socketConnections");
const userRoute = require("./routes/userRoutes");
const voteRoute = require("./routes/voteRoute");

const app = express();

app.use(cors());
app.use(express.json());

const sessionMiddleware = session({
  secret: "your_secret_key",
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false },
});

app.use(sessionMiddleware);

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

io.use((socket, next) => {
  sessionMiddleware(socket.request, {}, next);
});

const users = [];
const time = [];

userRoute.setIo(io);
voteRoute.setIo(io);

app.use("/users", userRoute.router);
app.use("/votes", voteRoute.router);

socketConnections(
  io,
  time,
  () => adminAssigned,
  (newAdminAssigned) => {
    adminAssigned = newAdminAssigned;
  }
);

server.listen(3000, () => {
  console.log("Server listening on port 3000");
});

module.exports = {
  io,
};
