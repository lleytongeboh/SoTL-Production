import { TextField, Button, IconButton } from "@mui/material";
import React from "react";
import { ChangeCircle, Send } from "@mui/icons-material";
import { useLogin } from "../features/auth/context/LoginContext";
import { validateEmail } from "../utils/validator";
import { authHooks } from "../features/auth/hooks/authHooks";
import { useNavigate } from "react-router-dom";
import { useFeedbackDialog, SET_LOADING_STATUS_FALSE } from "../context/FeedbackDialog";

const ResettingPassword = () => {
    const navigate = useNavigate();
    const { setOtp, otp, setEmail, email, setVerify, verify, } = useLogin();
    const { changePassword } = authHooks();
    const [newPassword, setNewPassword] = React.useState("");
    const [confirmPassword, setConfirmPassword] = React.useState("");
    const { setLoadingPane, setError, setSuccess } = useFeedbackDialog();

    const handleChangePassword = async () => {
        setLoadingPane({ status: true, message: "Updating Password" });
        try {
            const result = await changePassword({ password: newPassword, otp: otp, email: email });
            if (result) {
                setOtp("");
                setEmail("");
                setVerify(false);
                setSuccess({ status: true, message: "Password Updated Successfully" });
                navigate("/login");
            }
        } catch (error: any) {
            console.error(error.message);
            setError({ status: true, message: error.message });
        } finally {
            setLoadingPane(SET_LOADING_STATUS_FALSE);
        }
    }

    React.useEffect(() => {
        if(!validateEmail(email) || email.trim() === "" || !verify || otp.length !== 6) {
            setError({ status: true, message: "Invalid Email Verified" });
            navigate("/login/forget-password");
        }
    }, []);

    return (
        <>
            <div
                className="flex flex-col items-center justify-center"
            >
                <div
                    className="flex flex-row justify-start items-center"
                    style={{ width: '100%' }}
                >
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => navigate(-1)}
                    >Back</Button>
                </div>
                <img src="/images/logo.jpg" alt="Logo" style={{ width: '400px', height: '400px' }} />
                <p className="pb-5 font-bold">Create Your New Password</p>
                <p className="text-left" style={{ width: '100%' }}>Enter Your New Password</p>
                <TextField
                    label="New Password"
                    variant="outlined"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    fullWidth
                    margin="normal"
                    required
                    className="grow"
                    helperText="Password must be at least 8 characters long"
                />
                <p className="text-left" style={{ width: '100%' }}>Confirm Your New Password</p>
                <TextField
                    label="Confirmed Password"
                    variant="outlined"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    fullWidth
                    margin="normal"
                    required
                    className="grow"
                    helperText={newPassword !== confirmPassword ? "Confirmed Password do not matched to the new password" : ""}
                />
                <Button
                    title="Reset Password"
                    onClick={handleChangePassword}
                    type="button"
                    variant="contained"
                    color="primary"
                    fullWidth
                    sx={{ marginTop: "1rem", borderRadius: 28 }}
                    disabled={!(newPassword.length >= 8 && newPassword === confirmPassword )}
                >
                    Reset Password
                </Button>

            </div>
        </>
    );
};

export default ResettingPassword;