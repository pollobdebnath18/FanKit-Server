import "dotenv/config";
import { client } from "./mongodb.js";
import type { Collection, ObjectId } from "mongodb";

export interface UserDoc {
  _id: ObjectId;
  name: string;
  email: string;
  role?: string;
  phone?: string;
  avatar?: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductDoc {
  _id: ObjectId;
  title: string;
  slug: string;
  category: string;
  subcategory: string | null;
  type: string | null;
  team: string;
  shortDescription: string;
  fullDescription: string;
  price: number;
  comparePrice?: number | null;
  stock: number;
  sizes: string[];
  colors: string[];
  images: string[];
  tags: string[];
  featured: boolean;
  onSale: boolean;
  rating: number;
  reviewCount: number;
  salesCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItem {
  _id: ObjectId;
  productId: string;
  size?: string | null;
  quantity: number;
}

export interface CartDoc {
  _id: ObjectId;
  userId: string;
  items: CartItem[];
  updatedAt: Date;
}

export interface WishlistDoc {
  _id: ObjectId;
  userId: string;
  productIds: string[];
}

export interface OrderItem {
  productId: string;
  title: string;
  price: number;
  size?: string | null;
  quantity: number;
  image: string;
}

export interface OrderStatusEntry {
  status: string;
  at: Date;
}

export interface OrderDoc {
  _id: ObjectId;
  userId: string;
  orderNumber: string;
  items: OrderItem[];
  shippingAddress: Record<string, unknown>;
  subtotal: number;
  shipping: number;
  total: number;
  status: string;
  trackingNumber: string | null;
  paymentMethod: string;
  paymentStatus: string;
  statusHistory: OrderStatusEntry[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ReviewDoc {
  _id: ObjectId;
  productId: ObjectId;
  userId: string;
  rating: number;
  title?: string;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AddressDoc {
  _id: ObjectId;
  userId: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  isDefault: boolean;
  createdAt: Date;
}

export interface BlogPostDoc {
  _id: ObjectId;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image: string;
  author: string;
  tags: string[];
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewsletterDoc {
  _id: ObjectId;
  email: string;
  subscribedAt: Date;
}

export interface ContactDoc {
  _id: ObjectId;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: Date;
}

export interface SettingsDoc {
  _id: ObjectId;
  key: string;
  value: Record<string, unknown>;
  updatedAt: Date;
}

const getDB = () => client.db(process.env.DB_NAME);

interface Collections {
  users: () => Collection<UserDoc>;
  products: () => Collection<ProductDoc>;
  carts: () => Collection<CartDoc>;
  wishlists: () => Collection<WishlistDoc>;
  orders: () => Collection<OrderDoc>;
  reviews: () => Collection<ReviewDoc>;
  addresses: () => Collection<AddressDoc>;
  blogPosts: () => Collection<BlogPostDoc>;
  newsletterSubscribers: () => Collection<NewsletterDoc>;
  contactSubmissions: () => Collection<ContactDoc>;
  settings: () => Collection<SettingsDoc>;
}

export const collections: Collections = {
  users: () => getDB().collection("user"),
  products: () => getDB().collection("products"),
  carts: () => getDB().collection("carts"),
  wishlists: () => getDB().collection("wishlists"),
  orders: () => getDB().collection("orders"),
  reviews: () => getDB().collection("reviews"),
  addresses: () => getDB().collection("addresses"),
  blogPosts: () => getDB().collection("blog_posts"),
  newsletterSubscribers: () => getDB().collection("newsletter_subscribers"),
  contactSubmissions: () => getDB().collection("contact_submissions"),
  settings: () => getDB().collection("settings"),
};
