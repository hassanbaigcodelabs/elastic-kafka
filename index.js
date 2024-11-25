import mongoose from 'mongoose';
import searchProducts from './searchproduct.js';

const MONGO_URI = 'mongodb://127.0.0.1:27017/mydatabase'; // Replace with your MongoDB URI

(async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);

    // Search for products
    const query = 'laptop'; // Replace with your search term
    const results = await searchProducts(query);

    console.log('Search Results:', results);

    // Close MongoDB connection
    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
  }
})();
