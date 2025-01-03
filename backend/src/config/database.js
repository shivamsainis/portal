import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME, // Database name
  process.env.DB_USER, // Username
  
  String(process.env.DB_PASSWORD), // Password
  {
    host: process.env.DB_HOST, // Host (e.g., localhost)
    dialect: 'postgres', // Database type
    // logging: console.log, // Enable to see SQL queries
  }
);

export default sequelize;
