const express = require("express");
const dotenv = require("dotenv").config();
const session = require('express-session')
const bodyParser = require('body-parser')
const mongo = require("mongodb");

const app = express()
  .use(express.static(__dirname + "/src"))
  .set("views", "views")
  .use(session({
    resave: true,
    saveUninitialized: true,
    secret: process.env.SESSION_SECRET,
    cookie: {maxAge: 60000}
  }))
  .use(bodyParser.urlencoded({ extended: false }))
  .use(bodyParser.json());

  // app.use(session({ secret: 'keyboard cat', cookie: { maxAge: 60000 }}))


const http = require("http").Server(app);
const io = require("socket.io")(http);
const port = process.env.PORT || 3500;

const { MongoClient } = require("mongodb");

const uri = process.env.DB_NAME;

let chatData;
let reqObject;

async function GetFromDB(collection) {
  const client = new mongo.MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  try {
    await client.connect();
    const db = client.db("dating-base");
    const data = await db
      .collection(`${collection}`)
      .find({})
      .toArray();
    return data;
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

async function removeFromDB(room) {
  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  try {
    await client.connect();
    const db = client.db("dating-base");
    const deleteDocument = await db
      .collection("matches")
      .deleteOne({ roomID: room });
    return deleteDocument;
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

async function updateInCollection(nameOfDocument, newValue) {
  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  try {
    await client.connect();
    const db = client.db("dating-base");
    const updatedDocument = await db
      .collection("matches")
      .updateOne(
        { roomID: `${nameOfDocument}` },
        { $set: { lastMessage: `${newValue}` } }
      );
    return updatedDocument;
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

async function createNewCollection(nameOfNewCollection) {
  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  try {
    await client.connect();
    const db = client.db("dating-base");
    const newCollection = await db.createCollection(`${nameOfNewCollection}`);
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

// createNewCollection('match-Claudia-Janno-5e6fcac84d32897c95566666');

async function writeDb(data, collection) {
  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  try {
    await client.connect();
    const db = client.db("dating-base");
    const fullDump = await db.collection(`${collection}`).insertOne({
      from: data.sender,
      msg: data.msg,
      time: data.time
    });
    return fullDump;
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

io.on("connection", function(socket) {
  // TODO: add a create-collection event

  socket.on("open chat", async function(roomID) {
    chatData = await GetFromDB(roomID);
    socket.join(roomID);
    io.to(roomID).emit("open chat", chatData);
  });

  // creates a new collection and writes the text message in it
  socket.on("make new chat", async function(data) {
    chatData = await createNewCollection(data.room);
    writeDb(data, data.room);
    updateInCollection(data.room, data.msg);
    io.to(data.room).emit("chat message", {
      from: data.sender,
      msg: data.msg,
      time: data.time,
      room: data.room
    });
  });

  // normal message handler
  socket.on("chat message", function(data) {
    writeDb(data, data.room);
    updateInCollection(data.room, data.msg);
    io.to(data.room).emit("chat message", {
      from: data.sender,
      msg: data.msg,
      time: data.time,
      room: data.room
    });
  });

  // delete message handler
  socket.on("leave room", function(room) {
    socket.leave(room);
  });

  socket.on("unmatch", function(room) {
    socket.leave(room);
    removeFromDB(room);
  });
});

app.set("view engine", "ejs");
app.get("/", async (req, res, next) => {

  if(req.session.user) {
    console.log("new sesh ",req.session.user)
  }else{
    req.session.user = 'Janno';
    console.log("already ",req.session.user)
  }
  const newMatches = [];
  const oldMatches = [];
  const matches = await GetFromDB("matches");
  matches.forEach(match => {
    if (match.lastMessage == "") {
      newMatches.push(match);
    } else {
      oldMatches.push(match);
    }
  });
  res.render("chat.ejs", { oldMatches: oldMatches, newMatches: newMatches, user: req.session.user });
});
  
  app.post('/', async function(req, res) {
    var username = req.body.username;
      req.session.user = username;
    const newMatches = [];
    const oldMatches = [];
    const matches = await GetFromDB("matches");
    matches.forEach(match => {
      if (match.lastMessage == "") {
        newMatches.push(match);
      } else {
        oldMatches.push(match);
      }
    });
    res.render("chat.ejs", { oldMatches: oldMatches, newMatches: newMatches, user: req.session.user });
});

http.listen(process.env.PORT || port, () =>
  console.log(`Dating app on ${port}!`)
);
