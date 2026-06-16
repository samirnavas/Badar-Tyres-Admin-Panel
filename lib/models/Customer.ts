export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  gst_number?: string;
  customer_type?: "Retail" | "Corporate" | "Fleet";
  tags?: string[];
  notes?: string;
  created_at: string;
}
