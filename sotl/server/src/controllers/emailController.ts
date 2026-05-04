import { Response } from "express";
import dotenv from "dotenv";
import { successResponse } from "../utils/response";
import { AuthRequest } from "../middlewares/authMiddleware";
import * as EmailService from "../services/EmailService";
import { faker } from "@faker-js/faker";

const testEmailSend = async (req: AuthRequest, res: Response) => {
    let { email, subject, text, html } = req.body;
    try {
    // Your logic here
    const result = await EmailService.sendEmailStudentTest({
        to: email,
        subject: subject,
        text: text,
        html: html
    });
    res.send(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

const testEmailSendClient = async (req: AuthRequest, res: Response) => {
  let { email, subject, text, html } = req.body;
  try {
  // Your logic here
  const result = await EmailService.sendEmailClientTest({
      to: email,
      subject: subject,
      text: text,
      html: html
  });
  res.send(result);
} catch (error: any) {
  res.status(500).json({ message: error.message });
}
};

export default {
  testEmailSend,
  testEmailSendClient
};
