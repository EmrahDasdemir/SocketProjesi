const express = require("express");
const { v4: uuidv4 } = require("uuid");
const router = express.Router();
const { users } = require("../routes/userRoutes");
let io;
const setIo = (localIo) => {
  io = localIo;
};

router.post("/update-vote", (req, res) => {
  const { userId, score } = req.body;
  console.log(req.body);

  const user = users.find((u) => u.id === userId);
  console.log(users);
  console.log(user);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  user.score = score;

  console.log("User score updated:", user);
  io.emit("user list", users);
  return res.send(users);
});

module.exports = {
  setIo,
  router,
};
