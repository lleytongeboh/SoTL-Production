export const isPayloadEmptyString = (payload: any): boolean => {
  if (typeof payload === "string" && payload.trim() === "") {
    return true;
  }
  return false;
};

export const isPayloadEmptyObject = (payload: any): boolean => {
  if (typeof payload === "object" && Object.keys(payload).length === 0) {
    return true;
  }
  return false;
};

export const isPayloadNullOrUndefined = (payload: any): boolean => {
    if (payload === null || payload === undefined) {
        return true;
    }
    return false;
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};