import { z } from "zod";

export const settingsSchema = z.object({
  shop_name: z.string().min(1, "Shop name is required"),
  shop_address: z.string().min(1, "Address is required"),
  contact_phone: z
    .string()
    .min(7, "Enter a valid phone number")
    .regex(/^[0-9+\-\s]+$/, "Digits only"),
  contact_email: z.string().email("Enter a valid email"),
  default_gst_rate: z
    .number({ message: "Enter a GST rate" })
    .min(0, "Cannot be negative")
    .max(100, "Cannot exceed 100%"),
  terms_and_conditions: z.string(),
});

export type SettingsForm = z.infer<typeof settingsSchema>;
