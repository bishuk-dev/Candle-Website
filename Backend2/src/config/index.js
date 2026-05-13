import 'dotenv/config'
export const config = {
    port: process.env.PORT,
    url : {
        frontend:process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL_PROD : process.env.FRONTEND_URL_DEV,
        admin:process.env.NODE_ENV === 'production' ? process.env.ADMIN_URL_PROD : process.env.ADMIN_URL_DEV,

    },

    db: {
        uri: process.env.MONGO_URI
    },

    jwt: {
        secret: process.env.SECRET_KEY
    },

    twilio: {
        sid: process.env.TWILIO_SID,
        secret: process.env.TWILIO_AUTH_TOKEN,
        ssid: process.env.TWILIO_SERVICE_SID,
        phone: process.env.TWILIO_PHONE
    },

    msg91: {
        authKey: process.env.MSG91_AUTH_KEY,
        otpTemplateId: process.env.MSG91_OTP_TEMPLATE_ID,
        senderId: process.env.MSG91_SENDER_ID,
        orderStatusTemplateId: process.env.MSG91_ORDER_STATUS_TEMPLATE_ID,
        orderConfirmTemplateId: process.env.MSG91_ORDER_CONFIRM_TEMPLATE_ID
    },

    google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET
    },
    cloud: {
        cloud_n: process.env.CLOUD_NAME,
        cloud_key: process.env.CLOUD_API_KEY,
        cloud_secret: process.env.CLOUD_API_SECRET
    },
    razor: {
        k_id: process.env.RAZORPAY_KEY_ID,
        k_secret: process.env.RAZORPAY_KEY_SECRET
    },
    shiprocket: {
        user_email: process.env.SHIPROCKET_EMAIL,
        user_password: process.env.SHIPROCKET_PASSWORD
    }
};