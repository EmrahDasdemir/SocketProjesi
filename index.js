const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { v4: uuidv4 } = require("uuid");
var cors = require("cors");

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

const users = [];
const msgs = [];

let adminAssigned = false; // Admin atama kontrolü için değişken

io.on("connection", (socket) => {
  console.log("A user connected");

  let connectedUserName = null;

  // Yeni kullanıcı verisi alınıp oluşturuluyor
  socket.on("new user", (name) => {
    connectedUserName = name; // Kullanıcı adını kaydediyoruz

    // İlk kullanıcı admin olarak atanacak
    const role = adminAssigned ? "user" : "admin";
    if (!adminAssigned) {
      adminAssigned = true; // İlk admin atandı, bundan sonra gelenler user olacak
    }

    const newUser = {
      id: uuidv4(),
      name: name,
      role: role,
      score: -1,
      socketId: socket.id, // Kullanıcının socket.id'sini saklıyoruz
    };
    users.push(newUser);
    io.emit("user list", JSON.stringify(users));
    console.log(`${connectedUserName} connected as ${role}`); // Kullanıcı adıyla loglama
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
    const disconnectedUserIndex = users.findIndex(
      (u) => u.socketId === socket.id
    );
    if (disconnectedUserIndex !== -1) {
      const disconnectedUser = users[disconnectedUserIndex];
      console.log(`${disconnectedUser.name} disconnected`);
      users.splice(disconnectedUserIndex, 1); // Kullanıcıyı listeden kaldır
      io.emit("user list", JSON.stringify(users)); // Güncellenmiş kullanıcı listesini gönder
    }
  });
});

app.get("/users", (req, res) => {
  console.log("GET /users");
  console.log(users);
  res.json(users);
});

app.post("/new-user", (req, res) => {
  console.log("POST /new-user", req.body);
  const { name, email } = req.body;

  const isValidName = (name) => {
    return typeof name === "string" && name.length >= 3;
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  if (!isValidName(name)) {
    console.log("Invalid name format");
    return res.status(400).json({ error: "Invalid name format" });
  }

  if (!isValidEmail(email)) {
    console.log("Invalid email format");
    return res.status(400).json({ error: "Invalid email format" });
  }

  if (name && email) {
    let adminExists = users.some((user) => user.role === "admin");
    const newUser = {
      id: uuidv4(),
      name: name,
      email: email,
      role: adminExists ? "user" : "admin", // İlk admin yoksa admin olarak atanacak
      score: -1,
      socketId: null, // POST request ile eklenen kullanıcılar için socketId yok
    };

    if (newUser.role === "admin") {
      // Mevcut kullanıcıların rolünü "user" olarak ayarlama
      users.forEach((user) => {
        user.role = "user";
      });
    }

    users.push(newUser);
    console.log(users);
    io.emit("user list", JSON.stringify(users));
    res.status(201).json(newUser);
  } else {
    console.log("Name and email are required");
    res.status(400).json({ error: "Name and email are required" });
  }
});

server.listen(3000, () => {
  console.log("Server listening on port 3000");
});
