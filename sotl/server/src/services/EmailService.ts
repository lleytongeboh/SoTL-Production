import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import * as UserManagementService from "./UserManagementService";
import mongoose, { mongo } from "mongoose";

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST, // Gmail SMTP example
  port: Number(process.env.SMTP_PORT),
  secure: true, // Use SSL/TLS if true
  auth: {
    user: process.env.SMTP_USER, // Email address (e.g., Gmail account)
    pass: process.env.SMTP_PASS, // App password or SMTP password
  },
});

type EmailDataType = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export const sendEmailStudentTest = async ({
  to,
  subject,
  text,
  html,
}: EmailDataType) => {
  try {
    const data = fs.readFileSync(
      path.resolve(__dirname, "../templates/AccountCreated.html"),
      "utf-8"
    );
    // Read the HTML file
    // Dynamic values to replace placeholders
    const username = "John Doe";
    const password = "your-password"; // Replace with the actual password
    const url = `${process.env.WEBSITE_URL}/login`;
    const email = "user@example.com"; // Example email, replace with actual

    // Replace placeholders with dynamic values
    const htmlContent = data
      .replace("{{username}}", username)
      .replace("{{email}}", email)
      .replace("{{password}}", password)
      .replace(/{{url}}/g, url);

    await transporter.sendMail({
      from: `${process.env.SMTP_USER}`, // Sender address
      to: to,
      subject: subject,
      text: text,
      html: htmlContent, // Optional HTML version of the email
    });
    console.log(`Email sent to ${to}`);
    return htmlContent;
  } catch (error: any) {
    console.error(`Failed to send email to ${to}:`, error);
    throw new Error(`Could not send email: ${error.message}`);
  }
};

export const sendEmailClientTest = async ({
  to,
  subject,
  text,
  html,
}: EmailDataType) => {
  try {
    const data = fs.readFileSync(
      path.resolve(__dirname, "../templates/ClientLinkCreated.html"),
      "utf-8"
    );
    let uuid = "156161657";
    // Define the dynamic values
    const clientName = "John Doe";
    const projectName = "AI-Enhanced Fish Recognition";
    const teamName = "UNIMAS Innovation Team";
    const leaderName = "Jane Smith";
    const leaderEmail = "jane.smith@unimas.edu";
    const evaluationLink = `https://example.com/evaluate/${uuid}`; // Use UUID for unique link

    // Replace placeholders with dynamic values
    const htmlContent = data
      .replace("{{clientName}}", clientName)
      .replace("{{projectName}}", projectName)
      .replace("{{teamName}}", teamName)
      .replace("{{leaderName}}", leaderName)
      .replace("{{leaderEmail}}", leaderEmail)
      .replace(/{{evaluationLink}}/g, evaluationLink); // Replace all instances

    // Send the email with the generated HTML content
    await transporter.sendMail({
      from: `${process.env.SMTP_USER}`, // Sender address
      to: to, // Recipient's email
      subject: "Project Evaluation Invitation", // Email subject
      text: text, // Optional text version
      html: htmlContent, // HTML version of the email
    });
    return htmlContent;
  } catch (error: any) {
    console.error(`Failed to send email to ${to}:`, error);
    throw new Error(`Could not send email: ${error.message}`);
  }
};

type ClientWithProjectGroupLeaderType = {
  _id: mongoose.Types.ObjectId;
  name: string;
  designation: string;
  company: string;
  email: string;
  project: {
    _id: mongoose.Types.ObjectId;
    title: string;
  };
  group: {
    name: string;
    leader: {
      _id: mongoose.Types.ObjectId;
      name: string;
      email: string;
    };
  };
};

