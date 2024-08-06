const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const socketConnections = require("./routes/socketConnections");
const userRoute = require("./routes/userRoutes");
const voteRoute = require("./routes/voteRoute");

// const users = [];
const app = express();

app.use(cors());
app.use(express.json());
const users = [];
const time = [];
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
userRoute.setIo(io);
voteRoute.setIo(io);

app.use("/users", userRoute.router);
app.use("/votes", voteRoute.router);

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
module.exports = {
  io,
  // users,
};
