export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  user_type: "individual" | "business";
  email_confirmed: boolean;
  // Personal address
  address: string | null;
  city: string | null;
  country: string | null;
  // Business fields
  company_name: string | null;
  vat_id: string | null;
  company_address: string | null;
  company_city: string | null;
  company_country: string | null;
  company_email: string | null;
  invoice_notes: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  price_b2c: number;
  price_b2b: number;
  category: "ebooks" | "templates" | "consulting";
  product_type: "virtual" | "downloadable";
  image_url: string | null;
  file_path: string | null;
  seller_id: string | null;
  status: "draft" | "published" | "archived";
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  buyer_email: string | null;
  buyer_name: string | null;
  total_amount: number;
  payment_status: "pending" | "completed" | "failed";
  paypal_order_id: string | null;
  paypal_capture_id: string | null;
  receipt_token: string | null;
  receipt_token_expires_at: string | null;
  last_receipt_sent_at: string | null;
  receipt_send_count: number;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  seller_id: string | null;
  license_type: "personal" | "commercial";
  price: number;
  product?: Product;
}

export interface CartItem {
  product: Product;
  quantity: number;
  license_type: "personal" | "commercial";
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  created_at: string;
}

export interface Seller {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  seller_status: "active" | "payouts_locked" | "suspended";
  payout_email: string | null;
  commission_rate: number;
  created_at: string;
}
