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

      console.log(
        `New user added: ${name}, Role: ${role}, Socket ID: ${socket.id}`
      );
      console.log("Current users list:", users);
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
        io.emit("user list", users);
      }
    });

    socket.on("showResults", (scores) => {
      scores.forEach(({ id, score }) => {
        const user = users.find((u) => u.id === id);
        if (user) {
          user.score = score;
        }
      });

      const totalScore = users.reduce((acc, user) => acc + user.score, 0);
      const averageScore = totalScore / users.length;

      const results = users.map((user) => ({
        id: user.id,
        name: user.name,
        score: user.score,
      }));

      io.emit("results", { results, averageScore });
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
      console.log(`Attempting to find user with socket ID: ${socket.id}`);
      const user = users.find((u) => u.socketId === socket.id);

      if (user) {
        users.status = false;
        users.socketId = null;
        io.emit("user list", users);

        console.log(`User ${user.name} disconnected as a role ${user.role}`);
      } else {
        console.log(
          `User with socket ID ${socket.id} disconnected, but not found in the users list`
        );
        console.log("Current users list:", users);
      }
    });
  });
};
