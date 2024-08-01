const express = require("express");
const { v4: uuidv4 } = require("uuid");
const router = express.Router();

const users = []; // Kullanıcı listesi burada tutuluyor
let adminAssigned = false; // Admin atanıp atanmadığını takip etmek için

router.get("/", (req, res) => {
  console.log(users);
  res.json(users);
});

router.post("/new-user", (req, res) => {
  console.log("POST /new-user", req.body);
  const { name, email } = req.body;

  const isValidName = (name) => /^[A-Za-z\s]{3,}$/.test(name);

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  if (!isValidName(name)) {
    return res.status(400).json({ error: "Invalid name format" });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  let adminExists = users.some((user) => user.role === "admin");
  const newUser = {
    id: uuidv4(),
    name,
    email,
    role: adminExists ? "user" : "admin",
    score: -1,
    socketId: null,
    status: false,
  };

  if (newUser.role === "admin") {
    users.forEach((user) => {
      user.role = "user";
    });
    adminAssigned = true;
  }

  users.push(newUser);
  console.log("Yeni kullanıcı eklendi:", newUser);
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
    console.log(`${user.name} is now admin`);
  } else {
    user.role = newRole;
  }

  res.status(200).json(user);
});

router.delete("/:userId", (req, res) => {
  const { userId } = req.params;
  console.log(`Attempting to delete user with ID: ${userId}`);

  const userIndex = users.findIndex((user) => user.id === userId);
  if (userIndex !== -1) {
    const removedUser = users.splice(userIndex, 1)[0];
    console.log(`${removedUser.name} has been deleted`);
    res.status(200).json({ message: "User deleted successfully" });
  } else {
    console.log("User not found");
    res.status(404).json({ error: "User not found" });
  }
});

module.exports = router;
