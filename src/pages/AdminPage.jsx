// src/pages/AdminPage.jsx

import React from "react";
import { Link, Routes, Route } from "react-router-dom";
import OpsChart from "./admin/OpsChart";        // 대시보드
import UserList from "./admin/UserList";        // 사용자 관리
import GroupList from "./admin/GroupList";      // 스터디 그룹 관리
import BoardManagement from "./admin/BoardManagement"; // 게시판 관리
import RecoManagement from "./admin/RecoManagement";   // 추천 관리
import SystemManagement from "./admin/SystemManagement"; // 시스템/문의 관리
import {
  FaChartPie,
  FaUsers,
  FaLayerGroup,
  FaClipboardList,
  FaLightbulb,
  FaTools
} from "react-icons/fa";
// 아이콘 

const AdminPage = () => {
  const adminName = "관리자";

  return (
    <div className="admin-wrapper">
      {/* Navbar */}
      <nav className="navbar navbar-dark bg-dark px-3 d-flex justify-content-between">
        <a className="navbar-brand" href="/admin">
          Admin Panel
        </a>

        <div className="d-flex align-items-center">
          <span className="text-light me-3">{adminName}님</span>

          <button
            className="btn btn-outline-light btn-sm"
            onClick={() => {
              if (window.confirm("정말 로그아웃 하시겠습니까?")) {
                localStorage.removeItem("token");
                window.location.href = "/login";   // navigate 없이 강제 이동
              }
            }}
          >
            로그아웃
          </button>
        </div>
      </nav>

      {/* Sidebar + Main */}
      <div className="container-fluid">
        <div className="row">
          {/* Sidebar */}
          <div className="col-2 sidebar-modern vh-100 p-0">
            <ul className="sidebar-menu">

              <li>
                <Link to="/admin/dashboard" className="sidebar-item">
                  <span className="icon"><FaChartPie /></span>
                  <span>대시보드</span>
                </Link>
              </li>

              <li>
                <Link to="/admin/users" className="sidebar-item">
                  <span className="icon"><FaUsers /></span>
                  <span>사용자 관리</span>
                </Link>
              </li>

              <li>
                <Link to="/admin/groups" className="sidebar-item">
                  <span className="icon"><FaLayerGroup /></span>
                  <span>스터디 그룹 관리</span>
                </Link>
              </li>

              <li>
                <Link to="/admin/board" className="sidebar-item">
                  <span className="icon"><FaClipboardList /></span>
                  <span>게시판 관리</span>
                </Link>
              </li>

              <li>
                <Link to="/admin/recommendation" className="sidebar-item">
                  <span className="icon"><FaLightbulb /></span>
                  <span>추천 관리</span>
                </Link>
              </li>

              <li>
                <Link to="/admin/system" className="sidebar-item">
                  <span className="icon"><FaTools /></span>
                  <span>시스템/문의 관리</span>
                </Link>
              </li>

            </ul>
          </div>
          {/* Main content - 라우트 확장 */}
          <div className="col-10 p-4">
            <Routes>
              {/* 기존 라우트 (path는 그대로 유지) */}
              <Route path="dashboard" element={<OpsChart />} />
              <Route path="users" element={<UserList />} />
              <Route path="groups" element={<GroupList />} />
              
              {/* 추가된 라우트 */}
              <Route path="board/*" element={<BoardManagement />} />
              <Route path="recommendation" element={<RecoManagement />} />
              <Route path="system/*" element={<SystemManagement />} />
              
              {/* 기본 라우트: /admin 접근 시 대시보드 표시 */}
              <Route path="/" element={<OpsChart />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;