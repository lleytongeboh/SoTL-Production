import { useState } from "react";
import axios from "axios";
import { standardApi } from "../../../utils/standardApi";
import { API_BASE_URL } from "../../../configs/sotl-config";

const getErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message || fallback;
  }

  return error instanceof Error ? error.message : fallback;
};

export const authHooks = () => {
  const sendOTPThroughEmail = async (payloadEmail: {email: String}): Promise<Boolean> => {
    try {
      const response = await standardApi(
        `${API_BASE_URL}/api/send-otp`,
        "POST",
        false,
        payloadEmail
      );

      return response.result as Boolean;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Unable to send OTP. Please try again."));
    }
  };

  const verifyOTP = async (otpVerifyPayload: {
    otp: String;
    email: String;
  }): Promise<Boolean> => {
    try {
      const response = await standardApi(
        `${API_BASE_URL}/api/verify-otp`,
        "POST",
        false,
        otpVerifyPayload
      );

      return response.result as Boolean;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Unable to verify OTP. Please try again."));
    }
  };

  const changePassword = async (changePasswordPayload: {
    password: String;
    otp: String;
    email: String;
  }): Promise<Boolean> => {
    try {
      const response = await standardApi(
        `${API_BASE_URL}/api/change-password`,
        "POST",
        false,
        changePasswordPayload
      );

      return response.result as Boolean;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Unable to change password. Please try again."));
    }
  };

  return {
    sendOTPThroughEmail,
    verifyOTP,
    changePassword
  };
};
