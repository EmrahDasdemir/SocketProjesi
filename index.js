const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { v4: uuidv4 } = require("uuid");
var cors = require("cors");
const userRoutes = require("./routes/userRoutes");

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

let adminAssigned = false;

io.on("connection", (socket) => {
  console.log("A user connected");

  let connectedUserName = null;

  socket.on("new user", (name) => {
    connectedUserName = name;

    const role = adminAssigned ? "user" : "admin";
    if (!adminAssigned) {
      adminAssigned = true;
    }

    const newUser = {
      id: uuidv4(),
      name: name,
      role: role,
      score: -1,
      socketId: socket.id,
    };
    users.push(newUser);
    io.emit("user list", JSON.stringify(users));
    console.log(`${connectedUserName} connected as ${role}`);
  });

  socket.on("chat message", (msg, userName) => {
    const timestamp = new Date().toLocaleTimeString();
    const message = { text: msg, name: userName, time: timestamp };
    console.log("Received message:", message);
    msgs.push(message);
    io.emit("chat message", JSON.stringify(msgs));
  });

  socket.on("userRegister", (user) => {
    console.log("Received user registration:", user);
    users.push(user);
    io.emit("userRegister", JSON.stringify(user));
  });

  socket.on("update score", (userId, score) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      user.score = score;
      io.emit("user list", JSON.stringify(users));
    }
  });

  socket.on("updateRole", (userId, newRole) => {
    const user = users.find((u) => u.id === userId);
    if (user && newRole === "admin") {
      users.forEach((u) => {
        if (u.role === "admin") {
          u.role = "user";
        }
      });
      user.role = newRole;
      io.emit("user list", JSON.stringify(users));
      console.log(`${user.name} is now admin`);
    } else if (user) {
      user.role = newRole;
      io.emit("user list", JSON.stringify(users));
    }
  });

  socket.on("disconnect", () => {
    const disconnectedUserIndex = users.findIndex(
      (u) => u.socketId === socket.id
    );
    if (disconnectedUserIndex !== -1) {
      const disconnectedUser = users[disconnectedUserIndex];
      console.log(`${disconnectedUser.name} disconnected`);
      users.splice(disconnectedUserIndex, 1);
      io.emit("user list", JSON.stringify(users));
    }
  });
});

server.listen(3000, () => {
  console.log("Server listening on port 3000");
});
