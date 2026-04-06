const fs = require('fs');
const path = require('path');

const services = [
  { name: 'public-service', port: 3002 },
  { name: 'intake-service', port: 3003 },
  { name: 'booking-service', port: 3004 },
  { name: 'case-service', port: 3005 },
  { name: 'document-service', port: 3006 },
  { name: 'messaging-service', port: 3007 },
  { name: 'billing-service', port: 3008 },
  { name: 'notification-service', port: 3009 },
  { name: 'admin-service', port: 3010 },
  { name: 'ai-service', port: 3011 },
];

const basePath = path.join(__dirname, '..', 'apps');

if (!fs.existsSync(basePath)) {
  fs.mkdirSync(basePath);
}

services.forEach(service => {
  const servicePath = path.join(basePath, service.name);
  if (!fs.existsSync(servicePath)) fs.mkdirSync(servicePath);

  const pkgObj = {
    name: service.name,
    version: "1.0.0",
    private: true,
    scripts: {
      dev: "node index.js",
      start: "node index.js"
    },
    dependencies: {
      "express": "^4.19.2",
      "cors": "^2.8.5",
      "dotenv": "^16.4.5",
      "@lexdesk/database": "*"
    }
  };

  fs.writeFileSync(path.join(servicePath, 'package.json'), JSON.stringify(pkgObj, null, 2));

  const indexJs = `require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const PORT = process.env.PORT || ${service.port};
// const prisma = new PrismaClient(); // uncomment to use db

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: '${service.name}' });
});

// Implement ${service.name} routes here

app.listen(PORT, () => {
  console.log('${service.name} listening on port ' + PORT);
});
`;

  fs.writeFileSync(path.join(servicePath, 'index.js'), indexJs);
  console.log(`Scaffolded ${service.name}`);
});
