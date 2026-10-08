
import nodemailer from "nodemailer";

async function testConnection() {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // TLS
      auth: {
        user: "test@gmail.com", // This will fail intentionally, but let's see the error
        pass: "password",
      },
      tls: { rejectUnauthorized: false },
    });
    await transporter.verify();
    console.log("Verified!");
  } catch (err: any) {
    console.error("Error:", err.message);
  }
}

testConnection();
