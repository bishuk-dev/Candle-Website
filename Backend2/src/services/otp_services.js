import twilio from "twilio";
import "dotenv/config";
import { config } from "../config/index.js";
export const client = twilio(
    config.twilio.sid,
    config.twilio.secret
);

export const sendOtp = async (phone) => {
    try {
        const formattedPhone = phone.startsWith("+")
            ? phone
            : `+91${phone}`;
        
        const verification = await client.verify.v2
            .services(config.twilio.ssid)
            .verifications
            .create({
                to: formattedPhone,
                channel: "sms"
            });

        return verification;

    } catch (error) {
        
        throw new Error(error.message);
    }
};
export const verifyOtpService = async (phone, otp) => {
    const formattedPhone = phone.startsWith("+")
        ? phone
        : `+91${phone}`;

    return await client.verify.v2
        .services(config.twilio.ssid)
        .verificationChecks
        .create({
            to: formattedPhone,
            code: otp
        });
};

export const sendSMS = async (to, message) => {
    try {
        //  Validation
        if (!to || !message) {
            throw new Error("Phone number and message are required");
        }

        //  Format phone number (India)
        let formattedNumber = to.startsWith("+") ? to : `+91${to}`;

        const res = await client.messages.create({
            body: message,
            from: config.twilio.phone,
            to: formattedNumber
        });

        return {
            success: true,
            sid: res.sid
        };

    } catch (error) {
        console.error("SMS Error:", error.message);

        return {
            success: false,
            error: error.message
        };
    }
};

// import axios from "axios";
// import "dotenv/config";
// import { config } from "../config/index.js";

// // Helper to format phone for MSG91: Removes '+' and ensures '91' prefix
// const formatPhoneForMsg91 = (phoneNumber) => {
//     const cleaned = phoneNumber.replace(/\D/g, ''); // Strip all non-numeric characters
//     return cleaned.startsWith("91") ? cleaned : `91${cleaned}`;
// };

// export const sendOtp = async (phoneNumber) => {
//     try {
//         const formattedPhone = formatPhoneForMsg91(phoneNumber);

//         const options = {
//             method: 'POST',
//             url: `https://control.msg91.com/api/v5/otp`,
//             headers: { 'content-type': 'application/json', 'Content-Type': 'application/JSON' },
//             params: {
//                 template_id: config.msg91.otpTemplateId,
//                 mobile: formattedPhone,
//                 otp_length: '6',
//                 authkey: config.msg91.authKey,
//             },
//             // data: '{\n  "Param1": "value1",\n  "Param2": "value2",\n  "Param3": "value3"\n}',
//         };

//         const response = await axios.request(options);

//         // MSG91 returns { type: 'success', message: 'OTP sent successfully' }
//         if (response.data.type === 'error') {
//             throw new Error(response.data.message);
//         }

//         return response.data;

//     } catch (error) {
//         throw new Error(error.response?.data?.message || error.message);
//     }
// };

// export const verifyOtpService = async (phoneNumber, otp) => {
//     try {
//         const formattedPhone = formatPhoneForMsg91(phoneNumber);

//         const options = {
//             method: 'GET',
//             headers: {
//                 authkey: config.msg91.authKey
//             },
//             url: `https://control.msg91.com/api/v5/otp/verify`,
//             params: {
//                 otp: otp,
//                 mobile: formattedPhone,
//             }
//         };

//         const response = await axios.request(options);

//         // Mapping MSG91's response to match Twilio's "status: 'approved'" 
//         // so your existing controllers don't break!
//         return {
//             status: response.data.type === "success" ? "approved" : "pending",
//             raw: response.data
//         };

//     } catch (error) {
//         // If OTP is wrong, MSG91 returns a 400 or error type. We map this to pending/failed.
//         return {
//             status: "pending",
//             message: error.response?.data?.message || error.message
//         };
//     }
// };

// export const sendSMS = async (phoneNumber, message) => {
//     try {
//         if (!phoneNumber || !message) {
//             throw new Error("Phone number and message are required");
//         }

//         const formattedPhone = formatPhoneForMsg91(phoneNumber);

//         // NOTE: For standard SMS in India, MSG91 requires a DLT approved Template ID.
//         // The 'message' string passed here MUST exactly match your approved DLT template.
//         const options = {
//             method: 'POST',
//             url: 'https://control.msg91.com/api/v5/sendsms',
//             headers: {
//                 accept: 'application/json',
//                 authkey: config.msg91.authKey,
//                 'content-type': 'application/json'
//             },
//             data: {
//                 sender: config.msg91.senderId, // 6-letter DLT approved Sender ID
//                 route: "4", // 4 is for Transactional route
//                 country: "91",
//                 sms: [
//                     {
//                         message: message,
//                         to: [formattedPhone]
//                     }
//                 ]
//             }
//         };

//         const response = await axios.request(options);

//         if (response.data.type === 'error') {
//             throw new Error(response.data.message);
//         }

//         return {
//             success: true,
//             sid: response.data.message // MSG91 returns a request ID here
//         };

//     } catch (error) {
//         console.error("SMS Error:", error.response?.data?.message || error.message);

//         return {
//             success: false,
//             error: error.response?.data?.message || error.message
//         };
//     }
// };