import { TextField, Button, IconButton } from "@mui/material";
import React from "react";
import { ChangeCircle, Send } from "@mui/icons-material";
import { useLogin } from "../features/auth/context/LoginContext";
import { validateEmail } from "../utils/validator";
import { authHooks } from "../features/auth/hooks/authHooks";
import { useNavigate } from "react-router-dom";
import { useFeedbackDialog, SET_LOADING_STATUS_FALSE } from "../context/FeedbackDialog";

const ForgetPassword = () => {
  const navigate = useNavigate();
  const { setEmail, setOtp, setVerify } = useLogin();
  const [emailInput, setEmailInput] = React.useState('');
  const [otpInput, setOTPInput] = React.useState('');
  const [disabledEmailColumn, setDisabledEmailColumn] = React.useState(false);
  const [otpSent, setOtpSent] = React.useState(false);
  const [countdown, setCountdown] = React.useState(60);
  const { sendOTPThroughEmail, verifyOTP } = authHooks();
  const { setLoadingPane, setError } = useFeedbackDialog();

  const handleSubmitEmail = async () => {
    setLoadingPane({ status: true, message: "Sending OTP..." });
    try {
      const result = await sendOTPThroughEmail({ email: emailInput });
      if (result) {
        setEmail(emailInput);
        setDisabledEmailColumn(true);
        setCountdown(60);
        setOtpSent(true);
      }
    } catch (error: any) {
      console.error(error.message);
      setError({ status: true, message: error.message });
    } finally {
      setLoadingPane(SET_LOADING_STATUS_FALSE);
    }
  }

  const handleChangeEmail = () => {
    setDisabledEmailColumn(false);
    setOTPInput('');
    setOtpSent(false);
  }

  const handleResentOTP = async () => {
    setLoadingPane({ status: true, message: "Resending OTP..." });
    try {
      const result = await sendOTPThroughEmail({ email: emailInput });
      if (result) {
        setOtpSent(true);
        setCountdown(60);
      }
    } catch (error: any) {
      console.error(error.message);
      setError({ status: true, message: error.message });
    } finally {
      setLoadingPane(SET_LOADING_STATUS_FALSE);
    }
  }

  const handleSubmitOTP = async () => {
    setLoadingPane({ status: true, message: "Verifying OTP..." });
    try {
      const result = await verifyOTP({ otp: otpInput, email: emailInput });
      if (result) {
        setOtp(otpInput);
        setVerify(true);
        navigate('/login/reset-password');
      }
    } catch (error: any) {
      console.error(error.message);
      setError({ status: true, message: error.message });
    } finally {
      setLoadingPane(SET_LOADING_STATUS_FALSE);
    }
  };

  React.useEffect(() => {

    let intervalId: number | undefined;

    if (otpSent && countdown > 0) {
      intervalId = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setOtpSent(false); // Reset OTP sent status
      setCountdown(60); // Reset the countdown
    }

    // Cleanup the interval when the component unmounts or when the countdown or otpSent changes
    return () => clearInterval(intervalId);
  }, [otpSent, countdown]);

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
            onClick={() => {
              if (document.referrer && document.referrer.includes(window.location.host)) {
                navigate(-1); // Go back to the previous page if it was from the same site
              } else {
                navigate('/login'); // Navigate to the login page if no previous page within the same site
              }
            }}
          >Back</Button>
        </div>
        <img src="/images/logo.jpg" alt="Logo" style={{ width: '400px', height: '400px' }} />
        <p className="pb-5 font-bold">Forgot Password</p>
        <p className="text-left" style={{ width: '100%' }}>Please enter your email</p>
        <div
          className="flex flex-row justify-start items-center gap-2"
          style={{ width: '100%' }}
        >
          <TextField
            label="Email"
            variant={disabledEmailColumn ? "filled" : "outlined"}
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            fullWidth
            margin="normal"
            required
            className="grow"
            disabled={disabledEmailColumn}
          />
          {
            disabledEmailColumn &&
            <IconButton
              onClick={handleChangeEmail}
              title="Change Email"
            >
              <ChangeCircle />
            </IconButton>
          }

        </div>
        {
          !disabledEmailColumn &&
          <Button
            title="Send OTP"
            onClick={handleSubmitEmail}
            type="button"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ marginTop: "1rem", borderRadius: 28 }}
            disabled={!(validateEmail(emailInput) && emailInput.trim() !== "")}
          >
            Send OTP
          </Button>
        }
        {
          disabledEmailColumn &&
          <>
            <p className="text-left" style={{ width: '100%' }}>Enter the verification code sent to your email</p>
            <div
              className="flex flex-row justify-start items-center gap-2"
              style={{ width: '100%' }}
            >
              <TextField
                label="OTP"
                variant={"outlined"}
                value={otpInput}
                onChange={(e) => setOTPInput(e.target.value)}
                fullWidth
                margin="normal"
                required
                className="grow"
              />
              <IconButton
                onClick={handleResentOTP}
                title="Resent OTP"
                color={"primary"}
                disabled={otpSent}
              >
                <Send />
              </IconButton>
            </div>
            <p className="text-right" style={{ width: '100%', color: 'red' }}>{otpSent && `Resend OTP in ${countdown} seconds`}</p>
            <Button
              title="Submit OTP"
              onClick={handleSubmitOTP}
              type="button"
              variant="contained"
              color="primary"
              fullWidth
              sx={{ marginTop: "1rem", borderRadius: 28 }}
              disabled={otpInput.length !== 6}
            >
              Submit OTP
            </Button>
          </>
        }
      </div>
    </>
  );
};

export default ForgetPassword;