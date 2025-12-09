// src/pages/MainPage.jsx

import React, { useEffect, useState, useRef } from "react";
import { Link, Routes, Route, useLocation } from "react-router-dom";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./Mainpage.css";
import api from "../api/axios";

// 기존 컴포넌트들
import StudyList from "./main/StudyList";
import RecommendGroups from "./main/RecommendGroups";
import UserBasicDashboard from "./main/UserBasicDashboard";
import Board from "./main/Board";
import BoardWrite from "./main/BoardWrite";
import MyPage from "./main/MyPage";
import EditProfile from "./main/EditProfile";
import BoardDetail from "./main/BoardDetail";

import ScheduleCreateModal from "../components/ScheduleCreateModal";
import AttendanceModal from "../components/AttendanceModal";
import ScheduleDetailModal from "../components/ScheduleDetailModal";

const sidebarStyles = {
  link: {
    color: "#000",
    textDecoration: "none",
    fontWeight: "500",
  },
};

const MainPage = () => {
  const location = useLocation();

    // 사용자 정보
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState("");

  // 리더 여부
  const [isLeader, setIsLeader] = useState(false);
  const [leaderGroups, setLeaderGroups] = useState([]);

  // 일정
  const [schedules, setSchedules] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // 지도
  const mapContainerRef = useRef(null);       // 지도 DOM
  const googleMapRef = useRef(null);          // 지도 객체
  const markerRefs = useRef([]);              // 지도 마커들

  // 현재 사용자 위치
  const [userLocation, setUserLocation] = useState(null);

  // 일정 생성/상세 모달
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createMode, setCreateMode] = useState(null);
  const [editScheduleData, setEditScheduleData] = useState(null);
  const [modalMode, setModalMode] = useState("create");

  const [openDetailModal, setOpenDetailModal] = useState(false);
  const [detailScheduleId, setDetailScheduleId] = useState(null);

  // 출석 모달
  const [openAttendanceModal, setOpenAttendanceModal] = useState(null);

  // 알림
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // =============================
  // 사용자 정보 로드
  // =============================
  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await api.get("/users/profile");
        setUserId(res.data.userId);
        setUsername(res.data.name);
        localStorage.setItem("userId", res.data.userId);
      } catch (err) {
        console.error("유저 정보 실패:", err);
      }
    };
    loadUser();
  }, []);

  // =============================
  // 일정 로드
  // =============================
  const loadSchedules = async () => {
    try {
      const res = await api.get("/study-schedules/me");

      const processed = await Promise.all(
        res.data.map(async (s) => {
          const scheduleId = s.scheduleId;
          const groupId = s.groupId ?? null;

          let group = null;

          if (groupId != null) {
            try {
              const groupRes = await api.get(`/study-groups/${groupId}`);
              group = groupRes.data;
            } catch (err) {
              console.error("그룹 조회 실패:", err);
            }
          }

          return {
            id: scheduleId,
            groupId,
            title: s.title,
            groupTitle: group?.title || s.title,
            content: s.description,
            date: new Date(s.startTime),
            lat: group?.latitude ?? null,
            lng: group?.longitude ?? null,
          };
        })
      );

      setSchedules(processed);
    } catch (e) {
      console.error("일정 로드 실패:", e);
    }
  };

  useEffect(() => {
    if (userId) loadSchedules();
  }, [userId]);

  // =============================
  // 리더 여부 확인
  // =============================
  useEffect(() => {
    if (!userId) return;

    const checkLeader = async () => {
      try {
        const res = await api.get("/study-groups");
        const groups = res.data || [];

        const myLeaderGroups = groups.filter(
          (g) => g.leaderId === userId
        );

        setIsLeader(myLeaderGroups.length > 0);
        setLeaderGroups(myLeaderGroups);
      } catch (e) {
        console.error("리더 체크 실패:", e);
      }
    };

    checkLeader();
  }, [userId]);

  // -----------------------------------
  // 1) 사용자 GPS 가져오기
  // -----------------------------------
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
      (err) => console.error("GPS 실패:", err)
    );
  }, []);


  // ===================================================================
  // 2) Google 지도 초기화 — ★ HOME(/main) 들어올 때마다 1번 생성
  // ===================================================================
  useEffect(() => {
    // HOME 페이지가 아닐 때 → 지도 생성 X
    if (location.pathname !== "/main") return;

    // Google Maps 로드되었는지 확인
    if (!window.google || !window.google.maps) return;

    const container = mapContainerRef.current;
    if (!container) return;

    // 기존 지도 있으면 재생성 방지
    if (!googleMapRef.current) {
      googleMapRef.current = new window.google.maps.Map(container, {
        center: { lat: 37.5665, lng: 126.9780 },
        zoom: 13,
      });
      console.log("✅ Google Map CREATED");
    }

    // -------------------------------
    // cleanup → HOME 페이지 벗어나면 map을 비움
    // -------------------------------
    return () => {
      console.log("🧹 Google Map CLEANED (HOME OUT)");
      googleMapRef.current = null;   // ← 중요!
    };
  }, [location.pathname]); // ← HOME 들어올 때만 실행됨



  // ===================================================================
  // 3) 마커 갱신 — 지도는 유지하고 마커만 바뀜
  // ===================================================================
  useEffect(() => {
    if (!googleMapRef.current) return; // 지도 없으면 실행 X

    // 기존 마커 제거
    markerRefs.current.forEach((m) => m.setMap(null));
    markerRefs.current = [];

    // -------------------------------
    // 🔵 내 위치 마커
    // -------------------------------
    if (userLocation) {
      const myMarker = new window.google.maps.Marker({
        position: userLocation,
        map: googleMapRef.current,
        icon: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
      });

      markerRefs.current.push(myMarker);
      googleMapRef.current.setCenter(userLocation);
    }

    // -------------------------------
    // 🔴 스터디 일정 마커
    // -------------------------------
    schedules.forEach((s) => {
      if (!s.lat || !s.lng) return;

      const marker = new window.google.maps.Marker({
        position: { lat: s.lat, lng: s.lng },
        map: googleMapRef.current,
        icon: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
      });

      const infowindow = new window.google.maps.InfoWindow({
        content: `<div style="padding:5px;">${s.groupTitle}</div>`,
      });

      marker.addListener("click", () =>
        infowindow.open(googleMapRef.current, marker)
      );

      markerRefs.current.push(marker);
    });
  }, [userLocation, schedules]);

  // =============================
  // 날짜 하이라이트
  // =============================
  const highlightScheduleDates = ({ date }) => {
    const found = schedules.find(
      (s) =>
        s.date.getFullYear() === date.getFullYear() &&
        s.date.getMonth() === date.getMonth() &&
        s.date.getDate() === date.getDate()
    );
    return found ? "highlight" : "";
  };

  const schedulesForDate = schedules.filter(
    (s) =>
      s.date.getFullYear() === selectedDate.getFullYear() &&
      s.date.getMonth() === selectedDate.getMonth() &&
      s.date.getDate() === selectedDate.getDate()
  );

  // =============================
  // 알림 처리 로직 (기존 그대로)
  // =============================
  useEffect(() => {
    if (!userId) return;

    const loadNotifications = async () => {
      try {
        const res = await api.get("/notifications");
        const mapped = res.data.map((n) => ({
          id: n.notificationId,
          message: n.message,
          isRead: n.is_read,
          type: n.type,
        }));
        setNotifications(mapped);
      } catch (err) {
        console.error("알림 실패:", err);
      }
    };

    loadNotifications();
    loadUnreadCount();
  }, [userId]);

  const loadUnreadCount = async () => {
    try {
      const res = await api.get("/notifications/unread");
      setUnreadCount(res.data.length || 0);
    } catch (err) {
      console.error("unread count 실패:", err);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, isRead: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(prev - 1, 0));
    } catch (err) {
      console.error("읽음 실패:", err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      const target = notifications.find((n) => n.id === id);

      if (target && !target.isRead) {
        setUnreadCount((prev) => Math.max(prev - 1, 0));
      }

      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error("알림 삭제 실패:", err);
    }
  };

  const deleteAllNotifications = async () => {
    if (!window.confirm("모든 알림 삭제?")) return;

    try {
      await api.delete("/notifications/all");
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error("전체 삭제 실패:", err);
    }
  };

  // =============================
  // UI
  // =============================
  return (
    <div className="mainpage-wrapper">
      {/* NAVBAR */}
      <nav className="navbar navbar-expand-lg navbar-dark shadow-sm navbar-custom">
        <a className="navbar-brand" href="/">
          <img
            src="/logo.png"
            alt="logo"
            style={{ height: "70px", marginLeft: "30px" }}
          />
        </a>

        <div className="ml-auto d-flex align-items-center">
          <span className="me-3">{username}님</span>
          <button
            className="btn btn-sm btn-outline-light position-relative"
            onClick={() => setShowNotifications(true)}
          >
            🔔 알림
            {unreadCount > 0 && (
              <span className="badge bg-danger position-absolute top-0 start-100 translate-middle">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* LAYOUT */}
      <div className="container-fluid">
        <div className="row">
          {/* SIDEBAR */}
          <div className="col-3 bg-light vh-100 p-3 border-right">
            <ul className="list-group">
              <li className="list-group-item">
                <Link to="/main" className="nav-link" style={sidebarStyles.link}>
                  HOME
                </Link>
              </li>
              <li className="list-group-item">
                <Link to="/main/list" className="nav-link" style={sidebarStyles.link}>
                  스터디 목록
                </Link>
              </li>
              <li className="list-group-item">
                <Link
                  to="/main/recommend"
                  className="nav-link"
                  style={sidebarStyles.link}
                >
                  추천 그룹
                </Link>
              </li>
              <li className="list-group-item">
                <Link to="/main/board" className="nav-link" style={sidebarStyles.link}>
                  게시판
                </Link>
              </li>
              <li className="list-group-item">
                <Link to="/main/mypage" className="nav-link" style={sidebarStyles.link}>
                  내 프로필
                </Link>
              </li>
            </ul>
          </div>

          {/* CONTENT */}
          <div className="col-9 p-4">
            <Routes>
              <Route
                index
                element={
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h2 className="mb-0">
                        <strong>스터디 일정</strong>
                      </h2>

                      <div>
                        {isLeader && (
                          <button
                            className="learn-more btn-spacing"
                            onClick={() => {
                              setCreateMode("study");
                              setShowCreateModal(true);
                            }}
                          >
                            ➕ 스터디 일정 등록
                          </button>
                        )}

                        <button
                          className="learn-more btn-spacing"
                          onClick={() => {
                            setCreateMode("personal");
                            setShowCreateModal(true);
                          }}
                        >
                          ➕ 개인 일정 등록
                        </button>
                      </div>
                    </div>

                    {/* 달력 + 지도 */}
                    <div className="row">
                      <div className="col-md-6">
                        <Calendar
                          onChange={setSelectedDate}
                          value={selectedDate}
                          tileClassName={highlightScheduleDates}
                        />

                        <p className="mt-2">
                          선택한 날짜: {selectedDate.toDateString()}
                        </p>

                        {schedulesForDate.length > 0 ? (
                          schedulesForDate.map((s) => (
                            <div
                              className="p-2 border rounded mb-2 schedule-item"
                              style={{ cursor: "pointer" }}
                              key={s.id}
                              onClick={() => {
                                setDetailScheduleId(s.id);
                                setOpenDetailModal(true);
                              }}
                            >
                              <strong>{s.title}</strong>
                            </div>
                          ))
                        ) : (
                          <p>등록된 일정이 없습니다.</p>
                        )}
                      </div>

                      <div className="col-md-6 d-flex align-items-stretch">
                        <div
                          id="map"
                          ref={mapContainerRef} 
                          style={{
                            width: "100%",
                            height: "400px",
                            borderRadius: "10px",
                            backgroundColor: "#eee",
                          }}
                        ></div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <UserBasicDashboard currentUserId={userId} />
                    </div>
                  </div>
                }
              />

              <Route path="list" element={<StudyList />} />
              <Route path="recommend" element={<RecommendGroups />} />
              <Route path="board" element={<Board />} />
              <Route path="board/write" element={<BoardWrite />} />
              <Route path="board/detail/:postId" element={<BoardDetail />} />
              <Route path="board/edit/:postId" element={<BoardWrite />} />
              <Route path="mypage" element={<MyPage />} />
              <Route path="edit-profile" element={<EditProfile />} />
            </Routes>
          </div>
        </div>
      </div>

      {/* 일정 생성 모달 */}
      {showCreateModal && (
        <ScheduleCreateModal
          mode={createMode}
          leaderGroups={leaderGroups}
          baseDate={
            modalMode === "update"
              ? null
              : selectedDate.toLocaleDateString("en-CA")
          }
          scheduleData={editScheduleData}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadSchedules();
          }}
        />
      )}

      {/* 일정 상세 모달 */}
      {openDetailModal && detailScheduleId && (
        <ScheduleDetailModal
          scheduleId={detailScheduleId}
          userId={userId}
          onOpenAttendance={(id) => setOpenAttendanceModal(id)}
          onClose={(mode, schedule) => {
            setOpenDetailModal(false);

            if (mode === "deleted") {
              loadSchedules();
              return;
            }

            if (mode === "update") {
              setEditScheduleData(schedule);
              setModalMode("update");
              setCreateMode(schedule.group_id ? "study" : "personal");
              setShowCreateModal(true);
            }
          }}
        />
      )}

      {/* 출석 모달 */}
      {openAttendanceModal && (
        <AttendanceModal
          scheduleId={openAttendanceModal}
          onClose={() => setOpenAttendanceModal(null)}
        />
      )}

      {/* 알림 모달 */}
      {showNotifications && (
        <div
          className="modal d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">🔔 알림</h5>
                <button
                  className="btn-close btn-close-white"
                  onClick={() => setShowNotifications(false)}
                ></button>
              </div>

              <div className="modal-body">
                {notifications.length === 0 && <p>알림이 없습니다.</p>}

                <ul className="list-group">
                  {notifications.map((n) => (
                    <li
                      key={n.id}
                      className={`list-group-item d-flex justify-content-between align-items-center ${
                        n.isRead ? "read-notification" : "unread-notification"
                      }`}
                    >
                      <div
                        onClick={() => markAsRead(n.id)}
                        style={{ cursor: "pointer", flex: 1 }}
                      >
                        <span>{n.message}</span>
                        {!n.isRead && (
                          <span className="badge bg-warning text-dark ms-2">
                            새 알림
                          </span>
                        )}
                      </div>

                      <button
                        className="btn btn-sm btn-outline-danger ms-2"
                        onClick={() => deleteNotification(n.id)}
                      >
                        🗑
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="modal-footer">
                <button
                  className="btn btn-danger btn-sm me-auto"
                  onClick={deleteAllNotifications}
                >
                  전체 삭제
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowNotifications(false)}
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainPage;
