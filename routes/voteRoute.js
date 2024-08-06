const express = require("express");
const { v4: uuidv4 } = require("uuid");
const router = express.Router();
const dayjs = require("dayjs");

let users = [];

module.exports = (io) => {
  router.post("/update-vote", (req, res) => {
    console.log(req.body);
    res.json(users);
  });

  return router;
};
