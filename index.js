const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const stripe = require('stripe')(process.env.PAYMENT_SECRET_KEY)
const port = process.env.PORT || 5000;

//  middleware

app.use(cors());
app.use(express.json());

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res
      .status(401)
      .send({ error: true, message: "unauthorized access" });
  }

  const token = authorization.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res
        .status(401)
        .send({ error: true, message: "unauthorized access" });
    }
    req.decoded = decoded;
    next();
  });
};








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
   

    const database = client.db("danceDb");
    const classCollection = database.collection("classes");
    const UsersCollection = database.collection("Users");
    const cartCollection = database.collection("carts");
    const paymentCollection = database.collection("payment");

    const verifyAdmin = async (req,res,next)=>{
      const email = req.decoded.email;
      const query = {Email : email};
      const user =await UsersCollection.findOne(query);
      if ( user.role !== "admin"){
        return res.status(403).send({error:true , message:'forbidden message'})
      }
      next();
    }

    const verifyInstructor = async (req,res,next)=>{
      const email =req.decoded.email;
      const query = {Email : email};
      const user = await UsersCollection.findOne(query);
      if(user.role !=='instructor'){
        return res.status(403).send({error:true, message:'forbidden message'})
      }
      next()
    }



    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1d",
      });
      res.send({ token });
    });

    // popular calss and popular instructor section
    app.get("/popularclass", async (req, res) => {
      const query = {};
      const filter ={Status:"approved"}
      // const options = {
      //   sort: { EnrollSeats: 1 },
      // };
      const result = await classCollection
        .find(filter,query).sort({  EnrollSeats: -1 })
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

    app.post('/addclass',async(req,res)=>{
      const addClass = req.body;
      const result = await classCollection.insertOne(addClass)
      res.send(result);
    })

    app.get('/myclass/:email',async(req,res)=>{
      const email = req.params.email
      if (!email) {
        res.send([]);
      }
      const filter ={ InstructorEmail : email}
      const result = await classCollection.find(filter).toArray();
      res.send(result);
    })



    app.get("/allclass", async (req, res) => {
      const filter ={Status:"approved"}
      const result = await classCollection.find( filter).toArray();
      res.send(result);
    });


    app.get("/allclasses", async (req, res) => {
      const result = await classCollection.find( ).toArray();
      res.send(result);
    });



// update data get apis
    app.get('/class/:id',async(req,res)=>{
      const id = req.params.id;
      const query = {_id:new ObjectId(id)}
      const result=await classCollection.findOne(query);
      res.send(result)
    })

    app.put('/classupdate/:id',async(req,res)=>{
      const id = req.params.id;
      const filter ={_id:new ObjectId(id)}
      const options = { upsert: true };
      const Updateclass =req.body;
     

      const updateDoc = {
        $set: {
         Name:Updateclass.Name,
         Image:Updateclass.Image,
         InstructorName:Updateclass.InstructorName,
         InstructorEmail: Updateclass.InstructorEmail,
         Price: Updateclass.Price,
         Status:Updateclass.Status
         
        },
      };
  

      const result = await classCollection.updateOne(filter,updateDoc,options)
      res.send(result)

    })



    app.patch('/classApprove/:id', async(req,res)=>{
      const  id = req.params.id;
      const filter = {_id : new ObjectId(id)}
      const updateDoc = {
        $set: {
          Status: "approved",
        },
      };
      const result = await classCollection.updateOne(filter,updateDoc);
      res.send(result);
    })
    app.patch('/classdeny/:id', async(req,res)=>{
      const  id = req.params.id;
      const filter = {_id : new ObjectId(id)}
      const updateDoc = {
        $set: {
          Status: "denied",
        },
      };
      const result = await classCollection.updateOne(filter,updateDoc);
      res.send(result);
    })

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

    app.get("/users", verifyJWT,verifyAdmin, async (req, res) => {
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




    app.get('/users/admin/:email',verifyJWT,async(req,res)=>{
      const email = req.params.email;
      if(req.decoded.email !== email){
        res.send ({admin :false})
      }
      const query = {Email:email};
      const user = await UsersCollection.findOne(query)
      const result = {admin:user?.role == 'admin'}
      res.send(result);
    })

    app.get('/users/instructor/:email',async(req,res)=>{
      const email = req . params.email;
     
      // if(req.decoded?.email !== email){
      //  return res.send({instructor:false})
      // }
      const query ={Email:email};
      const user = await UsersCollection.findOne(query);
      const result = {instructor:user?.role == 'instructor'}
       res.send(result);
       
    })


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

    app.get("/carts",verifyJWT, async (req, res) => {
      const email = req.query.email;
      if (!email) {
        res.send([]);
      }

      const decodedEmail = req.decoded.email;
      if(email !== decodedEmail){
        return res.status(403).send({error: true,message:'forbidden access'})
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


    // payment intencse

    app.post('/create-payment-intent', verifyJWT, async (req, res) => {
      const { amount } = req.body;
      const price = parseInt(amount * 100);
      const paymentIntent = await stripe.paymentIntents.create({
        amount: price,
        currency: 'usd',
        payment_method_types: ['card']
      });

      res.send({
        clientSecret: paymentIntent.client_secret
      })
    })


    // admin stats
    app.get('/adminhistory',async(req,res)=>{

      const payments = await paymentCollection.find().toArray();

      const revenue = payments.reduce( ( sum, payment) => sum + payment.amount, 0)
      res.send({revenue})

    })

    // payment api

    app.post('/payments', verifyJWT, async (req, res) => {
      const payment = req.body;
      const classId = payment. classId
     const id = payment. cartItems;
     const query ={ _id: new ObjectId(id)}
    

  
      const updateResult = await classCollection.updateOne(
        {_id:new ObjectId(classId)},
        {$inc:{AvailableSeats:-1,EnrollSeats:+1}}
      )
     const insertResult = await paymentCollection.insertOne(payment);
     const deleteResult = await cartCollection.deleteMany(query)
      res.send({ insertResult,deleteResult,updateResult });
    })


    // paymenthistory

    
    app.get('/mypayment/:email',async(req,res)=>{
      const email = req.params.email
      if (!email) {
        res.send([]);
      }
      const filter ={ email : email}
      const result = await paymentCollection.find(filter).sort({  date: -1 }).toArray();
      res.send(result);
    })




   


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
