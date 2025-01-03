
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Patient = sequelize.define('Patient', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  uhid: {
    type: DataTypes.STRING,
    allowNull: false,
    index:true,
  },
  prefix: {
    type: DataTypes.STRING,
    defaultValue: new Date().getFullYear().toString().slice(-2) + '/', // Current year as default
  },
  suffix: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  final_uhid: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  age: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  gender: {
    type: DataTypes.ENUM('Male', 'Female', 'Other'),
    allowNull: false,
  },
  },
  

);

Patient.beforeValidate((patient) => {
  // Generate final_ip_no
  if (patient.uhid) {
    patient.final_uhid = `${patient.prefix}${patient.uhid}${patient.suffix || ''}`;
  }

});

export default Patient;
