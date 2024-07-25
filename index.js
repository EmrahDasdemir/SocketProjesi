const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { v4: uuidv4 } = require("uuid");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

const users = [];
const msgs = [];

io.on("connection", (socket) => {
  console.log("a user connected");

  // Yeni kullanıcı verisi alınıp oluşturuluyor
  socket.on("new user", (name, role) => {
    const newUser = {
      id: uuidv4(),
      name: name,
      role: role,
      score: -1,
    };
    users.push(newUser);
    io.emit("user list", JSON.stringify(users));
  });

  // Kullanıcı mesajı alındığında
  socket.on("chat message", (msg, userName) => {
    const timestamp = new Date().toLocaleTimeString();
    const message = { text: msg, name: userName, time: timestamp };
    console.log("Received message:", message);
    msgs.push(message);
    io.emit("chat message", JSON.stringify(msgs));
  });

  // Kullanıcı kaydı işlemi
  socket.on("userRegister", (user) => {
    console.log("Received user registration:", user);
    users.push(user);
    io.emit("userRegister", JSON.stringify(user));
  });

  // Kullanıcı puan güncellemesi
  socket.on("update score", (userId, score) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      user.score = score;
      io.emit("user list", JSON.stringify(users));
    }
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

app.get("/users", (req, res) => {
  res.json(users); // Return users array as JSON
});

app.post("/new-user", (req, res) => {
  console.log(req.body); // Debugging line
  const { name, role } = req.body;
  if (name && role) {
    const newUser = {
      id: uuidv4(),
      name: name,
      role: role,
      score: -1,
    };
    users.push(newUser);
    io.emit("user list", JSON.stringify(users));
    res.status(201).json(newUser);
  } else {
    res.status(400).json({ error: "Name and role are required" });
  }
});

server.listen(3000, () => {
  console.log("Server listening on port 3000");
});
