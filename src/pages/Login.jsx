// src/pages/Login.jsx
import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../auth/AuthContext";
import api from "../api/axios";
import "./LoginCustom.css";
import AlertModal from "../components/AlertModal";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const [mode, setMode] = useState("signin");

  // 로그인 필드
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // 회원가입 필드
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [interestTags, setInterestTags] = useState([]);
  const [newTag, setNewTag] = useState("");

  // 모달 상태
  const [modal, setModal] = useState({
    show: false,
    title: "",
    message: "",
    type: "",
    redirect: null,
  });

  // 배경
  useEffect(() => {
    document.body.classList.add("login-background");
    return () => document.body.classList.remove("login-background");
  }, []);

  const closeModal = () => {
    if (modal.redirect) navigate(modal.redirect);
    setModal({
      show: false,
      title: "",
      message: "",
      type: "",
      redirect: null,
    });
  };

  // 태그 추가
  const handleAddTag = () => {
    if (newTag.trim() !== "" && !interestTags.includes(newTag.trim())) {
      setInterestTags([...interestTags, newTag.trim()]);
    }
    setNewTag("");
  };

  // -------------------------
  // 로그인
  // -------------------------
  const handleSignIn = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/auth/tokens", { username, password });

      const token = res.data.accessToken;
      login(token);

      // JWT payload decode
      const payload = JSON.parse(atob(token.split(".")[1]));
      const role = payload.role;

      if (role === "ADMIN") {
        setModal({
          show: true,
          title: "관리자 로그인 성공",
          message: "관리자 페이지로 이동합니다.",
          type: "success",
          redirect: "/admin",
        });
      } else {
        setModal({
          show: true,
          title: "로그인 성공",
          message: "환영합니다! 메인 페이지로 이동합니다.",
          type: "success",
          redirect: "/main",
        });
      }
    } catch (err) {
      setModal({
        show: true,
        title: "로그인 실패",
        message: "아이디 또는 비밀번호가 올바르지 않습니다.",
        type: "error",
        redirect: null,
      });
    }
  };

  // -------------------------
  // 회원가입
  // -------------------------
  const handleSignUp = async (e) => {
    e.preventDefault();

    if (password !== repeatPassword) {
      setModal({
        show: true,
        title: "오류",
        message: "비밀번호가 일치하지 않습니다.",
        type: "error",
      });
      return;
    }

    try {
      await api.post("/users", {
        username,
        password,
        email,
        name,
        interestTags,
      });

      setModal({
        show: true,
        title: "회원가입 완료",
        message: "성공적으로 가입되었습니다! 로그인해주세요.",
        type: "success",
        redirect: "/login",
      });

      setMode("signin");
    } catch (err) {
      setModal({
        show: true,
        title: "회원가입 실패",
        message: "이미 존재하는 아이디입니다.",
        type: "error",
      });
    }
  };

  return (
    <div className="container">
      <h1>{mode === "signin" ? "로그인" : "회원가입"}</h1>

      {/* 탭 */}
      <ul className="links tab-menu">
        <li>
          <a
            onClick={() => setMode("signin")}
            className={mode === "signin" ? "active" : ""}
          >
            로그인
          </a>
        </li>

        <li>
          <a
            onClick={() => setMode("signup")}
            className={mode === "signup" ? "active" : ""}
          >
            회원가입
          </a>
        </li>

        <li>
          <a
            className="reset-btn"
            onClick={() => {
              setUsername("");
              setPassword("");
              setRepeatPassword("");
              setEmail("");
              setName("");
              setInterestTags([]);
              setNewTag("");
            }}
          >
            초기화
          </a>
        </li>
      </ul>

      {/* FORM */}
      <form onSubmit={mode === "signin" ? handleSignIn : handleSignUp}>
        {/* Username */}
        <div
          className={`input__block ${
            mode === "signup" ? "signup-input__block" : "first-input__block"
          }`}
        >
          <input
            type="text"
            className="input"
            placeholder="아이디"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        {/* Password */}
        <div className="input__block">
          <input
            type="password"
            className="input"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {/* 회원가입 입력 */}
        {mode === "signup" && (
          <>
            <div className="input__block">
              <input
                type="password"
                className="input"
                placeholder="비밀번호 재입력"
                value={repeatPassword}
                onChange={(e) => setRepeatPassword(e.target.value)}
                required
              />
            </div>

            <div className="input__block">
              <input
                type="email"
                className="input"
                placeholder="이메일"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input__block">
              <input
                type="text"
                className="input"
                placeholder="이름"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {/* 관심사 태그 */}
            <div className="tag-list-wrapper">
              {interestTags.map((tag, idx) => (
                <span key={idx} className="tag-button">
                  {tag}
                </span>
              ))}
            </div>

            {/* 태그 입력 */}
            <div className="input__block">
              <input
                type="text"
                className="input"
                placeholder="관심 태그 추가"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
              />
              <button
                type="button"
                className="addtag__btn"
                onClick={handleAddTag}
              >
                + 태그 추가
              </button>
            </div>
          </>
        )}

        {/* 제출 버튼 */}
        <button className="signin__btn">
          {mode === "signin" ? "로그인" : "회원가입"}
        </button>
      </form>

      <div className="separator">
        <p>StudyLinker</p>
      </div>

      {/* 모달 */}
      <AlertModal
        show={modal.show}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onClose={closeModal}
      />
    </div>
  );
};

export default Login;
