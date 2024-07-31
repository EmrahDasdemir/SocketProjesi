const { v4: uuidv4 } = require("uuid");

module.exports = (io, users, msgs, getAdminAssigned, setAdminAssigned) => {
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
        name: name,
        role: role,
        score: -1,
        socketId: socket.id,
        status: true,
      };
      users.push(newUser);
      io.emit("user list", JSON.stringify(users));
      console.log(`${connectedUserName} connected as ${role}`);
    });

    socket.on("chat message", (msg, userName) => {
      const timestamp = new Date().toLocaleTimeString();
      const message = { text: msg, name: userName, time: timestamp };
      console.log("Received message:", message);
      msgs.push(message);
      io.emit("chat message", JSON.stringify(msgs));
    });

    socket.on("userRegister", (user) => {
      console.log("Received user registration:", user);
      users.push(user);
      io.emit("userRegister", JSON.stringify(user));
    });

    socket.on("update score", (userId, score) => {
      const user = users.find((u) => u.id === userId);
      if (user) {
        user.score = score;
        io.emit("user list", JSON.stringify(users));
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
        io.emit("user list", JSON.stringify(users));
        console.log(`${user.name} is now admin`);
      } else if (user) {
        user.role = newRole;
        io.emit("user list", JSON.stringify(users));
      }
    });
    socket.on("user online", (userId) => {
      users[userId] = { id: userId, status: true };
      io.emit("user list", JSON.stringify(Object.values(users)));
    });

    socket.on("disconnect", () => {
      console.log("A user disconnected");
      for (let userId in users) {
        if (users[userId].socketId === socket.id) {
          users[userId].status = false;
          delete users[userId].socketId; // socketId'yi kaldır
          break;
        }
      }
      io.emit("user list", JSON.stringify(Object.values(users)));
    });
  });
};
