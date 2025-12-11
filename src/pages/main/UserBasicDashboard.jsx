// src/pages/main/UserBasicDashboard.jsx

import React, { useEffect, useState, useRef } from "react";
import Chart from "chart.js/auto";
import "react-calendar/dist/Calendar.css";
import api from "../../api/axios";

const UserBasicDashboard = () => {
  // ⭐ userId는 localStorage 대신 서버에서 /users/profile 로 가져온다
  const [userId, setUserId] = useState(null);

  const [schedules, setSchedules] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  const pieChartRef = useRef(null);
  const barChartRef = useRef(null);

  const getStart = (s) => s.startTime ?? s.start_time;
  const getEnd = (s) => s.endTime ?? s.end_time;
  const getId = (s) => s.scheduleId ?? s.schedule_id;

  // =====================================================================
  // ⭐ 1) 로그인 사용자 정보 로드 — localStorage polling 삭제
  // =====================================================================
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await api.get("/users/profile");
        setUserId(res.data.userId); // ⭐ 진짜 로그인 사용자 ID
      } catch (err) {
        console.error("[Dashboard] 프로필 조회 실패:", err);
      }
    };

    loadProfile();
  }, []);

  // =====================================================================
  // ⭐ 2) 일정 + 출석 로드 — /attendance/me 사용 (403 해결)
  // =====================================================================
  const loadData = async () => {
    try {
      // 내 일정
      const scheduleRes = await api.get("/study-schedules/me");
      setSchedules(scheduleRes.data || []);

      // ⭐ 내 출석 정보 (userId 불필요)
      const attendanceRes = await api.get(`/attendance/me`);
      setAttendance(attendanceRes.data || []);
    } catch (err) {
      console.error("[Dashboard] 로드 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) return; // ⭐ userId가 로드될 때까지 대기
    loadData();
  }, [userId]);

  // =====================================================================
  // 출석 통계 계산
  // =====================================================================
  const attendanceStats = {
    present: attendance.filter((a) => a.status === "PRESENT").length,
    late: attendance.filter((a) => a.status === "LATE").length,
    absent: attendance.filter((a) => a.status === "ABSENT").length,
  };

  // =====================================================================
  // 월별 참여 횟수
  // =====================================================================
  const monthMap = {};

  const attended = attendance.filter(
    (a) => a.status === "PRESENT" || a.status === "LATE"
  );

  attended.forEach((att) => {
    const schedule = schedules.find(
      (s) =>
        (s.schedule_id ?? s.scheduleId) === (att.schedule_id ?? att.scheduleId)
    );
    if (!schedule) return;

    const gid = schedule.group_id ?? schedule.groupId;
    if (!gid) return;

    const start = getStart(schedule);
    if (!start) return;

    const month = new Date(start).getMonth() + 1;
    monthMap[month] = (monthMap[month] || 0) + 1;
  });

  const dynamicLabels = Object.keys(monthMap).map((m) => `${m}월`);
  const dynamicData = Object.values(monthMap);

  // =====================================================================
  // 이번 주 일정
  // =====================================================================
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const weeklySchedules = schedules.filter((s) => {
    const start = getStart(s);
    if (!start) return false;

    const d = new Date(start);

    const gid = s.groupId ?? s.group_id;
    if (!gid) return false;

    // 이번 주 범위 안에 들어오면 포함 (과거 + 미래 모두 포함)
    return d >= startOfWeek && d <= endOfWeek;
  });

  const target = weeklySchedules.length;

  const done = weeklySchedules.filter((s) => {
    const end = getEnd(s) ?? getStart(s); // 종료시간 없으면 시작시간으로 판단
    return new Date(end) < new Date();    // 오늘 이전이면 완료 처리
  }).length;

  const goalPercent = target > 0 ? (done / target) * 100 : 0;

  // =====================================================================
  // 차트 렌더링
  // =====================================================================
  useEffect(() => {
    if (loading) return;

    const pastelColors = {
      blue: "#A7C7E7",
      yellow: "#FFE5A8",
      pink: "#F7C5CC",
      mint: "#B4E2C8",
      purple: "#D7C6F3",
      sky: "#B8E3FF",
    };

    // ⭐ 파이 차트
    const ctx1 = document.getElementById("attendanceRatioChart");
    if (ctx1) {
      if (pieChartRef.current) pieChartRef.current.destroy();
      pieChartRef.current = new Chart(ctx1, {
        type: "pie",
        data: {
          labels: ["출석", "지각", "결석"],
          datasets: [
            {
              data: [
                attendanceStats.present,
                attendanceStats.late,
                attendanceStats.absent,
              ],
              backgroundColor: [
                pastelColors.blue,
                pastelColors.yellow,
                pastelColors.pink,
              ],
            },
          ],
        },
      });
    }

    // ⭐ 바 차트
    const ctx2 = document.getElementById("participationCountChart");
    if (ctx2) {
      if (barChartRef.current) barChartRef.current.destroy();
      barChartRef.current = new Chart(ctx2, {
        type: "bar",
        data: {
          labels: dynamicLabels,
          datasets: [
            {
              label: "참여 횟수",
              data: dynamicData,
              backgroundColor: pastelColors.purple,
            },
          ],
        },
      });
    }
  }, [loading, schedules, attendance]);

  return (
    <div className="container mb-4">
      <h2 className="dashboard-title text-center my-4">
        <strong>사용자 대시보드</strong>
      </h2>

      {!loading && (
        <>
          <div className="row g-4">
            {/* 🎨 출석/참여 현황 */}
            <div className="col-md-6">
              <div className="card">
                <div
                  className="card-header"
                  style={{ background: "#A7C7E7", color: "#333" }}
                >
                  출석/참여 현황
                </div>
                <div className="card-body">
                  <div style={{ height: "320px" }}>
                    <canvas id="attendanceRatioChart"></canvas>
                  </div>
                </div>
              </div>
            </div>

            {/* 🎨 월별 참여 횟수 */}
            <div className="col-md-6">
              <div className="card">
                <div
                  className="card-header"
                  style={{ background: "#B4E2C8", color: "#333" }}
                >
                  월별 참여 횟수
                </div>
                <div className="card-body">
                  <div style={{ height: "320px" }}>
                    <canvas id="participationCountChart"></canvas>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 🎨 이번주 스케줄 & 목표 달성률 */}
          <div className="row g-4 mt-1">
            <div className="col-lg-8">
              <div className="card">
                <div
                  className="card-header"
                  style={{ background: "#FFE5A8", color: "#333" }}
                >
                  이번 주 내 스케줄
                </div>
                <div className="card-body">
                  <ul className="list-group">
                    {weeklySchedules.length > 0 ? (
                      weeklySchedules.map((s) => (
                        <li
                          key={getId(s)}
                          className="list-group-item d-flex justify-content-between"
                        >
                          <div>
                            <div className="fw-semibold">{s.title}</div>
                            <div className="text-muted small">
                              {String(getStart(s)).slice(0, 10)}
                            </div>
                          </div>
                        </li>
                      ))
                    ) : (
                      <p className="text-muted small">
                        이번 주 일정이 없습니다.
                      </p>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            <div className="col-lg-4">
              <div className="card">
                <div
                  className="card-header"
                  style={{ background: "#B8E3FF", color: "#333" }}
                >
                  학습 목표 달성률
                </div>
                <div className="card-body">
                  <div className="progress mb-2">
                    <div
                      className="progress-bar"
                      style={{
                        width: `${goalPercent}%`,
                        background: "#B4E2C8",
                        color: "#333",
                      }}
                    >
                      {goalPercent.toFixed(0)}%
                    </div>
                  </div>
                  <small className="text-muted">
                    이번 주 {target}개 중 {done}개 완료됨
                  </small>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserBasicDashboard;
