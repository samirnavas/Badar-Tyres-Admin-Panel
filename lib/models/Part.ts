import { z } from "zod";

export const partCategories = ["Tyre", "Oil", "Battery", "General"] as const;
export type PartCategory = (typeof partCategories)[number];

export interface Part {
  id: string;
  name: string;
  sku: string;
  category: PartCategory;
  brand: string;
  costPrice: number;
  retailPrice: number;
  stockLevel: number;
  minStockThreshold: number;
  location: string;
  createdAt: string;
  updatedAt: string;
}

export const partSchema = z.object({
  name: z.string().min(1, "Part name is required"),
  sku: z.string().min(1, "SKU is required"),
  category: z.enum(partCategories),
  brand: z.string().min(1, "Brand is required"),
  costPrice: z.number().min(0, "Cost price must be zero or greater"),
  retailPrice: z.number().min(0, "Retail price must be zero or greater"),
  stockLevel: z.number().int().min(0, "Stock level must be zero or greater"),
  minStockThreshold: z
    .number()
    .int()
    .min(0, "Minimum stock threshold must be zero or greater"),
  location: z.string().min(1, "Location is required"),
});

export type PartInput = z.infer<typeof partSchema>;
