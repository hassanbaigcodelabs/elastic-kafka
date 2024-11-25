import { Client } from '@elastic/elasticsearch';
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

export default esClient;
