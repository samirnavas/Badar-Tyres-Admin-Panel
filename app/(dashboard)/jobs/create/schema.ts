import { z } from "zod";

export const serviceLineSchema = z.object({
  service_id: z.string().min(1, "Select a service"),
  name: z.string().min(1, "Select a service"),
  qty: z.number({ message: "Min 1" }).min(1, "Min 1"),
  rate: z.number({ message: "Invalid" }).min(0, "Invalid"),
  gst_rate: z.number().min(0),
});

export const createJobCardSchema = z.object({
  customer_id: z.string().min(1, "Select a customer"),
  vehicle_id: z.string().min(1, "Select a vehicle"),
  vehicleType: z.string().min(1, "Select a vehicle type"),
  manufacturer: z.string().min(1, "Select a manufacturer"),
  model: z.string().min(1, "Vehicle model is required"),
  registration_number: z.string().min(1, "Registration is required"),
  assigned_technician_id: z.string().min(1, "Assign a lead technician"),
  warranty_end_date: z.string().optional(),
  warranty_notes: z.string().optional(),
  services: z.array(serviceLineSchema).min(1, "Add at least one service item"),
});

export type CreateJobCardForm = z.infer<typeof createJobCardSchema>;
export type ServiceLine = z.infer<typeof serviceLineSchema>;
