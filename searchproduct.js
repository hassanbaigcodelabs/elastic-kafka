import { Client } from '@elastic/elasticsearch';
import Product from './model/Product.js'; // MongoDB Product model
import fs from 'fs';
const esClient = new Client({
  node: 'https://localhost:9200',
  auth: {
    username: 'elastic',
    password: 'ktdpQ1bAYxbjOxGMJwd2',
  },
  ssl: {
    rejectUnauthorized: false, // Only disable for development purposes
  },
});

// Elasticsearch index name
const INDEX_NAME = 'products';

/**
 * Search products by query
 * @param {String} query - The search query
 * @returns {Array} - List of matching products
 * 
 */
export default async function searchProducts(query) {
  try {
    // Step 1: Check Elasticsearch first
    const esResponse = await esClient.search({
      index: INDEX_NAME,
      body: {
        query: {
          match: { name: query }, // Match query on the "name" field
        },
      },
    });

    // Check if we have any hits in Elasticsearch
    if (esResponse.body.hits.total.value > 0) {
      console.log('Fetching from Elasticsearch');
      return esResponse.body.hits.hits.map(hit => hit._source); // Return Elasticsearch results
    }

    // Step 2: Fall back to MongoDB if no products found in Elasticsearch
    console.log('Fetching from MongoDB');
    const products = await Product.find({ name: { $regex: query, $options: 'i' } });

    if (products.length > 0) {
      // Step 3: Index products in Elasticsearch for future queries
      const bulkBody = products.flatMap(product => [
        { index: { _index: INDEX_NAME, _id: product._id.toString() } },
        { ...product.toObject() },
      ]);

      // Bulk index products to Elasticsearch
      const { body: bulkResponse } = await esClient.bulk({ body: bulkBody });
      if (bulkResponse.errors) {
        console.error('Error indexing products:', bulkResponse.errors);
      } else {
        console.log('Indexed products in Elasticsearch');
      }
    }

    return products;
  } catch (error) {
    console.error('Error searching products:', error);
    throw error;
  }
}
