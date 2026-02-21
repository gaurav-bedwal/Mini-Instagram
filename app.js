require("dotenv").config();

const express = require("express");
const session = require("express-session");
const methodOverride = require("method-override");
const path = require("path");
const db = require("./config/db");

const app = express();

/* DB */
db();

/* VIEW ENGINE */
app.set("view engine","ejs");
app.set("views", path.join(__dirname,"views"));

/* MIDDLEWARE */
app.use(express.static(path.join(__dirname,"public")));
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(methodOverride("_method"));

app.use(session({
  secret:process.env.SESSION_SECRET,
  resave:false,
  saveUninitialized:false
}));

/* ROUTES */
app.use("/", require("./routes/auth"));
app.use("/", require("./routes/post"));

/* SOCKET SERVER */
const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer(app);
const io = new Server(server);

app.set("io", io);

io.on("connection",(socket)=>{
  console.log("Socket connected");
});

/* START */
server.listen(3000,()=>{
  console.log("Server running on http://localhost:3000");
});