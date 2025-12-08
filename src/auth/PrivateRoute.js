import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "./AuthContext";

const PrivateRoute = ({ children, role }) => {
  const { user } = useContext(AuthContext);

  if (!user) {
    return <Navigate to="/login" />;
  }

  // role이 필요한데 현재 유저 권한이 다르면 접근 불가임
  if (role && user.role !== role) {
    return <Navigate to="/main" />;
  }

  return children;
};

export default PrivateRoute;
