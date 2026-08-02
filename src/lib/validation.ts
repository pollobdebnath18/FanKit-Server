import type { CustomerInfo, ShippingAddress } from "./db.js";
import { ApiError } from "./order.service.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+()\-\s0-9]{10,}$/;

export const validateCustomerInfo = (
  customer: Partial<CustomerInfo> | undefined,
): CustomerInfo => {
  if (!customer) {
    throw new ApiError(400, "Customer information is required.");
  }

  const fullName = (customer.fullName ?? "").trim();
  const email = (customer.email ?? "").trim();
  const phone = (customer.phone ?? "").trim();

  if (!fullName) {
    throw new ApiError(400, "Full name is required.");
  }
  if (!email || !EMAIL_RE.test(email)) {
    throw new ApiError(400, "A valid email address is required.");
  }
  if (!phone || !PHONE_RE.test(phone)) {
    throw new ApiError(400, "A valid phone number is required.");
  }

  return { fullName, email, phone };
};

export const validateShippingAddress = (
  shippingAddress: Partial<ShippingAddress> | undefined,
): ShippingAddress => {
  if (!shippingAddress) {
    throw new ApiError(400, "Shipping address is required.");
  }

  const address = (shippingAddress.address ?? "").trim();
  const city = (shippingAddress.city ?? "").trim();
  const postalCode = (shippingAddress.postalCode ?? "").trim();
  const country = (shippingAddress.country ?? "").trim();

  if (!address) {
    throw new ApiError(400, "Street address is required.");
  }
  if (!city) {
    throw new ApiError(400, "City is required.");
  }
  if (!postalCode) {
    throw new ApiError(400, "Postal code is required.");
  }
  if (!country) {
    throw new ApiError(400, "Country is required.");
  }

  return { address, city, postalCode, country };
};
