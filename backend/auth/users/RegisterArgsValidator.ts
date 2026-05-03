import { z } from "zod";
import type { RegisterArgs } from "./RegisterArgs";

const registerSchema = z
  .object({
    firebaseIdToken: z.string().optional(),
    googleIdToken: z.string().optional(),
    email: z.string().email("email must be a valid email address").optional(),
    username: z.string().min(1, "username must not be empty").optional(),
    fullname: z.string().min(1, "fullname is required").optional(),
    surname: z.string().min(1, "surname is required").optional(),
    dateOfBirth: z.string().optional(),
    password: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.firebaseIdToken || data.googleIdToken) return; // Firebase path — token is the only requirement

    if (!data.email) {
      ctx.addIssue({ code: "custom", path: ["email"], message: "email is required" });
    }
    if (!data.username) {
      ctx.addIssue({ code: "custom", path: ["username"], message: "username is required" });
    }
    if (!data.fullname) {
      ctx.addIssue({ code: "custom", path: ["fullname"], message: "fullname is required" });
    }
    if (!data.surname) {
      ctx.addIssue({ code: "custom", path: ["surname"], message: "surname is required" });
    }
    if (!data.dateOfBirth) {
      ctx.addIssue({ code: "custom", path: ["dateOfBirth"], message: "dateOfBirth is required" });
    } else if (Number.isNaN(Date.parse(data.dateOfBirth))) {
      ctx.addIssue({ code: "custom", path: ["dateOfBirth"], message: "dateOfBirth must be a valid date" });
    }
    if (!data.password) {
      ctx.addIssue({ code: "custom", path: ["password"], message: "password is required" });
      return;
    }
    if (data.password.length < 8)
      ctx.addIssue({ code: "custom", path: ["password"], message: "password must be at least 8 characters" });
    if (!/[A-Z]/.test(data.password))
      ctx.addIssue({ code: "custom", path: ["password"], message: "password must contain at least one uppercase letter" });
    if (!/[a-z]/.test(data.password))
      ctx.addIssue({ code: "custom", path: ["password"], message: "password must contain at least one lowercase letter" });
    if (!/[0-9]/.test(data.password))
      ctx.addIssue({ code: "custom", path: ["password"], message: "password must contain at least one number" });
  });

export type ValidationResult =
  | { success: true; data: RegisterArgs }
  | { success: false; errors: string[] };

export const validateRegisterArgs = (input: unknown): ValidationResult => {
  const result = registerSchema.safeParse(input);
  if (!result.success) {
    const errors = result.error.errors.map((e) => e.message);
    return { success: false, errors };
  }
  return { success: true, data: result.data as RegisterArgs };
};
