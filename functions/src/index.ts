import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import nodemailer from "nodemailer";
import { defineSecret } from "firebase-functions/params";

admin.initializeApp();

// secrets
const SMTP_EMAIL = defineSecret("SMTP_EMAIL");
const SMTP_PASSWORD = defineSecret("SMTP_PASSWORD");

export const onRFQCreated = onDocumentCreated(
  {
    document: "rfqs/{rfqId}",
    secrets: [SMTP_EMAIL, SMTP_PASSWORD],
  },
  async (event) => {
    try {
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
          user: SMTP_EMAIL.value(),
          pass: SMTP_PASSWORD.value(),
        },
      });

      await transporter.sendMail({
        from: `"Sustainly" <${SMTP_EMAIL.value()}>`,
        to: "yourtestemail@gmail.com",
        subject: "RFQ Trigger Test",
        html: "<h3>RFQ created successfully</h3>",
      });

      console.log("Email sent successfully");
    } catch (err) {
      console.error("Email error:", err);
    }
  }
);
