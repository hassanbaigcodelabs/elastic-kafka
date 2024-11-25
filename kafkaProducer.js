const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'mern-app',
  brokers: ['localhost:9092'],
});

const producer = kafka.producer();

const sendMessageToKafka = async (message) => {
  await producer.connect();
  await producer.send({
    topic: 'cache-updates',
    messages: [
      { value: JSON.stringify(message) },
    ],
  });
  console.log('Message sent to Kafka');
  await producer.disconnect();
};

module.exports = sendMessageToKafka;
