import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const OrderCounter = sequelize.define('OrderCounter', {
  
  currentOrderNo: {
    type: DataTypes.INTEGER,
    defaultValue: 0, 
    allowNull: false,
  },
},
  {
    timestamps: false, // No createdAt/updatedAt fields needed
});

export default OrderCounter;
