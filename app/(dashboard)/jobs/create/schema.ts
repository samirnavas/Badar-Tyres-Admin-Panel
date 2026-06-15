import { z } from "zod";

export const serviceLineSchema = z.object({
  service_id: z.string().min(1, "Select a service"),
  name: z.string().min(1, "Select a service"),
  qty: z.number({ message: "Min 1" }).min(1, "Min 1"),
  rate: z.number({ message: "Invalid" }).min(0, "Invalid"),
  gst_rate: z.number().min(0),
});

export const createJobCardSchema = z
  .object({
    customer_id: z.string().min(1, "Select a customer"),
    is_new_vehicle: z.boolean(),
    vehicle_id: z.string().optional(),
    vehicleType: z.string().optional(),
    manufacturer: z.string().optional(),
    model: z.string().optional(),
    registration_number: z.string().optional(),
    assigned_technician_id: z.string().min(1, "Assign a lead technician"),
    warranty_end_date: z.string().optional(),
    warranty_notes: z.string().optional(),
    services: z
      .array(serviceLineSchema)
      .min(1, "Add at least one service item"),
  })
  .superRefine((data, ctx) => {
    if (!data.vehicle_id) {
      if (!data.vehicleType)
        ctx.addIssue({
          code: "custom",
          path: ["vehicleType"],
          message: "Select a vehicle type",
        });
      if (!data.manufacturer)
        ctx.addIssue({
          code: "custom",
          path: ["manufacturer"],
          message: "Select a manufacturer",
        });
      if (!data.model)
        ctx.addIssue({
          code: "custom",
          path: ["model"],
          message: "Vehicle model is required",
        });
      if (!data.registration_number)
        ctx.addIssue({
          code: "custom",
          path: ["registration_number"],
          message: "Registration is required",
        });
    }
  });

export type CreateJobCardForm = z.infer<typeof createJobCardSchema>;
export type ServiceLine = z.infer<typeof serviceLineSchema>;
