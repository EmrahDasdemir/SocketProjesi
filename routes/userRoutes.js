const express = require("express");
const { v4: uuidv4 } = require("uuid");
const router = express.Router();
const dayjs = require("dayjs");

let users = []; // `users` dizisini buraya taşıdım.
let adminAssigned = false;

const isValidName = (name) => /^[A-Za-z\s]{3,}$/.test(name);
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const getCurrentTimestamp = () => dayjs().format("YYYY-MM-DDTHH:mm:ssZ");

// Socket.io için io nesnesini dışarıdan al
module.exports = (io) => {
  router.get("/", (req, res) => {
    res.json(users);
  });

  router.post("/new-user", (req, res) => {
    const { name, email } = req.body;

    if (!isValidName(name)) {
      return res.status(400).json({ error: "Invalid name format" });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    let role = "user";
    if (!adminAssigned) {
      role = "admin";
      adminAssigned = true;
      users.forEach((user) => {
        if (user.role === "admin") {
          user.role = "user";
        }
      });
    }

    const newUser = {
      id: uuidv4(),
      name,
      email,
      role,
      score: -1,
      socketId: null,
      status: false,
      time: getCurrentTimestamp(),
    };

    users.push(newUser);
    io.emit("user list", users); // Güncel kullanıcı listesini yayınla

    console.log("New user connected:", newUser); // Kullanıcı eklenmesini terminale yazdır

    res.status(201).json(newUser);
  });

  router.post("/update-role", (req, res) => {
    const { userId, newRole } = req.body;

    if (!userId || !newRole) {
      return res.status(400).json({ error: "userId and newRole are required" });
    }

    const user = users.find((u) => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (newRole === "admin") {
      users.forEach((u) => {
        if (u.role === "admin") {
          u.role = "user";
        }
      });
      user.role = newRole;
      adminAssigned = true;
    } else {
      user.role = newRole;
    }

    io.emit("user list", users); // Güncel kullanıcı listesini yayınla

    console.log("User role updated:", user); // Kullanıcı rolü güncellenmesini terminale yazdır

    res.status(200).json(user);
  });

  router.delete("/:userId", (req, res) => {
    const { userId } = req.params;

    const userIndex = users.findIndex((user) => user.id === userId);
    if (userIndex !== -1) {
      const removedUser = users.splice(userIndex, 1)[0];
      io.emit("user list", users); // Güncel kullanıcı listesini yayınla

      console.log("User deleted:", removedUser); // Kullanıcı silinmesini terminale yazdır

      res.status(200).json({ message: "User deleted successfully" });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  });

  return router;
};
