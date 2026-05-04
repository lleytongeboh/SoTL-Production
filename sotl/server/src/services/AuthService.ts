import { redisConnection } from "../queue/QueueManager";

export async function storeOtp(userId: string, otp: string): Promise<void> {
  try {
    const key = `otp:${userId}`;
    const expiryTime = 300; // 5 minutes in seconds
    await redisConnection.set(key, otp, "EX", expiryTime);
  } catch (error: any) {
    throw new Error(`Error storing OTP: ${error}`);
  }
}

export const verifyOtp = async (
  userId: string,
  providedOtp: string
): Promise<boolean> => {
  try {
    const key = `otp:${userId}`;
    const storedOtp = await redisConnection.get(key);

    return storedOtp === providedOtp;
  } catch (error: any) {
    throw new Error(`Error verifying OTP: ${error}`);
  }
};

export const verifyOtpPassword = async (
  userId: string,
  providedOtp: string
): Promise<boolean> => {
  try {
    const key = `otp:${userId}`;
    const storedOtp = await redisConnection.get(key);

    if (storedOtp === providedOtp) {
      await redisConnection.del(key);
      return true;
    }
    return false;
  } catch (error: any) {
    throw new Error(`Error verifying OTP: ${error}`);
  }
};
