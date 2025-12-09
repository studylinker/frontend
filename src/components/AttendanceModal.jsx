// src/components/AttendanceModal.jsx

import React, { useEffect, useState } from "react";
import api from "../api/axios";

const AttendanceModal = ({ scheduleId, onClose }) => {
  const [schedule, setSchedule] = useState(null);
  const [members, setMembers] = useState([]);
  const [statusMap, setStatusMap] = useState({}); // userId -> status
  const [loading, setLoading] = useState(true);

  // ============================
  // 초기 로딩
  // 1) 일정 정보 조회 (groupId 얻기)
  // 2) 그룹 멤버 조회
  // 3) 해당 일정 출석 정보 조회
  // ============================
  useEffect(() => {
    if (!scheduleId) return;

    const loadData = async () => {
      setLoading(true);
      try {
        // 1) 일정 단건 조회
        const scheduleRes = await api.get(`/study-schedules/${scheduleId}`);
        const sc = scheduleRes.data;
        setSchedule(sc);

        // 그룹이 없는 개인 일정이면 출석 대상 없음
        if (!sc.groupId) {
          setMembers([]);
          setStatusMap({});
          return;
        }

        // 2) 스터디 멤버 조회
        const membersRes = await api.get(
          `/study-groups/${sc.groupId}/members`
        );
        // APPROVED 멤버만 출석 대상
        const approved = (membersRes.data || []).filter(
          (m) => m.status === "APPROVED"
        );
        setMembers(approved);

        // 3) 기존 출석 기록 조회
        let attendanceMap = {};
        try {
          const attRes = await api.get(
            `/attendance/schedule/${scheduleId}`
          );
          (attRes.data || []).forEach((a) => {
            const userId = a.userId ?? a.user_id;
            if (!userId) return;
            attendanceMap[userId] = a.status; // "PRESENT" / "ABSENT" / "LATE"
          });
        } catch (err) {
          console.error("출석 목록 조회 실패(없을 수 있음):", err);
        }
        setStatusMap(attendanceMap);
      } catch (err) {
        console.error("출석 모달 데이터 로드 실패:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [scheduleId]);

  // ============================
  // 출석 상태 변경
  // POST /api/attendance
  // Body: { scheduleId, userId, status }
  //  - 생성 + 갱신 모두 처리
  // ============================
  const handleChangeStatus = async (userId, status) => {
    // 화면에서 먼저 반영
    setStatusMap((prev) => ({
      ...prev,
      [userId]: status,
    }));

    try {
      await api.post("/attendance", {
        scheduleId,
        userId,
        status,
      });
    } catch (err) {
      console.error("출석 저장 실패:", err);
      // 실패 시 되돌릴지 여부는 선택 사항 (지금은 콘솔만)
    }
  };

  if (!scheduleId) return null;

  return (
    <div
      className="modal d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
    >
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content">
          {/* 헤더 */}
          <div
            className="modal-header"
            style={{
              backgroundColor: "#C8F7DC",   // 파스텔 초록
              color: "#2F6F4E"              // 진한 포인트 초록
            }}
          >
            <h5 className="modal-title">
              📋 출석 관리
              {schedule && <span className="ms-2">({schedule.title})</span>}
            </h5>

            <button
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>
          {/* 바디 */}
          <div className="modal-body">
            {loading && <p>로딩 중...</p>}

            {!loading && (!members || members.length === 0) && (
              <p>출석을 관리할 멤버가 없습니다.</p>
            )}

            {!loading && members && members.length > 0 && (
              <table className="table table-sm align-middle">
                <thead>
                  <tr>
                    <th style={{ width: "10%" }}>번호</th>
                    <th style={{ width: "40%" }}>이름 / 닉네임</th>
                    <th style={{ width: "50%" }}>출석 상태</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m, idx) => {
                    const uid = m.userId ?? m.user_id;
                    const name =
                      m.name || m.username || m.nickname || `user-${uid}`;
                    const currentStatus = statusMap[uid] || "";

                    return (
                      <tr key={uid}>
                        <td>{idx + 1}</td>
                        <td>{name}</td>
                        <td>
                          <select
                            className="form-select form-select-sm"
                            value={currentStatus}
                            onChange={(e) =>
                              handleChangeStatus(uid, e.target.value)
                            }
                          >
                            <option value="">선택 안 함</option>
                            <option value="PRESENT">출석</option>
                            <option value="ABSENT">결석</option>
                            <option value="LATE">지각</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="modal-footer">
            <button
            className="btn btn-sm"
            style={{
              backgroundColor: "#C8F7DC",
              color: "#2F6F4E",
              border: "1px solid #A8E6C4",
              fontWeight: "600"
            }}
            onClick={async () => {
              try {
                const entries = Object.entries(statusMap);

                for (const [userId, status] of entries) {
                  if (!status) continue;
                  await api.post("/attendance", { scheduleId, userId, status });
                }

                alert("출석 정보가 저장되었습니다!");
                onClose();
              } catch (err) {
                console.error("출석 저장 실패:", err);
                alert("출석 저장 중 오류가 발생했습니다.");
              }
            }}
          >
            출석 저장
          </button>

          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceModal;
