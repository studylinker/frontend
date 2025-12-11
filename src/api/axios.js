// src/api/axios.js

import axios from "axios";

const api = axios.create({
  baseURL:
    window.location.hostname === "localhost"
      ? "http://localhost:8080/api"
      : "https://gachon.studylink.click/api",
});

// 요청 인터셉터 (로그 + 토큰 주입)
api.interceptors.request.use(
  (config) => {
    const method = (config.method || "get").toUpperCase();
    const fullUrl = `${config.baseURL || ""}${config.url || ""}`;

    // 로그인 / 회원가입 구분
    const isLogin =
      config.url && (config.url.includes("/auth/login") || config.url.includes("/auth/tokens"));
    const isRegister =
      config.url && config.url.includes("/users") && config.method === "post";

    if (!isLogin && !isRegister) {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
        console.log(
          "[AXIOS REQ]",
          method,
          fullUrl,
          "=> Authorization:",
          config.headers.Authorization
        );
      } else {
        console.log("[AXIOS REQ]", method, fullUrl, "=> 토큰 없음");
      }
    } else {
      console.log("[AXIOS REQ - 로그인/회원가입]", method, fullUrl);
    }

    return config;
  },
  (error) => {
    console.error("[AXIOS REQ ERROR]", error);
    return Promise.reject(error);
  }
);

// 응답 인터셉터 (로그 + 401 처리)
api.interceptors.response.use(
  (response) => {
    console.log(
      "[AXIOS RES]",
      response.status,
      response.config?.url,
      "data:",
      response.data
    );
    return response;
  },
  (error) => {
    if (error.response) {
      console.error(
        "[AXIOS RES ERROR]",
        error.response.status,
        error.config?.url,
        "data:",
        error.response.data
      );

      if (error.response.status === 401) {
        console.warn("401 발생 → 자동 로그아웃 하지 않음.");
        // localStorage.removeItem("token");  ❌ 삭제
        // window.location.href = "/login";   ❌ 삭제
      }
    } else {
      console.error("[AXIOS RES ERROR - no response]", error);
    }
    return Promise.reject(error);
  }
);

export default api;
