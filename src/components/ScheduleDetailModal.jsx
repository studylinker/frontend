// src/components/ScheduleDetailModal.jsx
import React, { useEffect, useState } from "react";
import api from "../api/axios";

const ScheduleDetailModal = ({ scheduleId, onClose, userId, onOpenAttendance }) => {
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [groupInfo, setGroupInfo] = useState(null);

  const get = (obj, ...keys) => {
    for (const k of keys) {
      if (obj[k] !== undefined && obj[k] !== null) return obj[k];
    }
    return null;
  };

  // 일정 상세 조회
  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/study-schedules/${scheduleId}`);
        const sc = res.data;
        setSchedule(sc);

        const gid = sc.groupId ?? sc.group_id ?? null;

        // 스터디 일정이면 그룹 정보 조회
        if (gid) {
          try {
            const gRes = await api.get(`/study-groups/${gid}`);
            setGroupInfo(gRes.data);
          } catch (err) {
            console.error("그룹 정보 조회 실패:", err);
          }

          // 리더 정보 별도 조회
          try {
            const leaderRes = await api.get(`/study-groups/${gid}/leader`);
            setGroupInfo((prev) => ({
              ...prev,
              leaderId: leaderRes.data.userId,
              leaderName: leaderRes.data.name,
            }));
          } catch (err) {
            console.error("리더 정보 조회 실패:", err);
          }
        }

      } catch (err) {
        console.error("상세조회 실패:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [scheduleId]);

  if (loading || !schedule) return null;

  // camelCase / snakeCase 대응
  const gid = groupInfo?.groupId ?? groupInfo?.group_id ?? null;
  const leaderId = groupInfo?.leaderId ?? null;
  const leaderName = groupInfo?.leaderName ?? "정보 없음";

  const isStudySchedule = gid !== null;
  const isLeader = leaderId === userId;

  // 삭제
  const handleDelete = async () => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;

    try {
      await api.delete(`/study-schedules/${scheduleId}`);
      alert("일정 삭제 완료");
      onClose("deleted");
    } catch (err) {
      console.error("삭제 오류:", err);
      alert("삭제 실패");
    }
  };

  const handleUpdate = () => {
    onClose("update", schedule);
  };

  return (
    <div className="modal d-block" style={{ background: "rgba(0,0,0,0.35)" }}>
      <div className="modal-dialog">
        <div className="modal-content">

          <div className="modal-header">
            <h5 className="modal-title">일정 상세 정보</h5>
            <button className="btn-close" onClick={() => onClose()}></button>
          </div>

          <div className="modal-body">
            <h5>{schedule.title}</h5>

            <p>
              <strong>날짜:</strong>{" "}
              {get(schedule, "startTime", "start_time")?.slice(0, 10)}
            </p>

            {(schedule.group_id ?? schedule.groupId) &&
              (schedule.start_time || schedule.startTime) && (
                <p className="text-muted">
                  <strong>시간:</strong>{" "}
                  {(schedule.start_time ?? schedule.startTime).slice(11, 16)}
                  {(schedule.end_time ?? schedule.endTime)
                    ? ` ~ ${(schedule.end_time ?? schedule.endTime).slice(11, 16)}`
                    : ""}
                </p>
              )}

            {schedule.location && (
              <p><strong>장소:</strong> {schedule.location}</p>
            )}

            {isStudySchedule ? (
              <>
                <p className="mt-2"><strong>📚 스터디 일정</strong></p>
                <p><strong>스터디:</strong> {groupInfo?.title || "이름 없음"}</p>
                <p><strong>리더:</strong> {leaderName}</p>
              </>
            ) : (
              <p><strong>👤 개인 일정</strong></p>
            )}
          </div>

          <div className="modal-footer d-flex justify-content-between">
            {isStudySchedule && isLeader && (
              <>
                {/* 출석 체크 → 파스텔 초록 */}
                <button
                  className="btn"
                  style={{
                    backgroundColor: "#C8F7C5", // 파스텔 그린
                    color: "#1B7F4C",
                    border: "1px solid #A8E6A3",
                    fontWeight: "600"
                  }}
                  onClick={() => onOpenAttendance && onOpenAttendance(scheduleId)}
                >
                  출석 체크
                </button>

                {/* 수정 → 파스텔 블루 */}
                <button
                  className="btn"
                  style={{
                    backgroundColor: "#D6E8FF", // 파스텔 블루
                    color: "#1A4FA3",
                    border: "1px solid #B6D4FF",
                    fontWeight: "600"
                  }}
                  onClick={handleUpdate}
                >
                  수정
                </button>

                {/* 삭제 → 파스텔 레드 */}
                <button
                  className="btn"
                  style={{
                    backgroundColor: "#FFD6D6", // 파스텔 레드
                    color: "#B00020",
                    border: "1px solid #FFB3B3",
                    fontWeight: "600"
                  }}
                  onClick={handleDelete}
                >
                  삭제
                </button>
              </>
            )}

            {isStudySchedule && !isLeader && (
              <p className="text-muted">리더만 관리할 수 있는 일정입니다.</p>
            )}

            {!isStudySchedule && (
              <>
                {/* 개인 일정 수정 / 삭제도 동일 파스텔 버튼 사용 */}
                <button
                  className="btn"
                  style={{
                    backgroundColor: "#D6E8FF",
                    color: "#1A4FA3",
                    border: "1px solid #B6D4FF",
                    fontWeight: "600"
                  }}
                  onClick={handleUpdate}
                >
                  수정
                </button>

                <button
                  className="btn"
                  style={{
                    backgroundColor: "#FFD6D6",
                    color: "#B00020",
                    border: "1px solid #FFB3B3",
                    fontWeight: "600"
                  }}
                  onClick={handleDelete}
                >
                  삭제
                </button>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default ScheduleDetailModal;
