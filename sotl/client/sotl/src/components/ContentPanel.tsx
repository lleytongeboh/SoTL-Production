import { ArrowBackIos } from "@mui/icons-material";
import { Box, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import ErrorPopup from "./ErrorPopup";
import SuccessPopup, { PopupProps } from "./SuccessPopup";
import LoadingPopup, { LoadingPopupProps } from "./LoadingPopup";
import { useEffect } from "react";


interface ContentPanelProps {
    removeTitleRow?: boolean;
    hasBackButton?: boolean;
    backLink?: string | -1;
    titleIcon?: React.ReactNode;
    title: string;
    content: React.ReactNode;
    customActions?: React.ReactNode; // overwrites back button
    errorPopup?: PopupProps;
    successPopup?: PopupProps;
    loadingPopup?: LoadingPopupProps;
    bgColor?: string;
    borderShadowSize?: number;
}

export interface SuccessPopupProps {
}

const ContentPanel: React.FC<ContentPanelProps> = ({ removeTitleRow, hasBackButton, backLink, titleIcon, title, content, errorPopup, successPopup, loadingPopup, customActions, bgColor, borderShadowSize }) => {
    const navigate = useNavigate();

    const handleNavigation = () => {
        if (backLink === -1) {
            navigate(-1);
        } else {
            navigate(backLink ?? "/");
        }
    }

    return (
        <>
            {loadingPopup && <LoadingPopup
                open={loadingPopup.open}
                onClose={loadingPopup.onClose}
                content={loadingPopup.content}
            />}
            {successPopup && <SuccessPopup
                open={successPopup.open}
                onClose={successPopup.onClose}
                content={successPopup.content}
            />}
            {errorPopup && <ErrorPopup
                open={errorPopup.open}
                onClose={errorPopup.onClose}
                content={errorPopup.content}
            />}
            <Box sx={{ backgroundColor: bgColor??'white', p: '40px', width: '100%', boxShadow: borderShadowSize??0 }}>
                {removeTitleRow ? null : (
                    <div className='flex justify-between mb-8'>
                        <div className="flex items-center gap-2">
                            {titleIcon}
                            <b className="title text-left">{title}</b>
                        </div>
                        {customActions ? customActions : hasBackButton && <Button sx={{height: '40px'}} variant='contained' onClick={() => handleNavigation()} startIcon={<ArrowBackIos />}>
                            Back
                        </Button>}
                    </div>
                )}
                {content}
            </Box>
        </>
    );
}

export default ContentPanel;