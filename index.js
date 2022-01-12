const express = require('express')
const app = express()
const { MongoClient } = require('mongodb')
const cors = require('cors')
const port = process.env.PORT || 5000
require('dotenv').config()

// middlewares
app.use(cors())
app.use(express.json())

app.get('/', (req, res) => res.send(`to-do app server is running on port ${port}`))



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.6ghhv.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
    try {
        await client.connect()

        const tasksCollection = client.db('toDoApp').collection('tasks')

        app.get('/tasks', async (req, res) => {
            const cursor = tasksCollection.find({})
            const result = await cursor.toArray()
            res.json(result)
        })
        app.post('/tasks', async (req, res) => {
            const result = await tasksCollection.insertOne(req.body)
            res.json(result)
        })
        app.delete('/tasks', async (req, res) => {
            const { timeStamp } = req.body
            const query = { timeStamp };
            const result = await tasksCollection.deleteOne(query);
            res.json(result)
        })
        app.put('/tasks', async (req, res) => {
            const changedTask = req.body
            delete changedTask._id
            const filter = { timeStamp: changedTask.timeStamp };
            const updateDoc = { $set: changedTask };
            const result = await tasksCollection.updateOne(filter, updateDoc, { upsert: false });
            res.json(result)
        })
    } finally {
        // await client.close()
    }
}


run().catch(console.dir)

app.listen(port, () => console.log(`listening to port http://localhost:${port}`))