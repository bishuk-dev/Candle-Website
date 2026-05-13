import { User } from "../models/userModel.js";
import bcrypt from 'bcrypt';
import 'dotenv/config'
import { config } from "../config/index.js";
import { generateToken, setTokenCookie, clearTokenCookie } from "../utils/token.js";
import { verifyGoogleToken, findOrCreateGoogleUser } from "../services/googleAuthService.js";

import { sendOtp, verifyOtpService } from "../services/otp_services.js";
import jwt from "jsonwebtoken";
import { sendWelcomeEmail } from '../utils/sendEmail.js';





// export const register = async (req, res) => {
//     try {
//         const { firstName, lastName, email, phoneNumber, password, confirmPassword } = req.body;

//         if (!firstName || !lastName || !email || !phoneNumber || !password || !confirmPassword) {
//             return res.status(400).json({
//                 success: false,
//                 message: "All fields are required"
//             });
//         }
//         if (email && !email.includes("@")) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Invalid email"
//             });
//         }
//         const phoneRegex = /^[6-9]\d{9}$/;
//         if (!phoneRegex.test(phoneNumber)) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Invalid phone number"
//             });
//         }

//         const existingUser = await User.findOne({
//             $or: [{ email }, { phoneNumber }]
//         });

//         if (existingUser) {
//             return res.status(400).json({
//                 success: false,
//                 message: "User already exists"
//             });
//         }
//         if (password !== confirmPassword) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Password and confirm password do not match"
//             });
//         }

//         await sendOtp(phoneNumber);

//         return res.status(200).json({
//             success: true,
//             message: "OTP sent to phone number"
//         });

//     } catch (error) {

//         return res.status(500).json({

//             success: false,
//             message: error.message
//         });
//     }
// };


// export const verifyOtpAndRegister = async (req, res) => {
//     try {
//         const { firstName, lastName, email, phoneNumber, password, confirmPassword, otp } = req.body;
//         if (!firstName || !lastName || !email || !phoneNumber || !password || !confirmPassword) {
//             return res.status(400).json({
//                 success: false,
//                 message: "All fields are required"
//             });
//         }
//         if (password !== confirmPassword) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Password and confirm password do not match"
//             });
//         }

//         if (!otp) {
//             return res.status(400).json({
//                 success: false,
//                 message: "OTP is required"
//             });
//         }




//         const result = await verifyOtpService(phoneNumber, otp);

//         if (result.status !== "approved") {
//             return res.status(400).json({
//                 success: false,
//                 message: result.status === "pending"
//                     ? "OTP expired or invalid"
//                     : "OTP verification failed"
//             });
//         }


//         const hashedPassword = await bcrypt.hash(password, 10);


//         const newUser = await User.create({
//             firstName,
//             lastName,
//             email: email.toLowerCase(),
//             phoneNumber,
//             password: hashedPassword,
//             isPhoneVerified: true,
//             isLoggedIn: true
//         });



//         const token = generateToken(newUser);
//         setTokenCookie(res, token);

//         return res.status(201).json({
//             success: true,
//             message: "User registered successfully",
//             // user: newUser
//         });

//     } catch (error) {
//         return res.status(500).json({
//             success: false,
//             message: error.message
//         });
//     }
// };



