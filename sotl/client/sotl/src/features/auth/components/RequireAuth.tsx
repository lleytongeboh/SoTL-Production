import { useLocation, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context";
import { Role, validateToken } from "../context/AuthContext";
import { useEffect, useState } from "react";

const RequireAuth = ({ allowedRoles }: { allowedRoles: Role[] }) => {
    const { role, setRole, isAuthenticated, loading : aLoad } = useAuth();
    const location = useLocation();

    const [loading, setLoading] = useState(true);

    const getRole = async () => {
        try {
            const response = await validateToken();
            if (response.valid) {
                setRole(response.role as Role);
            } else {
                setRole(null);
            }
        } catch (e) {
            setRole(null);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (isAuthenticated) {
            getRole();
        } else {
            setLoading(false);
        }
    }, [isAuthenticated]);

    // If still loading, render a loading indicator or nothing
    if (loading || aLoad) {
        return <div>Loading...</div>;
    } else {
        return (
            (isAuthenticated && role != null) ?
                (allowedRoles?.includes(role) ?
                    <Outlet />
                    : <Navigate to="/unauthorized" state={{ from: location }} replace />)
                : <Navigate to="/login" state={{ from: location.pathname }} />
        );
    }

}

export default RequireAuth;