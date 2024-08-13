const express = require("express");
const { v4: uuidv4, stringify } = require("uuid");
const router = express.Router();
const dayjs = require("dayjs");
const { isValidName, isValidEmail } = require("../utils/validation");

let users = [];
let adminAssigned = false;
let io;

const getCurrentTimestamp = () => dayjs().format("YYYY-MM-DDTHH:mm:ssZ");

const setIo = (localIo) => {
  io = localIo;
};

router.get("/", (req, res) => {
  res.json(users);
});

router.post("/new-user", (req, res) => {
  const { name, email } = req.body;

  // try {
  //   const existingUser = users.findOne({ email });
  //   if (existingUser) {
  //     return res.status(400).json({ error: "This email already taken." });
  //   }
  // } catch (error) {
  //   return res.status(400).json({ error: "catch part active." });
  // }

  if (!isValidName(name)) {
    return res.status(400).json({ error: "Invalid name format" });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  let role = "user";
  if (!adminAssigned || users.length == 0) {
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
    socketId: req.body.socketId,
    status: true,
    time: getCurrentTimestamp(),
  };

  users.push(newUser);

  const updateUserSocketId = (users, socketId) => {
    users.forEach((user) => {
      if (!user.socketId) {
        user.socketId = socketId;
      }
    });
  };
  const socketId = "newSocketId";

  updateUserSocketId(users, socketId);
  console.log(users);

  io.emit("user list", users);

  console.log("New user created:", newUser);

  res.status(201).json(newUser);
});

router.post("/update-socket-id", (req, res) => {
  const { userId, socketId } = req.body;

  const user = users.find((u) => u.id === userId);
  if (user) {
    user.socketId = socketId;
    io.emit("user list", users);
    console.log(`User ${userId}'s socketId updated to ${socketId}`);
    res.status(200).json(user);
  } else {
    res.status(404).json({ error: "User not found" });
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
    adminAssigned = true;
  } else {
    user.role = newRole;
  }

  io.emit("user list", users);
  io.emit("updatedRole", { userId, newRole });

  console.log("User role updated:", user);

  res.status(200).json(user);
});

router.post("/update-status", (req, res) => {
  // const { userId } = req.body;

  // const user = users.find((u) => u.id === userId);
  // if (!user) {
  //   return res.status(404).json({ error: "User not found" });
  // }

  // user.status = false;
  // console.log("User status updated:", user);

  // io.emit("user list", users);

  res.status(200).json({});
});

router.delete("/:userId", (req, res) => {
  const { userId } = req.params;

  const userIndex = users.findIndex((user) => user.id === userId);
  if (userIndex !== -1) {
    const removedUser = users.splice(userIndex, 1)[0];
    if (removedUser.role === "admin") {
      adminAssigned = false;
    }
    io.emit("user list", users);
    io.emit("userDeleted", userId);

    console.log("User deleted:", removedUser);

    res.status(200).json({ message: "User deleted successfully" });
  } else {
    res.status(404).json({ error: "User not found" });
  }
});

module.exports = {
  setIo,
  router,
  users,
};
