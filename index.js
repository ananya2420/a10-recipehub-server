const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const { ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

const uri = process.env.MONGO_DB_URI;

// Create a MongoClient
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
    const recipeCollection = database.collection("recips");

    // Routes
    app.get('/', (req, res) => {
      res.send('RecipeHub Server is running!');
    });

    app.post('/foods', async (req, res) => {
      const food = req.body;
      const result = await recipeCollection.insertOne(food);
      res.send(result);
    });

   
    app.get("/recips", async (req, res) => {
    const { search } = req.query;
    //console.log(search)
    

    const query = {};
    if (search && search !="undefined") {
        query.$or = [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
        ];
    }

   

    let result = await recipeCollection.find(query).toArray();

    // FALLBACK: If search term resulted in 0 items, return all items instead
    if (search && result.length === 0) {
        result = await recipeCollection.find({}).toArray();
    }

    res.send(result);
});

// app.get("/recipe/:id",async(req,res)=>{
//       const {id}=req.params;

//       const result=await recipeCollection.findOne({_id:new ObjectId(id)})

//       res.send(result)
//     })


app.get("/recipe/:id", async (req, res) => {
    try {
        const { id } = req.params;
        
        // Safety: check if ID format is valid before querying
        if (!ObjectId.isValid(id)) {
            return res.status(400).send({ message: "Invalid ID format" });
        }

        const result = await recipeCollection.findOne({ _id: new ObjectId(id) });
        
        if (!result) {
            return res.status(404).send({ message: "Recipe not found" });
        }
        
        res.send(result);
    } catch (error) {
        res.status(500).send({ message: "Server error" });
    }
});

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err);
  }
}

run().catch(console.dir);

// Start the server
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});