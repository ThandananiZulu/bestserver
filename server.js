const express = require("express");
const mysql = require("mysql");
const httpServer = require("http").createServer();

var http = require("http");
const port = process.env.PORT || 3000;

const io = require("socket.io")(server);


io.on("connection", (socket) => {
  socket.on("connected", (msg) => {
 console.log(msg);
  });
  socket.on("sendEvent", (event, message, sender) => {
    io.to(users[event]).emit("message", message, sender);
  });
});
var db = mysql.createConnection({
  host: "0.0.0.0",
  user: "u723454498_best",
  password: "@1MAGEBAtech",
  database: "u723454498_bestbright",
 
});

db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log("Mysql DB Live....");
});
const app = express();
var server = http.createServer(app);
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);

app.listen(4001, () => {
  console.log("Listening on port 4001 ");
});

const productAllData = [];
const userAllData = [];

app.get("/", (req, res) => {
  res.send("Connected");
});

app.post("/api/adduser", (req, res) => {
  console.log("Result", req.body);

  const singleUserData = {
    fullname: req.body.fullname,
    username: req.body.username,
    password: req.body.password,
  };

  var exist = false;
  var results;
  let findExist = `SELECT username FROM users WHERE username = '${singleUserData.username}'`;
  let checkQuery = db.query(findExist, (err, result, fields) => {
    if (err) throw err;

    if (result.length >= 1) {
      console.log("User already exists");
      exist = true;
      res.status(200).send({
        code: 200,
        message: "User already exist",
        status: "error",
      });
    } else {
      let sql = "INSERT INTO users SET ?";
      let query = db.query(sql, singleUserData, (err, result, fields) => {
        if (err) throw err;
        results = result + "    /  " + fields;
        console.log("User inserted successfully");
        res.status(200).send({
          code: 200,
          message: "User added successfully",
          status: "ok",
        });
      });
    }
  });
});

app.post("/api/login", (req, res) => {
  console.log("Result", req.body);

  var username = req.body.username;
  var password = req.body.password;
  var sql =
    "SELECT fullname,username FROM users WHERE username =? AND password =?";
  db.query(sql, [username, password], function (err, data, fields) {
    if (err) throw err;
    if (data.length > 0) {
      console.log("login success");
      res.status(200).send({
        code: 200,
        message: "User found",
        status: "ok",
        user: data,
      });
    } else {
      console.log("login fail");
      res.status(200).send({
        code: 200,
        message: "User not found",
        status: "error",
        user: "",
      });
    }
  });
});

app.post("/api/additems", (req, res) => {
  console.log("Result", req.body);

  const singleItemsData = {
    imgTimestamp: req.body.imgTimestamp,
    stockName: req.body.stockName,
    scanCode: req.body.scanCode,
    stockAmount: req.body.stockAmount,
    stockPrice: req.body.stockPrice,
  };

  var exist = false;
  var results;
  let findExist = `SELECT stockName FROM inventory WHERE stockName = '${singleItemsData.stockName}' OR scanCode = '${singleItemsData.scanCode}'`;
  let checkQuery = db.query(findExist, (err, result, fields) => {
    if (err) throw err;

    if (result.length >= 1) {
      console.log("Item already exists");
      exist = true;
      res.status(200).send({
        code: 200,
        message: `this item already exists. `,
        status: "error",
      });
    } else {
      let sql = "INSERT INTO inventory SET ?";
      let query = db.query(sql, singleItemsData, (err, result, fields) => {
        if (err) throw err;
        results = result + "    /  " + fields;
        console.log("Stock inserted successfully");
        res.status(200).send({
          code: 200,
          message: "Stock added successfully",
          status: "ok",
        });
      });
    }
  });
});
app.get("/api/getitems", (req, res) => {
  var sql = "SELECT * FROM inventory";
  db.query(sql, function (err, data, fields) {
    if (err) throw err;
    if (data.length > 0) {
      res.status(200).send({ code: 200, data: data });
    } else {
      res.status(200).send({ code: 200, data: [] });
    }
  });
});
app.post("/api/deliveritems", (req, res) => {
  console.log("Result", req.body);

  const deliveryData = {
    imgName: req.body.imgName,
    deliveryDate: req.body.deliveryDate,
    deliveryTime: req.body.deliveryTime,
    deliveredBy: req.body.deliveredBy,
    items: req.body.items,
  };

  const itemList = JSON.parse(deliveryData.items);

  itemList.forEach((item) => {
    const query = `UPDATE inventory SET stockAmount = stockAmount + ${item.stockAmount} WHERE stockName = '${item.stockName}'`;
    db.query(query, (err, results, fields) => {
      if (err) throw err;

      let sql = "INSERT INTO delivery SET ?";
      let query = db.query(sql, deliveryData, (err, result, fields) => {
        if (err) throw err;
        results = result + "    /  " + fields;
        console.log("Stock delivered successfully");
        res.status(200).send({
          code: 200,
          message: "Stock delivered successfully",
          status: "ok",
        });
      });
    });
  });
});
app.post("/api/pickupitems", (req, res) => {
  console.log("Result", req.body);

  const pickupData = {
    imgName: req.body.imgName,
    pickupDate: req.body.pickupDate,
    pickupTime: req.body.pickupTime,
    pickedupBy: req.body.pickedupBy,
    items: req.body.items,
  };

  const itemList = JSON.parse(pickupData.items);

  let allItemsInStock = true;

  itemList.forEach((item) => {
    const query = `SELECT stockAmount FROM inventory WHERE stockName = '${item.stockName}'`;

    db.query(query, (err, results, fields) => {
      if (err) throw err;

      const currentStockAmount = results[0].stockAmount;

      if (currentStockAmount < item.stockAmount) {
        allItemsInStock = false;

        res.status(400).send({
          code: 400,
          message: `Not enough stock for ${item.stockName}`,
          status: "error",
        });
      } else if (allItemsInStock) {
        itemList.forEach((item) => {
          const query = `UPDATE inventory SET stockAmount = stockAmount - ${item.stockAmount} WHERE stockName = '${item.stockName}' AND stockAmount >= ${item.stockAmount}`;
          db.query(query, (err, results, fields) => {
            if (err) throw err;

            let sql = "INSERT INTO pickup SET ?";
            let query = db.query(sql, pickupData, (err, result, fields) => {
              if (err) throw err;

              console.log("Stock picked up successfully");
              res.status(200).send({
                code: 200,
                message: "Stock picked up successfully",
                status: "ok",
              });
            });
          });
        });
      }
    });
  });

  
});

server.listen(port, "0.0.0.0", () => {
  console.log("server started");
});
