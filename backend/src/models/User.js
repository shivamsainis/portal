import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4, // Automatically generates a unique ID
    primaryKey: true,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false, // Field is required
  },
  email: {
    type: DataTypes.STRING,
    unique: true, // Ensures no duplicate emails
    validate: {
      isEmail: true, // Checks if the value is a valid email
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true, // Optional for Microsoft accounts
  },
  role: {
    type: DataTypes.ENUM('Admin', 'PG','Intern','Doctor', 'Nurse'), // Restricts to predefined roles
    allowNull: false,
  },
  defaultUnit: { 
    type: DataTypes.STRING,
     allowNull: true },
  defaultDepartment: { 
    type: DataTypes.STRING, 
    allowNull: true },
});

export default User;
