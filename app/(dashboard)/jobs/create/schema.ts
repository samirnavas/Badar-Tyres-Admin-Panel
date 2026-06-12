import { z } from "zod";

export const serviceItemSchema = z.object({
  name: z.string().min(1, "Service required"),
  qty: z.number({ message: "Min 1" }).min(1, "Min 1"),
  rate: z.number({ message: "Invalid" }).min(0, "Invalid"),
});

export const createJobSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  mobile: z
    .string()
    .min(7, "Enter a valid mobile number")
    .regex(/^[0-9+\-\s]+$/, "Digits only"),
  vehicleType: z.string().min(1, "Select a vehicle type"),
  wheelType: z.string().optional(),
  tyreType: z.string().optional(),
  manufacturer: z.string().min(1, "Select a manufacturer"),
  model: z.string().min(1, "Vehicle model is required"),
  vehicleNumber: z.string().min(1, "License ID is required"),
  technician: z.string().min(1, "Assign a lead technician"),
  services: z.array(serviceItemSchema).min(1, "Add at least one service item"),
});

export type CreateJobForm = z.infer<typeof createJobSchema>;

export const GST_RATE = 0.18;
