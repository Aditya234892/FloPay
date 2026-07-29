import { z } from 'zod'

/**
 * Validation lives here, shared by the forms and anything else that needs to
 * check the same shape. Messages are written to be shown directly to users.
 */

const email = z
  .string()
  .min(1, 'Email is required')
  .email('Enter a valid email address')
  .transform((value) => value.trim().toLowerCase())

/**
 * Password policy is enforced identically here and on the server. The character
 * -class requirements exist because this is a payments product — a weak merchant
 * password is a path to someone else's money.
 */
const password = z
  .string()
  .min(10, 'Use at least 10 characters')
  .max(128, 'That is longer than 128 characters')
  .regex(/[a-z]/, 'Include a lowercase letter')
  .regex(/[A-Z]/, 'Include an uppercase letter')
  .regex(/[0-9]/, 'Include a number')

export const loginSchema = z.object({
  email,
  // Login only checks presence — the server decides whether it is correct, and
  // rejecting a legacy password client-side would lock people out.
  password: z.string().min(1, 'Password is required'),
})

export const signupSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Business name must be at least 2 characters')
      .max(80, 'Keep the business name under 80 characters')
      .transform((value) => value.trim()),
    email,
    password,
    confirmPassword: z.string().min(1, 'Confirm your password'),
    acceptedTerms: z.literal(true, {
      message: 'You must accept the terms to continue',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  })

export const forgotPasswordSchema = z.object({ email })

export type LoginValues = z.infer<typeof loginSchema>
export type SignupValues = z.infer<typeof signupSchema>
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>

/** 0–4 strength score plus a label, driving the signup meter. */
export function passwordStrength(value: string): { score: number; label: string } {
  if (!value) return { score: 0, label: 'Empty' }

  let score = 0
  if (value.length >= 10) score++
  if (value.length >= 14) score++
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++
  if (/[0-9]/.test(value)) score++
  if (/[^A-Za-z0-9]/.test(value)) score++

  const capped = Math.min(score, 4)
  const labels = ['Very weak', 'Weak', 'Fair', 'Strong', 'Excellent'] as const
  return { score: capped, label: labels[capped]! }
}
