import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";

const PostEditPage = () => {
  const { id } = useParams();    
  const navigate = useNavigate();
  const [post, setPost] = useState(null);

  // ------------------------------
  // ⭐ 더미 데이터 (백엔드 불가 시 테스트용)
  // ------------------------------
  const dummyPost = {
    postId: Number(id),
    title: "더미 게시글 제목입니다.",
    leaderId: 101,
    type: "FREE",
    content: "이것은 더미 데이터 내용입니다. 백엔드 연결 전 테스트용입니다."
  };

  // -----------------------------------
  // ✅ 게시글 상세 조회(GET)
  // -----------------------------------
  useEffect(() => {
    api.get(`/study-posts/${id}`)
      .then(res => {
        console.log("API 데이터 로딩 성공:", res.data);
        setPost(res.data);
      })
      .catch(err => {
        console.error("게시글 불러오기 실패 → 더미 데이터:", err);
        setPost(dummyPost);
      });
  }, [id]);

  // -----------------------------------
  // 📝 게시글 수정(PATCH)
  // -----------------------------------
  const handleSave = () => {
    api.patch(`/study-posts/${id}`, {
      title: post.title,
      content: post.content,
      type: post.type
    })
      .then(() => {
        alert(`게시글 "${post.title}" 수정 완료`);
        navigate("/admin/board");
      })
      .catch(err => {
        console.error("게시글 수정 실패:", err);
        alert("⚠ 서버 연결 실패 — 더미 데이터 상태에서는 실제 수정 불가합니다.");
      });
  };

  if (!post) return <p>게시글을 불러오는 중...</p>;

  return (
    <div className="container mt-4 text-start">
      <h2 className="mb-4">📝 게시글 수정 (ID: {id})</h2>

      {/* 제목 */}
      <div className="mb-3 text-start">
        <label className="form-label fw-semibold">제목</label>
        <input
          type="text"
          className="form-control"
          value={post.title}
          onChange={(e) => setPost({ ...post, title: e.target.value })}
        />
      </div>

      {/* 작성자 leaderId */}
      <div className="mb-3 text-start">
        <label className="form-label fw-semibold">작성자 (leaderId)</label>
        <input
          type="text"
          className="form-control"
          value={post.leaderId}
          disabled
        />
      </div>

      {/* 게시글 유형 */}
      <div className="mb-3 text-start">
        <label className="form-label fw-semibold">게시글 유형</label>
        <select
          className="form-select"
          value={post.type || ""}
          onChange={(e) => setPost({ ...post, type: e.target.value })}
        >
          <option value="FREE">자유글</option>
          <option value="REVIEW">스터디 후기</option>
          <option value="NOTICE">📌 공지사항</option>
        </select>
      </div>

      {/* 내용 */}
      <div className="mb-4 text-start">
        <label className="form-label fw-semibold">내용</label>
        <textarea
          className="form-control"
          rows="8"
          value={post.content}
          onChange={(e) => setPost({ ...post, content: e.target.value })}
        />
      </div>

      {/* 버튼 */}
      <div className="d-flex justify-content-end mt-4">
        <button
          className="btn btn-secondary me-2"
          onClick={() => navigate("/admin/board")}
        >
          취소
        </button>

        <button className="btn btn-primary" onClick={handleSave}>
          저장
        </button>
      </div>
    </div>
  );
};

export default PostEditPage;
