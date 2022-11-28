const { MongoClient, ObjectId} = require('mongodb');
const express = require ('express')
const cors = require('cors')
require('dotenv').config()
var jwt = require('jsonwebtoken')

const app = express()
const port = process.env.PORT || 5000
app.use(cors())
app.use(express.json())


const { query } = require('express');
const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);


function verifyJWT(req,res,next){
    const authHead = req.headers.authorization 
    console.log("authhead failed---------------------------",authHead)
    if(!authHead){
       return res.status(401).send({message:"unAuthorized user"})
    }
    const token = authHead.split(' ')[1]
    jwt.verify(token,process.env.ACCESS_TOKEN,function(err,decoded){
        if(err){
           return res.status(403).send({message:"Forbidden user"})
        }
        req.decoded = decoded 
        next()
    })
}

async function run(){
   try{
        const cartCollection = client.db("HerBrand").collection("cart-products")
        const productsCollection = client.db("HerBrand").collection("products")
        const categoryCollection = client.db("HerBrand").collection("category")

        app.post('/jwt',(req,res)=>{
            const user = req.body 
            const token = jwt.sign(user, process.env.ACCESS_TOKEN ,{expiresIn:"5h"})
            res.send({token})
        })
        
        app.post('/product',async(req,res)=>{
            const product = req.body
            const result = await cartCollection.insertOne(product)
            res.send(result)
        })
        
        app.get('/cartProducts',verifyJWT,async(req,res)=>{
            if(req.decoded.email!==req.query.email){
                return res.status(403).send({message:"Forbidden user"})
            }
            const email = req.query.email 
            let query = {}
            if(email){
                query={email:email}
            }
            const corsur = cartCollection.find(query)
            const products = await corsur.toArray()
            res.send(products)
        })

        app.get('/cartProduct/:id',async(req,res)=>{
            const id = req.params.id
            const query = {_id:ObjectId(id)}
            const result = await cartCollection.findOne(query)
            res.send(result)
        })

        app.put('/cartProducts/:id',verifyJWT,async(req,res)=>{
            const id = req.params.id
            const products = req.body
            const {title,weight,type,totalQuantity,totalPrice,category,picture} = products
            const filter = {_id:ObjectId(id)}
            const options = { upsert: true };
            const product ={
                $set : {
                    title:title,
                    weight:weight,
                    type:type,
                    productQuantity:totalQuantity,
                    price:totalPrice,
                    category:category,
                    picture:picture
                }
            }

            const result = await cartCollection.updateOne(filter,product,options)
            res.send(result)
        })

        app.delete('/cartProducts/:id',verifyJWT,async(req,res)=>{
            const id = req.params.id
            const query = {_id:ObjectId(id)}
            const result = await cartCollection.deleteOne(query)
            res.send(result)
        })

        // product api 
        app.get('/products',async(req,res)=>{
            const page = parseInt(req.query.page)
            const size = parseInt(req.query.size)

            const cursor = productsCollection.find({})
            const products = await cursor.skip(page*size).limit(size).toArray()
            const count = await productsCollection.count()
            res.send({count,products})
        })

        app.get('/product/:id',async(req,res)=>{
            const id = req.params.id
            const query ={_id:ObjectId(id)}
            const result = await productsCollection.findOne(query)
            res.send(result)
        })

        app.get("/category",async(req,res)=>{
            const cursor = categoryCollection.find({})
            const category =  await cursor.toArray()
            res.send(category)
           
        })

        app.get("/category/:id",async(req,res)=>{
            const id = req.params.id
            const query = {categoryid:id}
            const cursor = productsCollection.find(query)
            const result = await cursor.toArray()
            res.send(result)
        })

   }
   finally{

   }
}

run().catch(error=>console.dir)


app.get('/categories/:id',(req,res)=>{
    const id=req.params.id
    const categoryItem = products.filter(product=>product.categoryid==id)
    res.send(categoryItem) 
})


app.listen(port,()=>{
    console.log(`herbrand server is running on ${port}`)
})
