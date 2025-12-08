// src/components/StudyGroupDetailModal.jsx

import React, { useEffect, useState } from "react";
import api from "../api/axios";

// ⭐ React Icons 추가
import { FaThumbtack, FaInbox, FaUsers, FaCalendarAlt } from "react-icons/fa";

const StudyGroupDetailModal = ({ group, onClose, userId }) => {
  const [leaderId, setLeaderId] = useState(null);
  const [leaderName, setLeaderName] = useState("");
  const [members, setMembers] = useState([]);          
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  const isLeader = userId === leaderId;

  useEffect(() => {
    const load = async () => {
      try {
        const leaderRes = await api.get(`/study-groups/${group.group_id}/leader`);
        setLeaderId(leaderRes.data.userId);
        setLeaderName(leaderRes.data.name);

        const memRes = await api.get(`/study-groups/${group.group_id}/members`);
        let memList = memRes.data;

        memList = await Promise.all(
          memList.map(async (m) => {
            try {
              const mannerRes = await api.get(`/manners/${m.userId}`);
              return {
                ...m,
                mannerScore: mannerRes.data?.currentMannerScore ?? 0,
              };
            } catch {
              return { ...m, mannerScore: 0 };
            }
          })
        );

        setMembers(memList);

        const schRes = await api.get(`/study-groups/${group.group_id}/schedules`);
        setSchedules(schRes.data);
      } catch (err) {
        console.error("그룹 상세 정보 로드 실패", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [group.group_id]);

  const handleApprove = async (uid) => {
    try {
      await api.post(`/study-groups/${group.group_id}/members/${uid}/approve`);
      alert("승인 완료!");
      reloadMembers();
    } catch (err) {
      console.error(err);
      alert("승인 실패");
    }
  };

  const handleReject = async (uid) => {
    try {
      await api.post(`/study-groups/${group.group_id}/members/${uid}/reject`);
      alert("거절 완료!");
      reloadMembers();
    } catch (err) {
      console.error(err);
      alert("거절 실패");
    }
  };

  const handleKick = async (memberId) => {
    if (!window.confirm("정말 이 멤버를 강퇴하시겠습니까?")) return;

    try {
      await api.delete(`/group-members/${memberId}`);
      alert("강퇴 완료!");
      reloadMembers();
    } catch (err) {
      console.error(err);
      alert("강퇴 실패");
    }
  };

  const reloadMembers = async () => {
    const memRes = await api.get(`/study-groups/${group.group_id}/members`);
    setMembers(memRes.data);
  };

  if (loading) return null;

  return (
    <div className="modal d-block" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">

          <div className="modal-header">
            <h5 className="modal-title">
              <FaThumbtack className="me-2 text-primary" />
              {group.title} 상세 정보
            </h5>
            <button className="btn-close" onClick={onClose}></button>
          </div>

          <div className="modal-body">
            <h5><FaThumbtack className="me-2 text-primary" />그룹 정보</h5>
            <p><strong>제목:</strong> {group.title}</p>
            <p><strong>설명:</strong> {group.description}</p>
            <p><strong>리더:</strong> {leaderName}</p>

            <hr />

            {isLeader && (
              <>
                {/* 가입 요청 멤버 */}
                <h5><FaInbox className="me-2 text-warning" />가입 요청 멤버</h5>
                {members.filter(m => m.status === "PENDING").length === 0 ? (
                  <p>가입 요청이 없습니다.</p>
                ) : (
                  <ul className="list-group mb-3">
                    {members.filter(m => m.status === "PENDING").map((m) => (
                      <li key={m.memberId} className="list-group-item d-flex justify-content-between">
                        <span>
                          {m.name}
                          <span className="badge bg-warning text-dark ms-2">
                            매너 {m.mannerScore}점
                          </span>
                        </span>
                        <div>

                          {/* ✔ 승인 버튼 - 파스텔톤 */}
                          <button
                            className="btn btn-sm me-2"
                            style={{ backgroundColor: "#A3E4D7", color: "#000" }}
                            onClick={() => handleApprove(m.userId)}
                          >
                            승인
                          </button>

                          {/* ✔ 거절 버튼 - 파스텔 핑크 */}
                          <button
                            className="btn btn-sm"
                            style={{ backgroundColor: "#F5B7B1", color: "#000" }}
                            onClick={() => handleReject(m.userId)}
                          >
                            거절
                          </button>

                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                <hr />

                {/* 현재 멤버 */}
                <h5><FaUsers className="me-2 text-info" />현재 멤버</h5>
                {members.filter(m => m.status === "APPROVED").length === 0 ? (
                  <p>현재 가입된 멤버가 없습니다.</p>
                ) : (
                  <ul className="list-group mb-3">
                    {members.filter(m => m.status === "APPROVED").map((m) => (
                      <li key={m.memberId} className="list-group-item d-flex justify-content-between">
                      <div>
                        <span>{m.name}</span>
                        <span style={{ marginLeft: "10px", color: "#888" }}>
                          ({m.mannerScore ?? 0}점)
                        </span>
                      </div>

                      {m.userId !== leaderId && (
                        <button
                          className="btn btn-sm"
                          style={{ backgroundColor: "#F5B7B1", color: "#000" }}
                          onClick={() => handleKick(m.memberId)}
                        >
                          강퇴
                        </button>
                      )}
                    </li>
                    ))}
                  </ul>
                )}

                <hr />

                {/* 일정 목록 */}
                <h5><FaCalendarAlt className="me-2 text-success" />일정 목록</h5>
                {schedules.length === 0 ? (
                  <p>등록된 일정이 없습니다.</p>
                ) : (
                  <ul className="list-group">
                    {schedules.map((s) => (
                      <li key={s.scheduleId} className="list-group-item">
                        <strong>{s.title}</strong> — {s.startTime.slice(0, 16)}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>

          <div className="modal-footer">
            <button className="btn btn-secondary btn-sm" onClick={onClose}>
              닫기
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default StudyGroupDetailModal;
