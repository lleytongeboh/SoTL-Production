import { useState } from "react";
import { standardApi } from "../../../utils/standardApi";
import { API_BASE_URL } from "../../../configs/sotl-config";

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
    } catch (error: any) {
      throw new Error(error.response.data?.message);
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
    } catch (error: any) {
      throw new Error(error.response.data?.message);
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
    } catch (error: any) {
      throw new Error(error.response.data?.message);
    }
  };

  return {
    sendOTPThroughEmail,
    verifyOTP,
    changePassword
  };
};
