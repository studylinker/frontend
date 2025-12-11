import React, { createContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import api from "../api/axios";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);   // ⭐ 추가

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const decoded = jwtDecode(token);

      if (!decoded.userId) {
        localStorage.removeItem("token");
        setLoading(false);
        return;
      }

      setUser({
        token,
        role: decoded.role,
        userId: decoded.userId,
        username: decoded.sub,
      });
    } catch (err) {
      localStorage.removeItem("token");
    } finally {
      setLoading(false);   // ⭐ 반드시 필요
    }
  }, []);

  // axios header sync
  useEffect(() => {
    if (user?.token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${user.token}`;
    } else {
      delete api.defaults.headers.common["Authorization"];
    }
  }, [user]);

  const login = (token) => {
    localStorage.setItem("token", token);
    const decoded = jwtDecode(token);

    setUser({
      token,
      role: decoded.role,
      userId: decoded.userId,
      username: decoded.sub,
    });
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
