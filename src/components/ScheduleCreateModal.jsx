// src/components/ScheduleCreateModal.jsx
import React, { useState, useEffect } from "react";
import api from "../api/axios";

const ScheduleCreateModal = ({
  mode,               // "study" | "personal" | "update"
  groupId = null,
  leaderGroups = [],   
  baseDate = null,    // YYYY-MM-DD
  scheduleData = null,
  onClose,
  onSuccess,
}) => {

  const isUpdate = mode === "update";

  const isStudyMode =
    mode === "study" || (isUpdate && (scheduleData?.group_id || scheduleData?.groupId));

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");

  const [date, setDate] = useState(baseDate || "");
  const [time, setTime] = useState("");
  const [endTime, setEndTime] = useState("");

  
  const [selectedGroupId, setSelectedGroupId] = useState(groupId);

  // -------------------------------
  // 수정 모드일 때 기존 일정 값 세팅 
  // -------------------------------
  useEffect(() => {
    if (isUpdate && scheduleData) {
      const start =
        scheduleData.start_time ??
        scheduleData.startTime ??
        null;

      const end =
        scheduleData.end_time ??
        scheduleData.endTime ??
        null;

      setTitle(scheduleData.title || "");
      setDescription(scheduleData.description || "");
      setLocation(scheduleData.location || "");

      setDate(start ? start.slice(0, 10) : "");
      setTime(start ? start.slice(11, 16) : "");
      setEndTime(end ? end.slice(11, 16) : "");
    }
  }, [isUpdate, scheduleData]);

  // -------------------------------
  // 저장(등록·수정)
  // -------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !date) {
      alert("제목과 날짜를 입력하세요.");
      return;
    }

    const startFinal = time || "00:00";
    const endFinal = endTime || startFinal;

    const startTime = `${date}T${startFinal}`;
    const endTimeValue = `${date}T${endFinal}`;

    const body = {
      title,
      description,
      location,
      startTime,
      endTime:endTimeValue,
    };

    try {
      // -------------------------------
      // UPDATE 모드
      // -------------------------------
      if (isUpdate) {
        const id =
          scheduleData.schedule_id ??
          scheduleData.scheduleId ??
          scheduleData.id;

        if (!id) {
          console.error("❌ 일정 수정 실패: schedule ID 없음 → scheduleData:", scheduleData);
          alert("수정할 일정 ID를 찾을 수 없습니다.");
          return;
        }

        await api.put(`/study-schedules/${id}`, body);
        alert("일정 수정 완료");
      }

      // -------------------------------
      // CREATE — 스터디 일정
      // -------------------------------
      else if (isStudyMode) {
        if (!selectedGroupId) {
          alert("어떤 스터디의 일정인지 선택하세요.");
          return;
        }

        await api.post(`/study-groups/${selectedGroupId}/schedules`, body);
        alert("스터디 일정 등록 완료");
      }

      // -------------------------------
      // CREATE — 개인 일정
      // -------------------------------
      else {
        await api.post(`/study-schedules`, body);
        alert("개인 일정 등록 완료");
      }

      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("일정 저장 실패:", err);
      alert("일정 저장 실패");
    }
  };

  return (
    <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
  <div className="modal-dialog">
    <form className="modal-content" onSubmit={handleSubmit}>

      {/* 🔵 파스텔 파랑 헤더 */}
      <div
        className="modal-header"
        style={{
          backgroundColor: "#cfe8ff",
          color: "#0d6efd",
          borderBottom: "1px solid #b6d8ff",
        }}
      >
        <h5 className="modal-title">
          {isUpdate
            ? "일정 수정"
            : isStudyMode
            ? "새 스터디 일정 등록"
            : "새 일정 등록"}
        </h5>
        <button className="btn-close" onClick={onClose}></button>
      </div>

      <div className="modal-body">
        <input
          className="form-control mb-2"
          value={title}
          placeholder="제목"
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <input
          type="date"
          className="form-control mb-2"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />

        {isStudyMode && (
          <>
            <label className="form-label">어떤 스터디의 일정인가요?</label>
            <select
              className="form-select mb-2"
              value={selectedGroupId || ""}
              onChange={(e) => setSelectedGroupId(Number(e.target.value))}
              required
            >
              <option value="">스터디 선택</option>
              {leaderGroups.map((g) => (
                <option key={g.groupId} value={g.groupId}>
                  {g.title}
                </option>
              ))}
            </select>
            {/* 시작 시간 */}
            <input
              type="time"
              className="form-control mb-2"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
            {/* 종료 시간 */}
            <input
              type="time"
              className="form-control mb-2"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </>
        )}

        <input
          className="form-control mb-2"
          value={location}
          placeholder="장소"
          onChange={(e) => setLocation(e.target.value)}
        />

        <textarea
          className="form-control mb-2"
          rows={3}
          value={description}
          placeholder="설명"
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {/* 🔽 버튼 영역 */}
      <div className="modal-footer">

        {/* 취소 버튼 (기존 회색 유지) */}
        <button className="btn btn-secondary btn-sm" onClick={onClose}>
          취소
        </button>

        {/* 🟢 파스텔 초록 등록 버튼 */}
        <button
          className="btn btn-sm"
          type="submit"
          style={{
            backgroundColor: "#d5f5e3",
            color: "#157347",
            border: "1px solid #b3e6c9",
            fontWeight: 600,
          }}
        >
          {isUpdate ? "수정 완료" : "등록"}
        </button>
      </div>

    </form>
  </div>
</div>

  );
};

export default ScheduleCreateModal;
