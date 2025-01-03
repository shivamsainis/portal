import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';


const PatientUnits = sequelize.define('PatientUnits', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  unit: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  department: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

export default PatientUnits;
