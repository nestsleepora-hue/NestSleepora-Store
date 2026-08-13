// Shared in-memory store for active administrator and shopper OTP security codes
if (!global._activeOtps) {
  global._activeOtps = new Map();
}
export const activeOtps = global._activeOtps;
