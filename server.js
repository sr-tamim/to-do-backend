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

// test api
router.get('/', (req, res) => res.send(`to-do app server is running on port ${port}`))

// mongodb uri of the cluster
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@tasks-cluster.0fwv4yi.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


// get all tasks from given collection
async function getAllTasks(collection) {
    const cursor = collection.find({})
    const result = await cursor.toArray()
    return result
}
// get all tasks api
router.get('/tasks/:email', async (req, res) => {
    // connect mongodb
    await client.connect()

    // create/get the collection of tasks of given email
    const tasksCollection = client.db('to-do-srt').collection(req.params.email)

    const result = await getAllTasks(tasksCollection)
    res.json(result)

    // close mongodb connection
    client.close()
})
// add new single task api
router.post('/tasks/:email', async (req, res) => {
    // connect mongodb
    await client.connect()

    // create/get the collection of tasks of given email
    const tasksCollection = client.db('to-do-srt').collection(req.params.email)

    // add the task
    const result = await tasksCollection.insertOne(req.body)

    const allTasks = await getAllTasks(tasksCollection)
    res.json({ ...result, allTasks })

    // close mongodb connection
    client.close()
})
// delete single task api
router.delete('/tasks/:email', async (req, res) => {
    // connect mongodb
    await client.connect()

    // create/get the collection of tasks of given email
    const tasksCollection = client.db('to-do-srt').collection(req.params.email)

    // find out the specific task to delete
    const { taskAddedTime } = req.body
    const query = { taskAddedTime };

    // delete the task
    const result = await tasksCollection.deleteOne(query);

    const allTasks = await getAllTasks(tasksCollection)
    res.json({ ...result, allTasks })

    // close mongodb connection
    client.close()
})
// update single task api
router.put('/tasks/:email', async (req, res) => {
    // connect mongodb
    await client.connect()

    // create/get the collection of tasks of given email
    const tasksCollection = client.db('to-do-srt').collection(req.params.email)

    const changedTask = req.body
    delete changedTask._id

    const filter = { taskAddedTime: changedTask.taskAddedTime };
    const updateDoc = { $set: changedTask };

    // update the task
    const result = await tasksCollection.updateOne(filter, updateDoc, { upsert: false });

    const allTasks = await getAllTasks(tasksCollection)
    res.json({ ...result, allTasks })

    // close mongodb connection
    client.close()
})
// update an array of new tasks api
router.post('/tasks/updateMultipleTasks/:email', async (req, res) => {
    // connect mongodb
    await client.connect()

    // create/get the collection of tasks of given email
    const tasksCollection = client.db('to-do-srt').collection(req.params.email)

    // update multiple tasks
    const result = await tasksCollection.bulkWrite(req.body.map(task => {
        delete task._id
        return {
            updateOne: ({
                filter: ({ taskAddedTime: task.taskAddedTime }),
                update: ({ $set: task })
            })
        }
    }))

    const allTasks = await getAllTasks(tasksCollection)
    res.json({ ...result.result, allTasks })

    // close mongodb connection
    client.close()
})

/* ===== setup backend to deploy as a netlify serverless function ====== */
app.use('/.netlify/functions/server', router);  // path must route to lambda
app.use('/', (req, res) => res.sendFile(path.join(__dirname, './index.html')));

module.exports = app;
module.exports.handler = serverless(app);