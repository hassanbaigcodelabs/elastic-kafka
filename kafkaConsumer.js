const { Kafka } = require('kafkajs');
const redis = require('redis');

const kafka = new Kafka({
  clientId: 'mern-app',
  brokers: ['localhost:9092'],
});

const consumer = kafka.consumer({ groupId: 'cache-group' });
const redisClient = redis.createClient();

const consumeCacheUpdates = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: 'cache-updates', fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const data = JSON.parse(message.value.toString());
      console.log(`Cache update received: ${JSON.stringify(data)}`);
      
      // Update Redis cache with the received data
      redisClient.set(data.key, JSON.stringify(data.value), (err, reply) => {
        if (err) {
          console.error('Error updating cache', err);
        } else {
          console.log('Cache updated', reply);
        }
      });
    },
  });
};

consumeCacheUpdates();
