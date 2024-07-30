const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");

const users = [];
let adminAssigned = false;

router.get("/", (req, res) => {
  console.log("GET /users");
  console.log(users);
  res.json(users);
});

router.post("/new-user", (req, res) => {
  console.log("POST /new-user", req.body);
  const { name, email } = req.body;

  const isValidName = (name) => {
    const nameRegex = /^[A-Za-z\s]{3,}$/;
    return nameRegex.test(name);
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
      role: adminExists ? "user" : "admin",
      score: -1,
      socketId: null,
    };

    if (newUser.role === "admin") {
      users.forEach((user) => {
        user.role = "user";
      });
    }

    users.push(newUser);
    console.log(users);
    res.status(201).json(newUser);
  } else {
    console.log("Name and email are required");
    res.status(400).json({ error: "Name and email are required" });
  }
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
    console.log(`${user.name} is now admin`);
  } else {
    user.role = newRole;
  }

  res.status(200).json(user);
});

module.exports = router;
