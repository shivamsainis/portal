const typeDefs = `#graphql

    type User {
        id: ID!
        username: String!
        email: String!
        role: String!
        defaultUnit: String
        defaultDepartment: String
    }

    type Token {
        token: String!
        user:User!
    }

    type Patient {
  id: ID! # Unique identifier for the patient
  final_uhid: String! # Unique UHID (prefix + uhid + suffix)
  uhid: String! # UHID without prefix or suffix
  prefix: String! # Year or custom prefix
  suffix: String # Optional suffix for resolving duplicates
  name: String! # Patient's full name
  age: Int! # Patient's age
  gender: String! # Patient's gender (Male, Female, Other)
  units: [PatientUnits!]! # Array of associated units and departments
  investigations: [Investigation!]! # Array of investigations linked to the patient
}

    type Investigation {
        id: ID!
        orderNo: String!
        patientName: String!
        patientAge: Int!
        patientGender: String!     
        investigationType: String!
        unit:String!
        department:String!
        special: Boolean!
        status: String!
        createdBy: User! # Associated user who created the investigation
        doneByUser: User # Associated user who marked it as done (nullable)
        createdAt: String!
        updatedAt: String!
    }


    type PatientUnits {
        id:ID!
       unit: String!
       department: String!
       
    }

    type Query {
        hello: String
        users: [User!]!
        investigations(orderNo: String): [Investigation!]!
        specialInvestigations: [Investigation!]!
        investigationsByDefaultUnitAndDepartment(status: String): [Patient!]!
        investigationsForPatient(patientId: ID!): [Investigation!]!
        searchPatients(keyword: String!): [Patient!]!
    }

    type Mutation {
        login(username: String!, password: String!): Token!
        setDefaultSettings(unit: String!, department: String!): User!
        createInvestigation(
            uhid:String!
            suffix: String
            prefix: String
            patientName: String!
            patientAge: Int!
            patientGender: String!
            unit: String
            department: String
            investigationType: String!
            special: Boolean
        ): Investigation!
        markAsDone(orderNo: String!): Investigation!
        reverseDone(orderNo: String!): Investigation!
    }
`;

export default typeDefs;
