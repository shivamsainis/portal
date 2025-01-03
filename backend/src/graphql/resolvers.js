import User from '../models/User.js';
import Investigation from '../models/Investigation.js';
import Patient from '../models/Patient.js'; 
import PatientUnits from '../models/PatientUnits.js';
import {Op} from "sequelize";

import { generateOrderNo } from '../utils/generateOrderNo.js';
const resolvers = {
  Query: {
    hello: (_, __, { user }) => {
      if (!user || user.role !== "Admin") {
        throw new Error("Access Denied");
      }
      return "Hello Admin!";
    },

    users: async (_, __, { user }) => {
      if (user?.role !== 'Admin') {
        throw new Error("Unauthorized: You don't have access to this query.");
      }

      try {
        return await User.findAll({ attributes: { exclude: ['password'] } });
      } catch (error) {
        console.error('Error fetching users:', error);
        throw new Error('Internal Server Error');
      }
    },


    searchPatients: async (_, { keyword }, { user }) => {
      if (!user) {
        throw new Error('Unauthorized: You must be logged in to search patients.');
      }
    
      try {
        // Step 1: Search within default unit and department
        const defaultResults = await Patient.findAll({
          where: {
            [Op.and]: [
              { [Op.or]: [{ final_uhid: { [Op.iLike]: `%${keyword}%` } }, { name: { [Op.iLike]: `%${keyword}%` } }] },
              { unit: user.defaultUnit },
              { department: user.defaultDepartment },
            ],
          },
          limit: 10, // Limit results for performance
        });
    
        // Step 2: If no results, perform broader search
        if (defaultResults.length === 0) {
          return await Patient.findAll({
            where: {
              [Op.or]: [{ final_uhid: { [Op.iLike]: `%${keyword}%` } }, { name: { [Op.iLike]: `%${keyword}%` } }],
            },
            limit: 10,
          });
        }
    
        return defaultResults;
      } catch (error) {
        console.error('Error during search:', error);
        throw new Error('Internal Server Error');
      }
    },

    investigations: async (_, { orderNo }, { user }) => {
      if (!user || !['Admin', 'Nurse'].includes(user.role)) {
        throw new Error("Unauthorized: You don't have access to this query.");
      }

      try {
        const query = orderNo ? { where: { orderNo } } : {};
        return await Investigation.findAll({
          ...query,
          include: [{ model: User, as: 'createdBy' }],
        });
      } catch (error) {
        console.error('Error fetching investigations:', error);
        throw new Error('Internal Server Error');
      }
    },

    specialInvestigations: async (_, __, { user }) => {
      if (!user || !['Doctor', 'PG', 'Intern'].includes(user.role)) {
        throw new Error("Unauthorized: Only Doctors, PGs, and Interns can view special investigations.");
      }

      try {
        return await Investigation.findAll({
          where: { special: true },
          include: [{ model: User, as: 'createdBy' }],
        });
      } catch (error) {
        console.error('Error fetching special investigations:', error);
        throw new Error('Internal Server Error');
      }
    },

    
   


investigationsByDefaultUnitAndDepartment: async (_, { status }, { user }) => {
  if (!user || !['Doctor', 'PG', 'Intern', 'Nurse'].includes(user.role)) {
    throw new Error("Unauthorized: You don't have access to this query.");
  }

  try {
    // Calculate the date 24 hours ago
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setDate(twentyFourHoursAgo.getDate() - 1);

    // Fetch patients with associated investigations and filter by unit/department in PatientUnits
    return await Patient.findAll({
      include: [
        {
          model: PatientUnits,
          as: 'units', // Alias used in the association
          where: {
            unit: user.defaultUnit,
            department: user.defaultDepartment,
          },
        },
        {
          model: Investigation,
          as: 'investigations', // Alias used in the association
          where: {
            createdAt: {
              [Op.gte]: twentyFourHoursAgo, // Only include investigations from the past 24 hours
            },
            ...(status && { status }), // Optional status filter
          },
          order: [['createdAt', 'DESC']], // Sort investigations by latest first
          required: false, // Include patients even if they have no investigations
        },
      ],
    });
  } catch (error) {
    console.error('Error fetching investigations by unit and department:', error);
    throw new Error('Internal Server Error');
  }
},


    investigationsForPatient: async (_, { patientId }, { user }) => {
      if (!user || !['Doctor', 'PG', 'Intern', 'Nurse'].includes(user.role)) {
        throw new Error("Unauthorized: You don't have access to this query.");
      }

      try {
        return await Investigation.findAll({
          where: { patientId },
          include: [{ model: User, as: 'createdBy' }],
        });
      } catch (error) {
        console.error('Error fetching investigations for patient:', error);
        throw new Error('Internal Server Error');
      }
    },
  },

  Mutation: {
    login: async (_, { username, password }) => {
      try {
        // Fetch user from the database
        const user = await User.findOne({ where: { username } });
    
        if (!user) {
          throw new Error('User not found.');
        }
    
        // Match plain text password (no hashing)
        if (user.password !== password) {
          throw new Error('Invalid password.');
        }
    
        // Generate an auth token
        const token = Buffer.from(
          JSON.stringify({ id: user.id, role: user.role })
        ).toString('base64');
    
        // // Check if defaults are set
        // const requiresDefaults = !user.defaultUnit || !user.defaultDepartment;
    
        return {
          token,user
        };
      } catch (error) {
        console.error('Error during login:', error);
        throw new Error('Internal Server Error');
      }
    },

    setDefaultSettings: async (_, { unit, department }, { user }) => {
      if (!user) {
        throw new Error('Unauthorized: You must be logged in to update settings.');
      }
    
      try {
        const updatedUser = await User.update(
          { defaultUnit: unit, defaultDepartment: department },
          { where: { id: user.id }, returning: true }
        );
    
        return updatedUser[1][0]; // Updated user record
      } catch (error) {
        console.error('Error updating default settings:', error);
        throw new Error('Internal Server Error');
      }
    },

    createInvestigation: async (_, args, { user }) => {
      // 1. Authorization check
      if (!user || !['Doctor', 'PG', 'Intern'].includes(user.role)) {
        throw new Error("Unauthorized: Only Doctors, PGs, or Interns can create investigations.");
      }
    
      if (args.special && user.role !== 'Doctor') {
        throw new Error("Unauthorized: Only Doctors can create special investigations.");
      }
    
      try {
        // 2. Destructure the arguments passed by the client
        const {
          uhid,
          suffix,
          patientName,
          patientAge,
          patientGender,
          investigationType,
          unit = user.defaultUnit,
          department = user.defaultDepartment,
          prefix = new Date().getFullYear().toString().slice(-2), // Default to current year
        } = args;
    
        // Generate `final_uhid`
        const finalUhid = `${prefix}${uhid}${suffix || ''}`;
    
        // 3. Search for an existing patient by `final_uhid`
        let patient = await Patient.findOne({
          where: { final_uhid: finalUhid },
        });
    
        if (patient) {
          // 4. Check if the provided `unit` and `department` exist for the patient
          const existingUnitDept = await PatientUnits.findOne({
            where: {
              patientId: patient.id,
              unit,
              department,
            },
          });
    
          if (!existingUnitDept) {
            // Alert the user that a new unit/department is being added
            console.warn(
              `Alert: Patient with UHID (${finalUhid}) exists but is not linked to unit "${unit}" and department "${department}". Adding new unit/department.`
            );
    
            // Add the new `unit` and `department` for the patient
            await PatientUnits.create({
              patientId: patient.id,
              unit,
              department,
            });
          }
        } else {
          // 5. Create a new patient if no matching patient is found
          patient = await Patient.create({
            prefix,
            uhid,
            suffix,
            final_uhid: finalUhid,
            name: patientName,
            age: patientAge,
            gender: patientGender,
          });
    
          // Associate the initial `unit` and `department` with the new patient
          await PatientUnits.create({
            patientId: patient.id,
            unit,
            department,
          });
        }

        const orderNo = await generateOrderNo();
    
        // 6. Create a new investigation linked to the patient
        const investigation = await Investigation.create({
          orderNo, // Generate a unique order number
          investigationType,
          final_uhid: patient.final_uhid,
          special: args.special || false, // Determine if this is a special investigation
          patientName: patient.name, // Copy patient details to the investigation
          patientAge: patient.age,
          patientGender: patient.gender,
          unit,
          department,
          doneBy: user.id,
          patientId: patient.id, // Foreign key linking the investigation to the patient
          createdById: user.id, // Foreign key linking the investigation to the user
        });
    
        // 7. Return the newly created investigation with associated data
        return await Investigation.findByPk(investigation.id, {
          include: [
            { model: User, as: 'createdBy', attributes: ['id', 'username', 'role'] },
            { model: User, as: 'doneByUser', attributes: ['id', 'username'] },
            { model: Patient, as: 'patient', attributes: ['id', 'final_uhid', 'name'] },
            // {model: PatientUnits,  as: 'units', attributes: ['id','unit','department' ]},
          ],
        });
      } catch (error) {
        console.error('Error creating investigation:', error);
        throw new Error('Internal Server Error');
      }
    },


    markAsDone: async (_, { orderNo }, { user }) => {
      if (!user || !['PG', 'Intern'].includes(user.role)) {
        throw new Error("Unauthorized: Only PGs and Interns can mark investigations as done.");
      }
    
      try {
        const investigation = await Investigation.findOne({ where: { orderNo } });
        if (!investigation) throw new Error('Investigation not found.');
    
        investigation.status = 'Done';
        investigation.doneBy = user.id;
        await investigation.save();
    
        return investigation;
      } catch (error) {
        console.error('Error marking as done:', error);
        throw new Error('Internal Server Error');
      }
    },

    reverseDone: async (_, { orderNo }, { user }) => {
      if (!user || !['PG', 'Intern'].includes(user.role)) {
        throw new Error("Unauthorized: Only PGs and Interns can reverse investigations marked as done.");
      }
    
      try {
        const investigation = await Investigation.findOne({ where: { orderNo } });
        if (!investigation) throw new Error('Investigation not found.');
    
        const now = new Date();
        const doneTime = new Date(investigation.updatedAt);
    
        if ((now - doneTime) / (1000 * 60) > 10) {
          throw new Error('Cannot reverse. The 10-minute window has passed.');
        }
    
        investigation.status = 'Pending';
        investigation.doneBy = null;
        await investigation.save();
    
        return investigation;
      } catch (error) {
        console.error('Error reversing done:', error);
        throw new Error('Internal Server Error');
      }
    },
    
    




    
  },
};

export default resolvers;