export const sendOtpController = async (req, res) => {
    try {
        const { phoneNumber } = req.body;

        if (!phoneNumber) {
            return res.status(400).json({
                success: false,
                message: "Phone number is required"
            });
        }

        const phoneRegex = /^[6-9]\d{9}$/;
        if (!phoneRegex.test(phoneNumber)) {
            return res.status(400).json({
                success: false,
                message: "Invalid phone number"
            });
        }

        const existingUser = await User.findOne({ phoneNumber });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User already exists"
            });
        }

        await sendOtp(phoneNumber);

        res.status(200).json({
            success: true,
            message: "OTP sent"
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const verifyOtpController = async (req, res) => {
    try {
        const { phoneNumber, otp } = req.body;

        if (!phoneNumber || !otp) {
            return res.status(400).json({
                success: false,
                message: "Phone and OTP required"
            });
        }

        const result = await verifyOtpService(phoneNumber, otp);

        if (result.status !== "approved") {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired OTP"
            });
        }

        //  Create TEMP token (only phone verified)
        const tempToken = jwt.sign(
            { phoneNumber, isOtpVerified: true },
            config.jwt.secret,
            { expiresIn: "10m" } // short expiry
        );

        res.status(200).json({
            success: true,
            message: "OTP verified",
            tempToken
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const completeProfile = async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            email,
            password,
            confirmPassword
        } = req.body;

        //  Get phone from token
        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const decoded = jwt.verify(token, config.jwt.secret);

        if (!decoded.isOtpVerified) {
            return res.status(401).json({
                success: false,
                message: "OTP not verified"
            });
        }

        const phoneNumber = decoded.phoneNumber;

        //  Validate fields
        if (!firstName || !lastName || !email || !password || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        if (!email.includes("@")) {
            return res.status(400).json({
                success: false,
                message: "Invalid email"
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match"
            });
        }

        //  Check existing user again
        const existingUser = await User.findOne({
            $or: [{ email }, { phoneNumber }]
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            firstName,
            lastName,
            email: email.toLowerCase(),
            phoneNumber,
            password: hashedPassword,
            isPhoneVerified: true
        });

        sendWelcomeEmail(newUser.email, newUser.firstName);

        //  Final login token
        const authToken = generateToken(newUser);
        setTokenCookie(res, authToken);



        res.status(201).json({
            success: true,
            message: "Registration completed",
            user: newUser
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};



export const googleAuth = async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: "Token is required"
            });
        }


        const payload = await verifyGoogleToken(token);


        // 👉 1. Destructure both the user AND the isNewUser flag from your helper
        const { user, isNewUser } = await findOrCreateGoogleUser(payload);

        // 👉 2. TRIGGER EMAIL ONLY FOR NEW USERS
        if (isNewUser) {
            sendWelcomeEmail(user.email, user.firstName);
        }


        const jwt_token = generateToken(user);
        setTokenCookie(res, jwt_token);
        return res.status(200).json({
            success: true,
            message: "Google login successful",
            user,
            needsPhone: user.needsPhone
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};






export const saveGooglePhone = async (req, res) => {
    try {
        const { phoneNumber, otp } = req.body;
        const user_Id = req.user;

        if (!phoneNumber || !otp) {
            return res.status(400).json({
                success: false,
                message: "Phone number, and OTP are required"
            });
        }
        const phoneRegex = /^[6-9]\d{9}$/;
        if (!phoneRegex.test(phoneNumber)) {
            return res.status(400).json({
                success: false,
                message: "Invalid phone number"
            });
        }


        const verification = await verifyOtpService(phoneNumber, otp);

        if (verification.status !== "approved") {
            return res.status(400).json({
                success: false,
                message: verification.status === "pending"
                    ? "OTP invalid or expired"
                    : "OTP verification failed"
            });
        }


        const user = await User.findById(user_Id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            })
        }


        user.phoneNumber = phoneNumber;
        user.isPhoneVerified = true;
        user.isLoggedIn = true;
        user.needsPhone = false;

        await user.save();


        return res.status(200).json({
            success: true,
            message: "Phone number verified and saved successfully",
            // user

        });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const login = async (req, res) => {
    try {
        let { identifier, password } = req.body;
        if (!identifier || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            })
        }
        identifier = identifier.trim().replace(/\s+/g, "");
        const isEmail = /^\S+@\S+\.\S+$/.test(identifier);
        const query = isEmail
            ? { email: identifier.toLowerCase() }
            : { phoneNumber: identifier };
        const phoneRegex = /^[6-9]\d{9}$/;
        if (!isEmail && !phoneRegex.test(identifier)) {
            return res.status(400).json({
                success: false,
                message: "Invalid phone number"
            });
        }
        
        const existingUser = await User.findOne(query);
        // if (!existingUser.isActive) {
        //     return res.status(403).json({
        //         success: false,
        //         message: "Access revoked by admin"
        //     });
        // }
        if (!existingUser) {
            return res.status(400).json({
                success: false,
                message: "User not exists"
            })
        }
        const isPasswordValid = await bcrypt.compare(password, existingUser.password);
        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                message: "Password is invalid"
            })

        }
        const token = generateToken(existingUser);
        setTokenCookie(res, token);

        existingUser.isLoggedIn = true;
        // existingUser.isAdmin =  existingUser.role === "admin";
        await existingUser.save()
        return res.status(200).json({
            success: true,
            message: `Welcome back ${existingUser.firstName}`,
            user: existingUser,
            role: existingUser.role,
            // isAdmin: existingUser.role === "admin"

        })

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}
export const adminLogin = async (req, res) => {
    try {
        let { identifier, password } = req.body;
        if (!identifier || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            })
        }
        identifier = identifier.trim().replace(/\s+/g, "");
        const isEmail = /^\S+@\S+\.\S+$/.test(identifier);
        const query = isEmail
            ? { email: identifier.toLowerCase() }
            : { phoneNumber: identifier };
        const phoneRegex = /^[6-9]\d{9}$/;
        if (!isEmail && !phoneRegex.test(identifier)) {
            return res.status(400).json({
                success: false,
                message: "Invalid phone number"
            });
        }
        
        const existingUser = await User.findOne(query);
        // if (!existingUser.isActive) {
        //     return res.status(403).json({
        //         success: false,
        //         message: "Access revoked by admin"
        //     });
        // }
        if (!existingUser) {
            return res.status(400).json({
                success: false,
                message: "User not exists"
            })
        }
        
        if (existingUser.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Access denied: Admin only"
            });
        }

        const isPasswordValid = await bcrypt.compare(password, existingUser.password);
        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                message: "Password is invalid"
            })

        }
        const token = generateToken(existingUser);
        setTokenCookie(res, token);

        existingUser.isLoggedIn = true;
        // existingUser.isAdmin =  existingUser.role === "admin";
        await existingUser.save()
        return res.status(200).json({
            success: true,
            message: `Welcome back ${existingUser.firstName}`,
            user: existingUser,
            role: existingUser.role,
            // isAdmin: existingUser.role === "admin"

        })

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}



