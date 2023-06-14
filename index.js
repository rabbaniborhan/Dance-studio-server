const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;

//  middleware

app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.msnuvxp.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const database = client.db("danceDb");
    const classCollection = database.collection("classes");
    const UsersCollection = database.collection("Users");
    const cartCollection = database.collection("carts");

    // popular calss and popular instructor section
    app.get("/popularclass", async (req, res) => {
      const query = {};
      const options = {
        sort: { EnrollSeats: -1 },
      };
      const result = await classCollection
        .find(query, options)
        .limit(6)
        .toArray();
      res.send(result);
    });

    app.get("/popularinstructor", async (req, res) => {
      const filter = { role: "instructor" };
      const options = {
        sort: { enrollseats: -1 },
      };
      const result = await UsersCollection.find(filter, options)
        .limit(6)
        .toArray();
      res.send(result);
    });

    // all calss and all instructor section
    app.get("/allinstructor", async (req, res) => {
      const filter = { role: "instructor" };
      const options = {
        sort: { enrollseats: -1 },
      };
      const result = await UsersCollection.find(filter, options).toArray();
      res.send(result);
    });

    app.get("/allclass", async (req, res) => {
      const result = await classCollection.find().toArray();
      res.send(result);
    });

    // user collection apis

    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { Email: user.Email };
      const existingUser = await UsersCollection.findOne(query);
      if (existingUser) {
        return res.send({
          message: "this user already added in userCollection",
        });
      }
      const result = await UsersCollection.insertOne(user);
      res.send(result);
    });

    app.get("/users", async (req, res) => {
      const users = await UsersCollection.find().toArray();
      res.send(users);
    });

    app.patch("/users/admin/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: "admin",
        },
      };

      const result = await UsersCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.patch("/users/instructor/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: "instructor",
        },
      };

      const result = await UsersCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.delete("/users/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await UsersCollection.deleteOne(query);
      res.send(result);
    });

    // cart collection apis

    app.get("/carts", async (req, res) => {
      const email = req.query.email;
      if (!email) {
        res.send([]);
      }
      const query = { email: email };
      const result = await cartCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/carts", async (req, res) => {
      const item = req.body;
      const result = await cartCollection.insertOne(item);
      res.send(result);
    });

    app.delete("/carts/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await cartCollection.deleteOne(query);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("dance studio is going");
});

app.listen(port, () => {
  console.log(`dance studio is running on port ${port}`);
});