export const sendEmailToClientEvaluation = async (client_id: string, evaluation_access_code: string) => {
  try {
    const client: ClientWithProjectGroupLeaderType =
      await UserManagementService.getClientWithProjectGroup(client_id);

    // Define the dynamic values
    const evaluationLink = `${process.env.WEBSITE_URL}/client/evaluation/${evaluation_access_code}/`; // Use UUID for unique link

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Project Evaluation</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
    }
    .container {
      width: 100%;
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    h1 {
      color: #333333;
    }
    p {
      color: #666666;
      line-height: 1.6;
    }
    .button {
      display: inline-block;
      background-color: #2196F3;
      color: #ffffff;
      padding: 10px 20px;
      text-decoration: none;
      border-radius: 5px;
      margin-top: 20px;
    }
    .footer {
      margin-top: 30px;
      font-size: 12px;
      color: #aaaaaa;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Hello, ${client.name}!</h1>
    <p>We would like to invite you to complete the evaluation for the project <strong>${client.project.title}</strong>, which was led by <strong>${client.group.leader.name}</strong></p>
    <p>Simply click the button below to proceed:</p>
    <a href="${evaluationLink}" class="button">Evaluate the Project</a>
    <p>If the button doesn’t work, copy and paste the following URL into your browser:</p>
    <p><a href="${evaluationLink}">${evaluationLink}</a></p>
    <div class="footer">
      <p>If you have any questions, please contact the project leader <strong>${client.group.leader.name}</strong> at <a href="mailto:${client.group.leader.email}">${client.group.leader.email}</a>.</p>
      <p>&copy; 2024 UNIMAS. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

    // Send the email with the generated HTML content
    const result = await transporter.sendMail({
      from: `${process.env.SMTP_USER}`, // Sender address
      to: client.email, // Recipient's email
      subject: "Project Evaluation Invitation", // Email subject
      html: htmlContent, // HTML version of the email
    });
    return htmlContent;
  } catch (error: any) {
    console.error(`Failed to send email to :`, error);
    throw new Error(`Could not send email: ${error.message}`);
  }
};

export const sendEmailToStudentRegistration = async (
  email: string,
  matric: string,
  batch: string,
  password: string
) => {
  try {
    const url = `${process.env.WEBSITE_URL}/login`; // URL to access the account
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Created</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
    }
    .container {
      width: 100%;
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    h1 {
      color: #333333;
    }
    p {
      color: #666666;
      line-height: 1.6;
    }
    .button {
      display: inline-block;
      background-color: #4CAF50;
      color: #ffffff;
      padding: 10px 20px;
      text-decoration: none;
      border-radius: 5px;
      margin-top: 20px;
    }
    .footer {
      margin-top: 30px;
      font-size: 12px;
      color: #aaaaaa;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Welcome to batch ${batch}, ${matric}!</h1>
    <p>Your account has been successfully created.</p>
    <p>You can now log in and start using the platform. Here are your login credentials:</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Password:</strong> ${password}</p>
    <p>Click the button below to access your account:</p>
    <a href="${url}" class="button">Access Your Account</a>
    <p>If the button doesn't work, copy and paste the following URL into your browser:</p>
    <p><a href="${url}">${url}</a></p>
    <div class="footer">
      <p>If you did not create this account, please contact our support team immediately.</p>
      <p>&copy; 2024 UNIMAS. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;
    await transporter.sendMail({
      from: `${process.env.SMTP_USER}`, // Sender address
      to: email, // Recipient's email
      subject: "Account Registration on SeLab Managment System", // Email subject
      html: htmlContent, // HTML version of the email
    });
    return htmlContent;
  } catch (error: any) {
    console.error(`Failed to send email to :`, error);
    throw new Error(`Could not send email: ${error}`);
  }
};

export const sendOtpEmail = async (email: string, otp: string): Promise<void> => {
  try {
    await transporter.sendMail({
      from: `${process.env.SMTP_USER}`,
      to: email,
      subject: "Your OTP Code",
      html: `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h2 style="color: #4CAF50;">Your OTP Code</h2>
      <p>Hello,</p>
      <p>We received a request to reset your password. Please use the OTP code below to complete your request. This code is valid for the next 5 minutes.</p>
      <div style="text-align: center; margin: 20px;">
        <span style="font-size: 24px; font-weight: bold; color: #4CAF50;">${otp}</span>
      </div>
      <p>If you did not request this, please ignore this email.</p>
      <p>Best regards,</p>
      <p>SELAB Management System</p>
    </div>
  `,
    });
  } catch (error: any) {
    console.error(`Failed to send email to :`, error);
    throw new Error(`Could not send email: ${error}`);
  }
}
