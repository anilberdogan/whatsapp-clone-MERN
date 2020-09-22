//importing
import express from 'express';
import mongoose from 'mongoose';
import dbMessages from './dbMessages.js';
import Pusher  from 'pusher';
import cors from 'cors';
import connection_url from './env.js';  // In ev.js file I store a const variable which keeps my url for DB. I just exported it to here.

//app config

const app=express()
const port = process.env.PORT || 9000

const pusher = new Pusher({
    appId: '1075396',
    key: 'a3db20963fa6c9f0fed5',
    secret: 'dfc17c5d0422b72e3ce3',
    cluster: 'eu',
    encrypted: true
  });

//middleware
app.use(express.json());

app.use(cors())



//DB config
mongoose.connect(connection_url,{
    useCreateIndex:true,
    useNewUrlParser:true,
    useUnifiedTopology:true
})

const db = mongoose.connection

db.once('open',()=>{
    console.log("db is connected")

    const msgCollection= db.collection("messagecontents");
    const changeStream=msgCollection.watch();

    changeStream.on('change',(change)=>{
        console.log(change)

        if(change.operationType === 'insert'){
            const messageDetails = change.fullDocument;
            pusher.trigger('messages','inserted',
            {
                name: messageDetails.name,
                message: messageDetails.message,
                timestamp:messageDetails.timestamp,
                recieved:messageDetails.recieved
            });
        } else{
            console.log("Error triggering Pusher");
        }
    })

    

})

// api routes
app.get('/',(req,res)=>res.status(200).send('hello world'));

app.post('/messages/new',(req,res)=> {
    const dbMessage= req.body

    dbMessages.create(dbMessage, (err,data)=>{
        if(err){
            res.status(500).send(err)
        } else{
            res.status(201).send(data)
        }
    }) 
})

app.get('/messages/sync',(req,res)=>{
    dbMessages.find((err,data)=>{
        if(err){
            res.status(500).send(err)
        } else {
            res.status(200).send(data)
        }
    })
})


//listen
app.listen(port,()=>console.log(`Listening on localhost:${port}`))
