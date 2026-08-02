import { ObjectId } from "mongodb";
import { collections } from "./db.js";
import type {
  CustomerInfo,
  OrderDoc,
  OrderItem,
  ShippingAddress,
} from "./db.js";

// ---------- Shared checkout constants ----------

export const SHIPPING_FEE = 0; // free shipping
export const VALID_ORDER_STATUSES = [
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export const generateOrderNumber = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `FK-${timestamp}${random}`;
};

// ---------- API error helper ----------

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ---------- Order creation ----------

export interface CreateOrderInput {
  userId: string;
  customer: CustomerInfo;
  shippingAddress: ShippingAddress;
  paymentMethod: string;
  paymentStatus: string;
  transactionId?: string | null;
  paymentId?: string | null;
}

interface CartRawItem {
  _id: ObjectId;
  productId: string;
  size?: string | null;
  quantity: number;
}

/**
 * Builds a new order from the user's cart using authoritative product data
 * from the database. Never trusts amounts sent from the client.
 */
export const createOrderFromCart = async (
  input: CreateOrderInput,
): Promise<OrderDoc> => {
  const cart = await collections.carts().findOne({ userId: input.userId });
  const cartItems = (cart?.items ?? []) as unknown as CartRawItem[];

  if (cartItems.length === 0) {
    throw new ApiError(400, "Your cart is empty.");
  }

  const items: OrderItem[] = [];
  let subtotal = 0;
  let discount = 0;

  for (const item of cartItems) {
    if (!ObjectId.isValid(item.productId)) {
      throw new ApiError(400, "Invalid product in cart.");
    }

    const product = await collections
      .products()
      .findOne({ _id: new ObjectId(item.productId) });

    if (!product) {
      throw new ApiError(
        400,
        "A product in your cart no longer exists. Please refresh your cart.",
      );
    }

    if (item.quantity > product.stock) {
      throw new ApiError(
        400,
        `"${product.title}" has only ${product.stock} in stock.`,
      );
    }

    const lineTotal = item.quantity * product.price;
    subtotal += lineTotal;

    if (product.comparePrice && product.comparePrice > product.price) {
      discount += (product.comparePrice - product.price) * item.quantity;
    }

    items.push({
      productId: item.productId,
      title: product.title,
      price: product.price,
      size: item.size ?? null,
      quantity: item.quantity,
      image: product.imageUrl ?? product.images?.[0] ?? "",
    });
  }

  const order: OrderDoc = {
    _id: new ObjectId(),
    userId: input.userId,
    orderNumber: generateOrderNumber(),
    items,
    customer: input.customer,
    shippingAddress: input.shippingAddress,
    subtotal,
    shipping: SHIPPING_FEE,
    discount,
    total: subtotal + SHIPPING_FEE,
    status: "pending",
    trackingNumber: null,
    paymentMethod: input.paymentMethod,
    paymentStatus: input.paymentStatus,
    transactionId: input.transactionId ?? null,
    paymentId: input.paymentId ?? null,
    statusHistory: [{ status: "pending", at: new Date() }],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await collections.orders().insertOne(order);
  return order;
};

/** Decrements stock / increments sales for the snapshot items in an order. */
export const applyOrderStock = async (order: OrderDoc): Promise<void> => {
  for (const item of order.items) {
    await collections.products().updateOne(
      { _id: new ObjectId(item.productId) },
      {
        $inc: { stock: -item.quantity, salesCount: item.quantity },
        $set: { updatedAt: new Date() },
      },
    );
  }
};

export const clearCartFor = async (userId: string): Promise<void> => {
  await collections
    .carts()
    .updateOne({ userId }, { $set: { items: [], updatedAt: new Date() } });
};

export const markOrderPaid = async (
  order: OrderDoc,
  transactionId: string,
  paymentId: string,
): Promise<void> => {
  const statusHistory = [
    ...order.statusHistory,
    { status: "paid", at: new Date() },
  ];
  await collections.orders().updateOne(
    { _id: order._id },
    {
      $set: {
        status: "paid",
        paymentStatus: "paid",
        transactionId,
        paymentId,
        statusHistory,
        updatedAt: new Date(),
      },
    },
  );
};

export const markOrderFailed = async (
  order: OrderDoc,
  paymentStatus: "failed" | "cancelled",
): Promise<void> => {
  await collections.orders().updateOne(
    { _id: order._id },
    {
      $set: { paymentStatus, updatedAt: new Date() },
    },
  );
};
