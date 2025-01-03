import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

const Investigation = sequelize.define('Investigation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  orderNo: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    defaultValue: () => `INV-${uuidv4()}`,
    index: true,
  },
  patientName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  patientAge: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0,
    },
  },
  patientGender: {
    type: DataTypes.ENUM('Male', 'Female'),
    allowNull: false,
  },
  unit: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  department: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  final_uhid: {
    type: DataTypes.STRING,
    allowNull: true,
    index: true,
  },
  investigationType: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  special: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },

  status: {
    type: DataTypes.ENUM('Pending', 'Accepted', 'Rejected'),
    defaultValue: 'Pending',
    index: true,
  },
}, {
  timestamps: true,
});



export default Investigation;
