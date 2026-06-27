import { z } from "zod";

export const lineItemSchema = z
  .object({
    itemKey: z.string().min(1, "Select a service or part"),
    itemType: z.enum(["service", "part"]),
    serviceId: z.string().optional(),
    partId: z.string().optional(),
    name: z.string().min(1, "Select a service or part"),
    quantity: z.number({ message: "Min 1" }).min(1, "Min 1"),
    unitPrice: z.number({ message: "Invalid" }).min(0, "Invalid"),
    total: z.number({ message: "Invalid" }).min(0, "Invalid"),
    gst_rate: z.number().min(0),
  })
  .superRefine((data, ctx) => {
    if (data.itemType === "service" && !data.serviceId) {
      ctx.addIssue({
        code: "custom",
        path: ["itemKey"],
        message: "Select a service",
      });
    }
    if (data.itemType === "part" && !data.partId) {
      ctx.addIssue({
        code: "custom",
        path: ["itemKey"],
        message: "Select a part",
      });
    }
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
    insurance_expiry: z.string().optional(),
    pollution_expiry: z.string().optional(),
    chassis_number: z.string().optional(),
    engine_number: z.string().optional(),
    color: z.string().optional(),
    assigned_technician_id: z.string().optional(),
    technicianId: z.string().nullable().optional(),
    bayId: z.string().nullable().optional(),
    warranty_end_date: z.string().optional(),
    warranty_notes: z.string().optional(),
    lineItems: z
      .array(lineItemSchema)
      .min(1, "Add at least one service or part"),
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
export type LineItemForm = z.infer<typeof lineItemSchema>;

/** @deprecated Use lineItemSchema instead. */
export const serviceLineSchema = lineItemSchema;
/** @deprecated Use LineItemForm instead. */
export type ServiceLine = LineItemForm;
