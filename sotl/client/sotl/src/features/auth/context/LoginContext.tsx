import { Outlet } from "react-router-dom";
import React, { Dispatch, SetStateAction, createContext } from 'react';

export type BaseFeedbackDialogProps = {
    email: String;
    setEmail: Dispatch<SetStateAction<String>>;
    otp: String;
    setOtp: Dispatch<SetStateAction<String>>
    verify: Boolean;
    setVerify: Dispatch<SetStateAction<Boolean>>
};

const LoginContext = createContext<any>(null);

export const useLogin = () => {
    const context = React.useContext(LoginContext);
    if (!context) {
        throw new Error('useLoginContext must be used within an LoginProvider');
    }
    return context;
};

export const LoginProvider: React.FC<{ children: React.ReactNode }> = ({ children })  => {
    const [email, setEmail] = React.useState<String | null>("");
    const [otp, setOtp] = React.useState<String | null>("");
    const [verify, setVerify] = React.useState<Boolean>(false);
    
    return (
        <LoginContext.Provider value={{ email, setEmail, otp, setOtp, verify, setVerify }}>
            { children }
        </LoginContext.Provider>
    );
}