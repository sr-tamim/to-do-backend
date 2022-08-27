const express = require('express')
const app = express()
const { MongoClient } = require('mongodb')
const cors = require('cors')
const path = require('path');
const serverless = require('serverless-http');
const port = process.env.PORT || 5000
require('dotenv').config()

// middlewares
app.use(cors())
app.use(express.json())
const router = express.Router()

router.get('/', (req, res) => res.send(`to-do app server is running on port ${port}`))


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@tasks-cluster.0fwv4yi.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });



client.connect()

async function getAllTasks(collection) {
    const cursor = collection.find({})
    const result = await cursor.toArray()
    return result
}

router.get('/tasks/:email', async (req, res) => {
    const tasksCollection = client.db('to-do-srt').collection(req.params.email)
    const result = await getAllTasks(tasksCollection)
    res.json(result)
})
router.post('/tasks/:email', async (req, res) => {
    const tasksCollection = client.db('to-do-srt').collection(req.params.email)
    const result = await tasksCollection.insertOne(req.body)
    const allTasks = await getAllTasks(tasksCollection)
    res.json({ ...result, allTasks })
})
router.post('/tasks/addMultipleTasks/:email', async (req, res) => {
    const tasksCollection = client.db('to-do-srt').collection(req.params.email)
    const result = await tasksCollection.insertMany(req.body)
    const allTasks = await getAllTasks(tasksCollection)
    res.json({ ...result, allTasks })
})
router.delete('/tasks/:email', async (req, res) => {
    const tasksCollection = client.db('to-do-srt').collection(req.params.email)
    const { taskAddedTime } = req.body
    const query = { taskAddedTime };
    const result = await tasksCollection.deleteOne(query);
    const allTasks = await getAllTasks(tasksCollection)
    res.json({ ...result, allTasks })
})
router.put('/tasks/:email', async (req, res) => {
    const tasksCollection = client.db('to-do-srt').collection(req.params.email)
    const changedTask = req.body
    delete changedTask._id
    const filter = { taskAddedTime: changedTask.taskAddedTime };
    const updateDoc = { $set: changedTask };
    const result = await tasksCollection.updateOne(filter, updateDoc, { upsert: false });
    const allTasks = await getAllTasks(tasksCollection)
    res.json({ ...result, allTasks })
})


app.use('/.netlify/functions/server', router);  // path must route to lambda
app.use('/', (req, res) => res.sendFile(path.join(__dirname, './index.html')));

module.exports = app;
module.exports.handler = serverless(app);