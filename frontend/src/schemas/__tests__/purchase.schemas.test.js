import { describe, it, expect } from "vitest";
import { purchaseSchema } from "../purchase.schemas";

describe("purchaseSchema", () => {
  const valid = {
    screening_id: 1,
    seats: [{ row: "A", seat_number: 5 }],
    payment_method: "cash",
  };

  it("accepts valid purchase data", () => {
    const result = purchaseSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("accepts multiple seats", () => {
    const result = purchaseSchema.safeParse({
      ...valid,
      seats: [
        { row: "A", seat_number: 1 },
        { row: "B", seat_number: 10 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("accepts all payment methods", () => {
    for (const method of ["cash", "card", "online"]) {
      const result = purchaseSchema.safeParse({ ...valid, payment_method: method });
      expect(result.success).toBe(true);
    }
  });

  it("rejects empty seats array", () => {
    const result = purchaseSchema.safeParse({ ...valid, seats: [] });
    expect(result.success).toBe(false);
  });

  it("rejects invalid screening_id", () => {
    const result = purchaseSchema.safeParse({ ...valid, screening_id: -1 });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer screening_id", () => {
    const result = purchaseSchema.safeParse({ ...valid, screening_id: 1.5 });
    expect(result.success).toBe(false);
  });

  it("rejects invalid row format", () => {
    const result = purchaseSchema.safeParse({
      ...valid,
      seats: [{ row: "AB", seat_number: 1 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects numeric row", () => {
    const result = purchaseSchema.safeParse({
      ...valid,
      seats: [{ row: "1", seat_number: 1 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects seat_number less than 1", () => {
    const result = purchaseSchema.safeParse({
      ...valid,
      seats: [{ row: "A", seat_number: 0 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects seat_number exceeding 30", () => {
    const result = purchaseSchema.safeParse({
      ...valid,
      seats: [{ row: "A", seat_number: 31 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid payment method", () => {
    const result = purchaseSchema.safeParse({ ...valid, payment_method: "bitcoin" });
    expect(result.success).toBe(false);
  });
});
