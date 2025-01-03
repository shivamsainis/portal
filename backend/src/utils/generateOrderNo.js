import OrderCounter from '../models/OrderCounter.js';
import sequelize from '../config/database.js';

const generateOrderNo = async () => {
  const yearPrefix = new Date().getFullYear().toString().slice(-2); // E.g., "24" for 2024

  // Start a transaction for atomicity
  const transaction = await sequelize.transaction();

  try {
    // Fetch the single counter row, or create it if it doesn't exist
    const [counter] = await OrderCounter.findOrCreate({
      where: {}, // Assuming there's only one row in this table
      defaults: { currentOrderNo: 0 },
      transaction,
    });

    // Increment the current order number
    const nextNumber = counter.currentOrderNo + 1;

    // Update the counter in the database
    await counter.update(
      { currentOrderNo: nextNumber },
      { transaction }
    );

    // Commit the transaction
    await transaction.commit();

    // Pad the number to ensure it’s 6 digits
    const paddedNumber = nextNumber.toString().padStart(6, '0');
    return `${yearPrefix}${paddedNumber}`; // Combine year prefix and padded number
  } catch (error) {
    // Rollback the transaction on error
    await transaction.rollback();
    console.error('Error in generateOrderNo:', error);
    throw new Error('Failed to generate order number');
  }
};

export { generateOrderNo };
