const express = require('express');
const dotenv = require('dotenv').config();
const mongo = require('mongodb')

const app = express()
    .use(express.static(__dirname + '/src'))
    .set('views', 'views');

const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;


const {MongoClient} = require('mongodb');

const uri = process.env.DB_NAME

let chatData;

async function GetFromDB(collection){
    const client = new mongo.MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    try {
		await client.connect();
		const db = client.db('dating-base');
		const data = await db.collection(`${collection}`).find({}).toArray();
        return data
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

async function removeFromDB(room){
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    try {
		await client.connect();
		const db = client.db('dating-base');
        const deleteDocument = await db.collection("matches").deleteOne({ roomID: room });
          return deleteDocument;

    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}


async function updateInCollection(nameOfDocument, newValue){
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    try {
		await client.connect();
		const db = client.db('dating-base');
        const updatedDocument = await db.collection("matches").updateOne({roomID:`${nameOfDocument}`}, { $set:{lastMessage:`${newValue}`}});
          return updatedDocument;

    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}


async function createNewCollection(nameOfNewCollection){
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    try {
		await client.connect();
		const db = client.db('dating-base');
		const newCollection = await db.createCollection(`${nameOfNewCollection}`);
          
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}


// createNewCollection('match-eva-Janno-5e6fcac84d32897c9550051d');


async function writeDb(data, collection){
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    try {
		await client.connect();
		const db = client.db('dating-base');
		const fullDump = await db.collection(`${collection}`).insertOne({
            from:data.sender,
            msg:data.msg,
            time:data.time
            })
        return fullDump   
          
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}


io.on('connection', function(socket){

    // TODO: add a create-collection event 

    socket.on('open chat', async function(roomID){
        chatData = await GetFromDB(roomID);
        socket.emit('open chat', chatData);
    })

    // normal message handler
    socket.on('chat message', function(data){
        writeDb(data, data.room);
        updateInCollection(data.room, data.msg);
        io.emit('chat message', {from: data.sender, msg:data.msg, time:data.time, room:data.room});
    });

    // delete message handler
    socket.on('unmatch', function(room){
        removeFromDB(room);
    });
    
});

app.set('view engine', 'ejs');
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/views/index.html');
  });
  app.get('/chat', async (req, res, next) => {
    const matches = await GetFromDB('matches');
    res.render('chat.ejs', {matches: matches})
});


http.listen((process.env.PORT || port), () => console.log(`Dating app on ${port}!`));
