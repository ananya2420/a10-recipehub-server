const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const { ObjectId } = require('mongodb');
const { createRemoteJWKSet, jwtVerify } = require('jose-cjs');

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

const JWKS = createRemoteJWKSet(
  new URL("http://localhost:3000/api/auth/jwks")
);

// Corrected Middleware
const verifyToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    console.log("Auth header received:", authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log("Missing or malformed Authorization header");
        return res.status(401).json({ message: "unauthorized" });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
        console.log("Token missing after Bearer");
        return res.status(401).json({ message: "unauthorized" });
    }

    try {
        // Verify the token using the JWKS
        const { payload } = await jwtVerify(token, JWKS);
        
        req.user = payload; 
        req.userToken = token;
        
        console.log("Token verified successfully");
        next();
    } catch (err) {
        console.error("Token verification failed:", err.message);
        return res.status(401).json({ message: "unauthorized - invalid token" });
    }
};

// Uncomment the line below if you want to protect ALL routes:
// app.use(verifyToken);

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

    app.post('/foods', verifyToken, async (req, res) => {
      const food = req.body;
      const result = await recipeCollection.insertOne(food);
      res.send(result);
    });

    app.get("/recips", async (req, res) => {
      const { search } = req.query;

      const query = {};
      if (search && search !== "undefined") {
          query.$or = [
              { title: { $regex: search, $options: 'i' } },
              { description: { $regex: search, $options: 'i' } }
          ];
      }

      let result = await recipeCollection.find(query).toArray();

      if (search && result.length === 0) {
          result = await recipeCollection.find({}).toArray();
      }

      res.send(result);
    });

    app.get("/recipe/:id", async (req, res) => {
      try {
          const { id } = req.params;
          
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

//git rm --cached .env