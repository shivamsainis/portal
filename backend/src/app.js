import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import express from 'express';
import http from 'http';
import cors from 'cors';
import bodyParser from 'body-parser';
import typeDefs from './graphql/schema.js'; // GraphQL schema
import resolvers from './graphql/resolvers.js'; // Resolvers
import sequelize from './config/database.js';

//models
import User from './models/User.js';
import Patient from './models/Patient.js';
import Investigation from './models/Investigation.js';
import PatientUnits from './models/PatientUnits.js';

// User to Investigation: Created By
User.hasMany(Investigation, { as: 'createdInvestigations', foreignKey: 'createdById' });
Investigation.belongsTo(User, { as: 'createdBy', foreignKey: 'createdById' });

// User to Investigation: Done By
User.hasMany(Investigation, { as: 'doneInvestigations', foreignKey: 'doneBy' });
Investigation.belongsTo(User, { as: 'doneByUser', foreignKey: 'doneBy' });

// Patient to Investigation: A patient can have many investigations
Patient.hasMany(Investigation, { as: 'investigations', foreignKey: 'patientId' });
Investigation.belongsTo(Patient, { as: 'patient', foreignKey: 'patientId' });

// Patient to PatientUnits: A patient can have multiple units/departments
Patient.hasMany(PatientUnits, { as: 'units', foreignKey: 'patientId' });
PatientUnits.belongsTo(Patient, { as: 'patient', foreignKey: 'patientId' });


sequelize
  .authenticate()
  .then(() => {
    console.log('Database connection established successfully.');
    return sequelize.sync({alter:true});
  })
  .then(() => {
    console.log('Database and tables synced successfully.');
  })
  .catch((err) => {
    console.error('Error connecting to the database or syncing:', err);
  });

// Create an Express application
const app = express();

// Create an HTTP server
const httpServer = http.createServer(app);

// Create an Apollo Server instance
const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })], 
});

// Start the Apollo Server
await server.start();



app.use(
  '/graphql',
  cors(),
  bodyParser.json(),
  expressMiddleware(server, {
    context: async ({ req }) => {
      const token = req.headers.authorization || '';
      let user = null;

      if (token) {
        try {
          // Decode the token
          const decoded = JSON.parse(Buffer.from(token, 'base64').toString());

          // Fetch the full user details from the database
          user = await User.findOne({
            where: { id: decoded.id },
            attributes: ['id', 'role', 'defaultUnit', 'defaultDepartment'], // Only fetch necessary fields
          });

          if (!user) {
            console.error('User not found in the database.');
          }
        } catch (err) {
          console.error('Invalid token:', err.message);
        }
      }

      return { user };
    },
  })
);


// Start the HTTP server
await new Promise((resolve) =>
  httpServer.listen({ port: 4000 }, resolve)
);

console.log(`🚀 Server ready at http://localhost:4000/graphql`);
