export const createUserSchema = {
  type: "object",

  required: ["firstName", "lastName", "email", "password"],

  properties: {
    firstName: {
      type: "string",
      minLength: 1,
      maxLength: 100,
    },

    lastName: {
      type: "string",
      minLength: 1,
      maxLength: 100,
    },

    email: {
      type: "string",
      format: "email",
    },

    password: {
      type: "string",
      minLength: 8,
      maxLength: 100,
    },
  },

  additionalProperties: false,
} as const;

export const requestLogin = {
  type: "object",
  required: ["email", "password"],
  properties: {
    email: { type: "string", format: "email" },
    password: { type: "string", minLength: 1 },
  },
  additionalProperties: false,
} as const;

export const requestVerify = {
  type:"object",
  required: ["code"],
  properties:{
    code:{type:"string"},
  },
  additionalProperties: false
} as const