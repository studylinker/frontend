// src/pages/main/BoardWrite.jsx
import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../../auth/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";

const BoardWrite = ({ defaultType }) => {
  const navigate = useNavigate();
  const { postId } = useParams();
  const isEdit = Boolean(postId);

  const { user } = useContext(AuthContext);
  const userId = user?.userId;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  // ⭐ STUDY 방지: defaultType이 STUDY면 FREE로 강제
  const safeDefaultType =
    defaultType === "REVIEW" ? "REVIEW" : "FREE";

  const [type, setType] = useState(safeDefaultType);

  const [rating, setRating] = useState(0);
  const [joinedGroups, setJoinedGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");

  // ============================
  // 기존 게시글 불러오기 (수정 모드)
  // ============================
  useEffect(() => {
    if (!isEdit) return;

    const load = async () => {
      try {
        const res = await api.get(`/study-posts/${postId}`);
        const p = res.data;

        setTitle(p.title);
        setContent(p.content);

        // ⭐ STUDY 방지: 기존 글이 STUDY면 FREE로 치환
        if (p.type === "REVIEW") {
          setType("REVIEW");
        } else {
          setType("FREE");
        }

        if (p.type === "REVIEW") {
          setSelectedGroupId(p.groupId || "");
          setRating(5);
        }
      } catch (err) {
        console.error("게시글 불러오기 실패:", err);
      }
    };

    load();
  }, [isEdit, postId]);

  // ============================
  // 리뷰 작성: 가입한 스터디 불러오기
  // ============================
  useEffect(() => {
    if (type !== "REVIEW" || !userId) return;

    const loadGroups = async () => {
      try {
        const groupsRes = await api.get("/study-groups");
        const groups = groupsRes.data || [];

        const myGroups = [];

        for (const g of groups) {
          try {
            const memRes = await api.get(
              `/study-groups/${g.groupId}/members/${userId}`
            );
            if (memRes.data?.status === "APPROVED") {
              myGroups.push(g);
            }
          } catch {}
        }

        setJoinedGroups(myGroups);
      } catch (err) {
        console.error("스터디 목록 불러오기 실패:", err);
      }
    };

    loadGroups();
  }, [type, userId]);

  // ============================
  // 저장 (작성 + 수정)
  // ============================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      alert("제목과 내용을 입력하세요.");
      return;
    }

    if (type === "REVIEW" && !selectedGroupId) {
      alert("후기 대상 스터디를 선택하세요.");
      return;
    }

    // ⭐ STUDY 방지: 전송 직전 한 번 더 안전장치
    const safeType = type === "REVIEW" ? "REVIEW" : "FREE";

    try {
      // -------- 수정 모드 --------
      if (isEdit) {
        await api.patch(`/study-posts/${postId}`, {
          title,
          content,
          type: safeType, // ⭐ STUDY 방지
          groupId: safeType === "REVIEW" ? Number(selectedGroupId) : null,
        });

        alert("게시글 수정 완료!");
        navigate(`/main/board/detail/${postId}`);
        return;
      }

      // -------- 작성 모드 --------
      const postBody = {
        title,
        content,
        type: safeType, // ⭐ STUDY 방지
        leaderId: userId,
        groupId: safeType === "REVIEW" ? Number(selectedGroupId) : null,
        maxMembers: 0,
        studyDate: null,
        location: null,
        latitude: null,
        longitude: null,
      };

      const postRes = await api.post("/study-posts", postBody);
      const newId = postRes.data?.postId;

      if (!newId) {
        alert("게시글 생성 실패");
        return;
      }

      if (safeType === "REVIEW" && !rating) {
        alert("평점을 선택해야 합니다!");
        return;
      }

      if (safeType === "REVIEW") {
        await api.post(`/study-posts/${newId}/reviews`, {
          rating,
          content,
        });
      }

      alert("게시글 등록 완료!");
      navigate(`/main/board/detail/${newId}`);
    } catch (err) {
      console.error("저장 실패:", err);
      alert("오류 발생");
    }
  };

  return (
    <div className="container mt-3">
      <h3>{isEdit ? "게시글 수정" : "게시글 작성"}</h3>

      <form onSubmit={handleSubmit}>
        <input
          className="form-control mb-3"
          placeholder="제목"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          className="form-control mb-3"
          rows="6"
          placeholder="내용"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        <select
          className="form-select mb-3"
          value={type}
          onChange={(e) => setType(e.target.value)}
          disabled={isEdit}
        >
          <option value="FREE">자유게시판</option>
          <option value="REVIEW">스터디 리뷰</option>
        </select>

        {type === "REVIEW" && (
          <>
            <label className="form-label">평점</label>
            <div className="mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  style={{
                    cursor: "pointer",
                    fontSize: "24px",
                    color: star <= rating ? "#ffc107" : "#e4e5e9",
                  }}
                  onClick={() => setRating(star)}
                >
                  ★
                </span>
              ))}
            </div>

            <label className="form-label">후기 대상 스터디</label>
            <select
              className="form-select mb-3"
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              required
            >
              <option value="">스터디 선택</option>
              {joinedGroups.map((g) => (
                <option key={g.groupId} value={g.groupId}>
                  {g.title}
                </option>
              ))}
            </select>
          </>
        )}

        <button
          className="btn"
          style={{
            backgroundColor: "#a78bfa",
            color: "white",
            fontWeight: "bold",
          }}
        >
          저장
        </button>
        <button
          className="btn btn-secondary ms-2"
          onClick={() => navigate("/main/board")}
        >
          취소
        </button>
      </form>
    </div>
  );
};

export default BoardWrite;
