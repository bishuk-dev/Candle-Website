import nodemailer from 'nodemailer';
import hbs from 'nodemailer-express-handlebars';
import path from 'path';
import { config } from "../config/index.js";

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    pool: true,             // 👉 ADD THIS: Reuses connections (Massive speed boost)
    maxConnections: 5,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const handlebarOptions = {
    viewEngine: {
        extName: '.hbs',
        partialsDir: path.resolve('./src/views/emails/'),
        defaultLayout: false,
    },
    viewPath: path.resolve('./src/views/emails/'),
    extName: '.hbs',
};

transporter.use('compile', hbs(handlebarOptions));

export const sendWelcomeEmail = async (email, firstName) => {
    try {
        const mailOptions = {
            from: `"Naisha Creations" <${process.env.SMTP_FROM_EMAIL}>`,
            to: email,
            subject: "Welcome to Naisha Creations! ✨",
            template: 'welcome', // matches welcome.hbs
            context: {
                firstName: firstName,
                frontendUrl: config.url.frontend,
                year: new Date().getFullYear(),
            }
        };

        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error("Email Error:", error);
        // We don't throw error here so registration doesn't fail if email fails
    }
};