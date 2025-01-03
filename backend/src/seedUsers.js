import User from './models/User.js'; // Adjust path to your User model
import sequelize from './config/database.js'; // Adjust path to your database config

const users = [
  { username: 'admin', email: 'admin@example.com', password: 'admin123', role: 'Admin' },
  { username: 'doctor', email: 'doctor@example.com', password: 'doctor123', role: 'Doctor' },
  { username: 'PG', email: 'pg@example.com', password: 'doctor123', role: 'PG' },
  { username: 'intern', email: 'intern@example.com', password: 'doctor123', role: 'Intern' },
  { username: 'intern1', email: 'intern1@example.com', password: 'doctor123', role: 'Intern' },
  { username: 'intern2', email: 'intern2@example.com', password: 'doctor123', role: 'Intern' },
  { username: 'nurse', email: 'nurse@example.com', password: 'nurse123', role: 'Nurse' },
];

const seedUsers = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    // Sync User model (create table if it doesn't exist)
    await User.sync({ force: true });

    // Seed users
    const createdUsers = await Promise.all(
      users.map((user) => User.create(user))
    );
    console.log('Users seeded:', createdUsers);
  } catch (error) {
    console.error('Error seeding users:', error);
  } finally {
    process.exit(); // Exit script after execution
  }
};

seedUsers();
