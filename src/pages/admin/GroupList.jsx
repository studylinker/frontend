// src/pages/admin/GroupList.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

import { FaEdit, FaTrash, FaToggleOn, FaToggleOff } from "react-icons/fa";
import { MdGroups } from "react-icons/md";

import GroupDeleteModal from "./GroupDeleteModal";
import GroupStatusChangeModal from "./GroupStatusChangeModal";
import StatsModal from "./StatsModal";

const GroupList = () => {
  const navigate = useNavigate();

  // ⭐ 기본 상태를 Active로 설정
  const [groups, setGroups] = useState([
    {
      groupId: 1,
      title: "자바 스터디",
      category: "Programming",
      leaderId: 101,
      maxMembers: 3,
      max: 5,
      status: "ACTIVE",
    },
    {
      groupId: 2,
      title: "면접 대비 스터디",
      category: "Career",
      leaderId: 102,
      maxMembers: 5,
      max: 5,
      status: "ACTIVE",
    },
  ]);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);

  const [currentGroup, setCurrentGroup] = useState(null);
  const [targetAction, setTargetAction] = useState(null);

  useEffect(() => {
    api
      .get("/study-groups")
      .then((res) => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          // ⭐ 백엔드 ENUM 그대로 사용하도록 변환
          const normalized = res.data.map((g) => ({
            ...g,
            status: (g.status || "ACTIVE").toUpperCase(),
          }));
          setGroups(normalized);
        } else {
          console.warn("API 그룹 목록 없음 → 더미 유지");
        }
      })
      .catch((err) => console.error("그룹 목록 로딩 실패 → 더미 유지:", err));
  }, []);

  const handleDeleteClick = (group) => {
    setCurrentGroup(group);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = (groupId) => {
    api.delete(`/study-groups/${groupId}`).then(() => {
      setGroups(groups.filter((g) => g.groupId !== groupId));
      setIsDeleteModalOpen(false);
    });
  };

  const handleStatusChangeClick = (group, action) => {
    setCurrentGroup(group);
    setTargetAction(action);
    setIsStatusModalOpen(true);
  };

  // ⭐ 백엔드 ENUM에 맞게 전부 대문자로 전송 + 상태 업데이트
  const handleStatusChangeConfirm = (groupId, action) => {
    const newStatus =
      action === "Activate"
        ? "ACTIVE"
        : action === "Deactivate"
        ? "INACTIVE"
        : "PENDING";

    api.patch(`/study-groups/${groupId}`, { status: newStatus }).then(() => {
      setGroups(
        groups.map((g) =>
          g.groupId === groupId ? { ...g, status: newStatus } : g
        )
      );
      setIsStatusModalOpen(false);
    });
  };

  // ⭐ 상태 뱃지(대문자 ENUM 기준)
  const getStatusBadge = (status) => {
    const s = (status || "").toUpperCase();

    if (s === "ACTIVE")
      return <span className="badge bg-success">활성</span>;

    if (s === "INACTIVE")
      return <span className="badge bg-secondary">비활성</span>;

    if (s === "REJECTED")
      return <span className="badge bg-danger">거절됨</span>;

    return <span className="badge bg-warning text-dark">대기중</span>;
  };

  // ⭐ 버튼 활성화 조건 (대문자 ENUM 기준)
  const renderStatusButtons = (g) => {
    const s = (g.status || "").toUpperCase();

    if (s === "PENDING") {
      return (
        <>
          <button
            className="btn btn-outline-success btn-sm me-2"
            onClick={() => handleStatusChangeClick(g, "Activate")}
          >
            <FaToggleOn className="me-1" /> 활성화
          </button>

          <button
            className="btn btn-outline-secondary btn-sm me-2"
            onClick={() => handleStatusChangeClick(g, "Deactivate")}
          >
            <FaToggleOff className="me-1" /> 비활성화
          </button>
        </>
      );
    }

    if (s === "ACTIVE") {
      return (
        <button
          className="btn btn-outline-secondary btn-sm me-2"
          onClick={() => handleStatusChangeClick(g, "Deactivate")}
        >
          <FaToggleOff className="me-1" /> 비활성화
        </button>
      );
    }

    return (
      <button
        className="btn btn-outline-success btn-sm me-2"
        onClick={() => handleStatusChangeClick(g, "Activate")}
      >
        <FaToggleOn className="me-1" /> 활성화
      </button>
    );
  };

  return (
    <div>
      <h2 className="mb-3">
        <MdGroups size={28} className="me-2" />
        스터디 그룹 관리
      </h2>

      <div className="d-flex justify-content-between mb-3">
        <input className="form-control w-25" placeholder="그룹명 검색" />
        <button
          className="btn btn-secondary"
          onClick={() => setIsStatsModalOpen(true)}
        >
          📊 통계 보기
        </button>
      </div>

      <table className="table table-hover align-middle">
        <thead className="table-light">
          <tr>
            <th>ID</th>
            <th>그룹명</th>
            <th>카테고리</th>
            <th>리더ID</th>
            <th>인원</th>
            <th>상태</th>
            <th>관리</th>
          </tr>
        </thead>

        <tbody>
          {groups.map((g) => (
            <tr key={g.groupId}>
              <td>{g.groupId}</td>
              <td>{g.title}</td>
              <td>{g.category}</td>
              <td>{g.leaderId}</td>
              <td>
                {g.maxMembers}/{g.max}
              </td>

              <td>{getStatusBadge(g.status)}</td>

              <td>
                <button
                  className="btn btn-outline-info btn-sm me-2"
                  onClick={() => navigate(`/admin/groups/edit/${g.groupId}`)}
                >
                  <FaEdit className="me-1" /> 수정
                </button>

                {renderStatusButtons(g)}

                <button
                  className="btn btn-outline-danger btn-sm"
                  onClick={() => handleDeleteClick(g)}
                >
                  <FaTrash className="me-1" /> 삭제
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {isDeleteModalOpen && (
        <GroupDeleteModal
          show={isDeleteModalOpen}
          group={currentGroup}
          onConfirm={handleDeleteConfirm}
          onClose={() => setIsDeleteModalOpen(false)}
        />
      )}

      {isStatusModalOpen && (
        <GroupStatusChangeModal
          show={isStatusModalOpen}
          group={currentGroup}
          targetAction={targetAction}
          onConfirm={handleStatusChangeConfirm}
          onClose={() => setIsStatusModalOpen(false)}
        />
      )}

      {isStatsModalOpen && (
        <StatsModal
          show={isStatsModalOpen}
          onClose={() => setIsStatsModalOpen(false)}
        />
      )}
    </div>
  );
};

export default GroupList;
