import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import { useAuthActions } from '../hooks/useAuth'; // Import our hook

const ResetPassword = () => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();

    // Extract the secure data passed from VerifyOTP.jsx
    const phoneNumber = location.state?.phoneNumber;
    const otp = location.state?.otp;

    // Pull in the mutation from our hook
    const { resetPassword, isResetting } = useAuthActions();

    // Route Guard: If someone tries to access this page directly without an OTP, kick them out
    useEffect(() => {
        if (!phoneNumber || !otp) {
            toast.error("Invalid session. Please verify your mobile number first.");
            navigate('/forgot-password');
        }
    }, [phoneNumber, otp, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (newPassword.length < 6) {
            return toast.error("Password must be at least 6 characters");
        }
        if (newPassword !== confirmPassword) {
            return toast.error("Passwords do not match");
        }

        try {
            // Trigger the backend API call
            await resetPassword({ phoneNumber, newPassword, confirmPassword });

            // On success (toast is handled by the hook), redirect to login
            navigate('/signin');
        } catch (error) {
            console.error("Password reset failed:", error);
            // Error toast is also handled gracefully by our hook!
        }
    };

    return (
        <div className="flex w-full h-screen bg-[#f9fafb] overflow-hidden">
            {/* Left Side (Image & Brand) */}
            <div className="hidden lg:block relative w-[35%] h-full bg-black overflow-hidden">
                <img
                    src="https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&q=80&w=1000"
                    alt="Candle"
                    className="absolute inset-0 w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

                <div className="absolute inset-x-14 bottom-20 text-white z-10 text-left">
                    <Link to="/" className="flex items-center gap-3 mb-6 hover:opacity-80 transition-opacity">
                        <div className="w-10 h-10 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center font-bold text-sm tracking-wider border border-white/30">nc</div>
                        <span className="text-xl font-bold tracking-wide">Naisha Creations</span>
                    </Link>
                    <h1 className="text-[2rem] font-bold leading-[1.1] mb-6 tracking-tight font-serif text-white">
                        Illuminate Your<br />Space with Soul.
                    </h1>
                    <p className="text-gray-200 text-md leading-relaxed max-w-md font-light">
                        Experience the craftsmanship of premium hand-poured candles, designed to bring warmth and tranquility to your home.
                    </p>
                </div>
            </div>

            {/* Right Side (Form) */}
            <div className="w-full lg:w-[65%] h-full flex flex-col items-center px-6 py-12 hide-scrollbar overflow-y-auto bg-[#fafafa]">

                <div className="w-full max-w-[420px] my-auto">
                    <header className='text-center mb-10'>
                        <h2 className='text-[32px] font-bold text-[#111827] tracking-tight mb-2'>
                            Create New Password
                        </h2>
                        <p className='text-gray-500 text-[15px]'>
                            Your new password must be different from previously used passwords.
                        </p>
                    </header>

                    {/* Form Connected to HandleSubmit */}
                    <form className='space-y-6' onSubmit={handleSubmit}>

                        {/* New Password */}
                        <div className="space-y-1.5 text-left">
                            <label className="block text-[13px] font-medium text-gray-600">New Password</label>
                            <div className="relative flex items-center">
                                <input
                                    type={showNewPassword ? "text" : "password"}
                                    placeholder="Enter your new password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    className="w-full py-2.5 px-4 pr-10 bg-white border border-gray-200 rounded-[20px] focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 placeholder:text-gray-300 text-[14px] transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-4 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                                >
                                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-1.5 text-left">
                            <label className="block text-[13px] font-medium text-gray-600">Confirm Password</label>
                            <div className="relative flex items-center">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Confirm your new password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className="w-full py-2.5 px-4 pr-10 bg-white border border-gray-200 rounded-[20px] focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 placeholder:text-gray-300 text-[14px] transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-4 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                                >
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Submit Button with Loading State */}
                        <button
                            type="submit"
                            disabled={isResetting}
                            className='w-full py-3 mt-6 bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold rounded-[20px] transition-all shadow-[0_4px_14px_0_rgba(234,88,12,0.39)] text-[15px] cursor-pointer disabled:bg-gray-400 disabled:shadow-none'
                        >
                            {isResetting ? "Resetting Password..." : "Reset Password"}
                        </button>
                    </form>

                    {/* Back to Login */}
                    <div className="text-center mt-8 text-[14px] text-gray-500">
                        Back to {" "}
                        <Link to="/signin" className="text-[#ea580c] font-bold hover:underline">
                            Sign in
                        </Link>
                    </div>

                    {/* Footer Links */}
                    <div className="flex justify-center gap-6 mt-16 text-[12px] text-gray-400">
                        <Link to="#" className="hover:text-gray-600 transition-colors">Privacy Policy</Link>
                        <Link to="#" className="hover:text-gray-600 transition-colors">Terms of Service</Link>
                        <Link to="#" className="hover:text-gray-600 transition-colors">Support</Link>
                    </div>

                </div>
            </div>
        </div>
    )
}

export default ResetPassword;