// export const revokeUserAccess = async (req, res) => {
//     try {
//         const { userId } = req.params; // user to revoke
//         const admin = req.user; // from verifyToken middleware

//         // Only admins can revoke
//         if (admin.role !== "admin") {
//             return res.status(403).json({
//                 success: false,
//                 message: "Access denied: Admin only"
//             });
//         }

//         const user = await User.findById(userId);
//         if (!user) {
//             return res.status(404).json({ success: false, message: "User not found" });
//         }

//         user.isActive = false;
//         user.isLoggedIn = false; // immediately log out user
//         await user.save();

//         return res.status(200).json({
//             success: true,
//             message: `Access revoked for ${user.firstName}`
//         });
//     } catch (error) {
//         return res.status(500).json({ success: false, message: error.message });
//     }
// };

export const logout = async (req, res) => {
    try {
        const userId = req.id
        await User.findByIdAndUpdate(userId, { isLoggedIn: false })


        clearTokenCookie(res);
        return res.status(200).json({
            success: true,
            message: " User logged out successfully",

        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        })
    }
}



export const forgotPassword = async (req, res) => {
    try {
        const { phoneNumber } = req.body;

        const user = await User.findOne({ phoneNumber });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User not found"
            });
        }


        await sendOtp(phoneNumber);


        user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();

        return res.status(200).json({
            success: true,
            message: "OTP sent successfully"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const verifyOTP = async (req, res) => {
    try {
        const { phoneNumber, otp } = req.body;
        if (!otp) {
            return res.status(400).json({
                success: false,
                message: "Please eneter OTP"
            });
        }
        const phoneRegex = /^[6-9]\d{9}$/;
        if (!phoneRegex.test(phoneNumber)) {
            return res.status(400).json({
                success: false,
                message: "Invalid phone number"
            });
        }
        const user = await User.findOne({ phoneNumber });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User not found"
            });
        }


        if (user.otpExpiresAt < new Date()) {
            return res.status(400).json({
                success: false,
                message: "OTP expired. Please request a new one"
            });
        }


        const result = await verifyOtpService(phoneNumber, otp);
        if (result.status !== "approved") {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP"
            });
        }


        user.otpExpiresAt = null;
        user.isOtpVerified = true;
        await user.save();

        return res.status(200).json({
            success: true,
            message: "OTP verified successfully"
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
};

export const resendOtp = async (req, res) => {
    try {
        const { phoneNumber } = req.body;
        if(!phoneNumber){
            return res.status(400).json({
                success: false,
                message:"Please Enter phone number"
            })
        }
        const phoneRegex = /^[6-9]\d{9}$/;
        if (!phoneRegex.test(phoneNumber)) {
            return res.status(400).json({
                success: false,
                message: "Invalid phone number"
            });
        }
        const user = await User.findOne({ phoneNumber });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User not found"
            });
        }

        await sendOtp(phoneNumber);


        user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();

        return res.status(200).json({
            success: true,
            message: "OTP resent successfully"
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
};



export const resetPassword = async (req, res) => {
    try {
        const { phoneNumber, newPassword, confirmPassword } = req.body;
        if (!phoneNumber || !newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "All feilds are required"
            })
        }
        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Password and confirm password do not match"
            });
        }
        const phoneRegex = /^[6-9]\d{9}$/;
        if (!phoneRegex.test(phoneNumber)) {
            return res.status(400).json({
                success: false,
                message: "Invalid phone number"
            });
        }
        const user = await User.findOne({ phoneNumber });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User not found"
            });
        }



        if (newPassword.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters"
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        user.password = hashedPassword;
        user.isOtpVerified = false;

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Password reset successfully"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};