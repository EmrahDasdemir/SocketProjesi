const { v4: uuidv4 } = require("uuid");

module.exports = (io, users, time, getAdminAssigned, setAdminAssigned) => {
  io.on("connection", (socket) => {
    console.log("A user connected");

    let connectedUserName = null;

    socket.on("new user", (name) => {
      connectedUserName = name;

      const role = getAdminAssigned() ? "user" : "admin";
      if (!getAdminAssigned()) {
        setAdminAssigned(true);
      }

      const newUser = {
        id: uuidv4(),
        name,
        role,
        score: 0,
        socketId: socket.id,
        status: true,
      };

      users.push(newUser);
      io.emit("user list", users);

      console.log(`${connectedUserName} connected as ${role}`);
    });

    socket.on("new-user", (userName) => {
      const timestamp = new Date().toLocaleTimeString();
      const time = { name: userName, time: timestamp };
      console.log("Received new user:", time);
      io.emit("registration time", JSON.stringify(time));
    });

    socket.on("break request", () => {
      console.log("Break request received");
      io.emit("break notification");
    });

    socket.on("user online", (userId) => {
      const user = users.find((u) => u.id === userId);
      if (user) {
        user.status = true;
        user.socketId = socket.id;
      } else {
        users.push({ id: userId, status: true, socketId: socket.id });
      }
      io.emit("user list", users);
    });

    socket.on("update score", (userId, score) => {
      const user = users.find((u) => u.id === userId);
      if (user) {
        user.score = score;

        const allScored = users.every((u) => u.score !== 0);
        if (allScored) {
          const totalScore = users.reduce((acc, user) => acc + user.score, 0);
          const averageScore = totalScore / users.length;
          io.emit("average score", averageScore);
        }

        io.emit("user list", users);
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
        io.emit("user list", users);
        console.log(`${user.name} is now admin`);
      } else if (user) {
        user.role = newRole;
        io.emit("user list", users);
      }
    });

    socket.on("disconnect", () => {
      console.log("A user disconnected:");
      const user = users.find((u) => u.socketId === socket.id);
      if (user) {
        user.status = false;
        delete user.socketId;
        io.emit("user list", users);

        console.log(`User disconnected: ${user.name} as a role ${user.role}`);
      }
    });
  });
};
