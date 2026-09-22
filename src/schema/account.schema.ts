export const changeRequest = {
    type: "object",
    required: ["email"],
    properties: { email: { type: "string", format: "email" } },
    additionalProperties: false,
} as const;

export const phoneChangeRequest = {
    type: "object",
    required: ["phone"],
    properties: { phone: { type: "string", minLength: 6, maxLength: 30 } },
    additionalProperties: false,
} as const;

export const codeRequest = {
    type: "object",
    required: ["code"],
    properties: { code: { type: "string", pattern: "^[0-9]{6}$" } },
    additionalProperties: false,
} as const;

export const requestChangePassword = {
    type: "object",
    required: ["currentPassword", "newPassword"],
    properties: {
        currentPassword: { type: "string", minLength: 8, maxLength: 100 },
        newPassword: { type: "string", minLength: 8, maxLength: 100 },
    },
    additionalProperties: false,
} as const;