const express = require('express');
const cors=require('cors');
const app = express();
const port = 5000;
require('dotenv').config();

app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion } = require('mongodb');

// Middleware to parse JSON (Standard practice for Express apps)
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello World!');
});

const uri = process.env.MONGO_DB_URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server
    await client.connect();

     const database = client.db("recipehub_db");
    const foodCollection = database.collection("foods");

    app.post('/foods',async(req,res)=>{
        const food=req.body;
        const result=await foodCollection.insertOne(food);
        res.send(result);

    })


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err);
  }
}

// Run the connection function
run();

// Start the server
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});