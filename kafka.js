const express = require('express');
const redis = require('redis');
const mongoose = require('mongoose');
const sendMessageToKafka = require('./kafkaProducer');

const app = express();
const PORT = 3000;

// Initialize Redis client
const redisClient = redis.createClient({
  url: 'redis://localhost:6379', // Adjust to your Redis setup
});

// Handle Redis client connection
const connectRedis = async () => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect(); // Explicitly connect the Redis client
      console.log('Connected to Redis');
    }
  } catch (err) {
    console.error('Error connecting to Redis:', err);
  }
};

// MongoDB connection
mongoose.connect('mongodb://localhost/mern-stack-db', {
  useNewUrlParser: true, // Safe to remove these options in newer versions
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

// Define the data model
const DataModel = mongoose.model('Data', new mongoose.Schema({
  key: String,
  value: String,
}));

// Cache middleware
const checkCache = async (req, res, next) => {
  const { key } = req.params;

  try {
    const data = await redisClient.get(key);
    if (data) {
      return res.json(JSON.parse(data)); // Return cached data
    } else {
      next(); // Proceed to MongoDB if not in cache
    }
  } catch (err) {
    console.error('Redis get error:', err);
    res.status(500).send('Redis error');
  }
};

// Get data with caching
app.get('/data/:key', checkCache, async (req, res) => {
  const { key } = req.params;

  try {
    const data = await DataModel.findOne({ key });

    if (data) {
      // Cache the data for future requests
      await redisClient.set(key, JSON.stringify(data));
      return res.json(data);
    } else {
      res.status(404).send('Data not found');
    }
  } catch (err) {
    console.error('MongoDB query error:', err);
    res.status(500).send('Database error');
  }
});

// Insert data and send cache update
app.post('/data', express.json(), async (req, res) => {
  const { key, value } = req.body;

  try {
    const newData = new DataModel({ key, value });
    await newData.save();

    // Send update to Kafka for other Node.js pods to update cache
    sendMessageToKafka({ key, value });

    res.status(201).send('Data inserted');
  } catch (err) {
    console.error('Data insert error:', err);
    res.status(500).send('Error saving data');
  }
});

// Start the server and connect Redis
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  await connectRedis(); // Connect Redis when starting the server
});
