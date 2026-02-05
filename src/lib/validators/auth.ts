
import { z } from "zod";

export const signupSchema = z.object({
    role: z.enum(["STORE_OWNER", "AFFILIATE"]),
    email: z.string().email("Email invalide"),
    password: z.string().min(8, "Minimum 8 caractères"),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
});

export type SignupFormData = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1, "Mot de passe requis"),
});

export type LoginFormData = z.infer<typeof loginSchema>;
