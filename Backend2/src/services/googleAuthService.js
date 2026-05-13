import { OAuth2Client } from "google-auth-library";
import { User } from "../models/userModel.js";
import { config } from "../config/index.js";
const client = new OAuth2Client(config.google.clientId);

export const verifyGoogleToken = async (token) => {
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: config.google.clientId
    });

    return ticket.getPayload();
};

export const findOrCreateGoogleUser = async (payload) => {
    const { email, name, sub } = payload;

    const nameParts = name ? name.split(" ") : [];
    const firstName = nameParts[0] || "User";
    const lastName = nameParts.slice(1).join(" ") || "";

    let user = await User.findOne({ googleId: sub });
    let isNewUser = false; // 👉 3. Initialize the tracking flag

    if (!user) {
        // This is a brand new registration
        user = await User.create({
            firstName,
            lastName,
            email,
            googleId: sub,
            authProvider: "google",
            isLoggedIn: true,
            needsPhone: true
        });
        isNewUser = true; // 👉 4. Mark flag as true
    } else {
        // This is an existing user logging in again
        user.isLoggedIn = true;
        await user.save();
    }

    // 👉 5. Return both variables as an object
    return { user, isNewUser };
};