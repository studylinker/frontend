// src/pages/main/BoardDetail.jsx

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";

const BoardDetail = () => {
  const { postId } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [groupInfo, setGroupInfo] = useState(null);

  const [ratingInfo, setRatingInfo] = useState(null);

  // 로그인 사용자 불러오기
  useEffect(() => {
    api.get("/users/profile")
      .then((res) => setUserId(res.data.userId))
      .catch(() => {});
  }, []);

  // 게시글 / 댓글 / 스터디정보 / 평점 불러오기
  useEffect(() => {
    const load = async () => {
      try {
        // 게시글 정보
        const res = await api.get(`/study-posts/${postId}`);
        const data = res.data;
        setPost(data);

        const gid = data.groupId ?? data.group_id;

        // REVIEW 글일 경우: 스터디명 가져오기
        if (data.type === "REVIEW" && gid) {
          const gRes = await api.get(`/study-groups/${gid}`);
          setGroupInfo(gRes.data);
        }

        // ⭐ REVIEW 글일 경우: 평점 가져오기
        if (data.type === "REVIEW") {
          try {
            const rRes = await api.get(`/study-posts/${postId}/reviews`);
            const reviews = Array.isArray(rRes.data) ? rRes.data : [];

            if (reviews.length > 0) {
              const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
              const avg = sum / reviews.length;

              setRatingInfo({
                avg: avg.toFixed(1),
                count: reviews.length,
              });
            } else {
              setRatingInfo({ avg: null, count: 0 });
            }
          } catch (e) {
            console.error("평점 불러오기 실패:", e);
          }
        }

        // 댓글 목록
        const cRes = await api.get(`/study-posts/${postId}/comments`);
        setComments(cRes.data);
      } catch (err) {
        console.error("❌ 로드 실패:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [postId]);

  if (loading || !post) return <p>로딩 중...</p>;

  // 게시글 삭제
  const deletePost = async () => {
    if (!window.confirm("삭제하시겠습니까?")) return;
    try {
      await api.delete(`/study-posts/${postId}`);
      alert("삭제 완료");
      navigate("/main/board");
    } catch {
      alert("삭제 실패");
    }
  };

  // 댓글 작성
  const writeComment = async () => {
    if (!newComment.trim()) return;

    try {
      await api.post(`/study-posts/${postId}/comments`, {
        content: newComment,
      });

      const res = await api.get(`/study-posts/${postId}/comments`);
      setComments(res.data);
      setNewComment("");
    } catch {
      console.error("댓글 실패");
    }
  };

  // 댓글 삭제
  const deleteCommentFn = async (cid) => {
    if (!window.confirm("댓글을 삭제하시겠습니까?")) return;

    try {
      await api.delete(`/study-posts/${postId}/comments/${cid}`);
      setComments((prev) => prev.filter((c) => c.commentId !== cid));
    } catch {}
  };

  return (
    <div className="container mt-4" style={{ textAlign: "left" }}>
      <button className="btn btn-secondary mb-3" onClick={() => navigate("/main/board")}>
        ← 뒤로가기
      </button>

      {/* 게시글 영역 */}
      <div className="card mb-4">
        <div className="card-header">
          <h4 style={{ marginBottom: 0 }}>{post.title}</h4>
          <span className="badge bg-primary">{post.type}</span>
        </div>

        <div className="card-body">
          <p style={{ whiteSpace: "pre-wrap" }}>{post.content}</p>

          <p>
            작성자:{" "}
            {post.type === "NOTICE"
              ? "관리자" // ⭐ 공지글은 관리자
              : post.leaderName || "익명"}
          </p>

          {/* REVIEW 글일 때 스터디명 표시 */}
          {post.type === "REVIEW" && groupInfo && (
            <p className="text-muted">
              스터디명: <strong>{groupInfo.title}</strong>
            </p>
          )}

          {/* ⭐ REVIEW 글일 때 평점 표시 UI 추가 */}
          {post.type === "REVIEW" && ratingInfo && (
            <div
              className="p-3 mt-2"
              style={{
                background: "#f8f1ff",
                borderRadius: "8px",
                border: "1px solid #e2ccff",
                display: "inline-block",
              }}
            >
              <strong style={{ fontSize: "1.1rem" }}>⭐ 평점</strong>
              <div style={{ fontSize: "1rem", marginTop: "4px" }}>
                {ratingInfo.count > 0 ? (
                  <>
                    <span style={{ fontWeight: "bold", color: "#7540ee" }}>
                      {ratingInfo.avg}점
                    </span>{" "}
                    <small className="text-muted">
                      ({ratingInfo.count}개의 리뷰)
                    </small>
                  </>
                ) : (
                  <span className="text-muted">아직 리뷰가 없습니다.</span>
                )}
              </div>
            </div>
          )}

          {/* 수정/삭제 버튼: 작성자만 */}
          {post.leaderId === userId && (
            <div className="mt-3">
              <button
                className="btn me-2"
                style={{ backgroundColor: "#A3E4D7", color: "#000", fontWeight: "500" }}
                onClick={() => navigate(`/main/board/edit/${postId}`)}
              >
                수정
              </button>

              <button
                className="btn"
                style={{ backgroundColor: "#F5B7B1", color: "#000", fontWeight: "500" }}
                onClick={deletePost}
              >
                삭제
              </button>
            </div>
          )}
          
          {/* 신고 버튼 */}
          <div className="mt-2">
            {post.type !== "NOTICE" && (
              <button
                className="btn"
                style={{
                  backgroundColor: "#f8d7da",
                  color: "#721c24",
                  fontWeight: "500",
                  marginLeft: "8px",
                }}
                onClick={async () => {
                  const reason = prompt("신고 사유를 입력하세요:");
                  if (!reason) return;

                  try {
                    await api.patch(`/study-posts/${postId}`, {
                      reported: true,
                      reportReason: reason,
                    });
                    alert("신고 완료");
                  } catch (err) {
                    console.error("신고 실패:", err);
                    alert("신고 실패");
                  }
                }}
              >
                🚨 신고
              </button>
              )}
            </div>
        </div>
      </div>

      {/* 댓글 영역 */}
      <div className="mb-5">
        <h5>댓글</h5>

        {comments.map((c) => (
          <div key={c.commentId} className="card p-3 mb-2">
            <p style={{ marginBottom: 6 }}>{c.content}</p>

            <small className="text-muted">
              {c.userName || "사용자"} • {(c.createdAt || "").replace("T", " ")}
            </small>

            {c.userId === userId && (
              <button
                onClick={() => deleteCommentFn(c.commentId)}
                className="btn btn-sm mt-2"
                style={{
                  backgroundColor: "#F5B7B1",
                  color: "#000",
                  borderRadius: "8px",
                  padding: "2px 8px",
                  fontSize: "12px",
                  width: "fit-content",
                }}
              >
                ❌ 삭제
              </button>
            )}
          </div>
        ))}

        {/* 댓글 입력 */}
        <textarea
          className="form-control mt-3"
          rows={2}
          placeholder="댓글 작성..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
        />

        {/* 댓글 작성 버튼 */}
        <button
          className="btn mt-2"
          style={{ backgroundColor: "#a78bfa", color: "white", fontWeight: "bold" }}
          onClick={writeComment}
        >
          댓글 작성
        </button>
      </div>
    </div>
  );
};

export default BoardDetail;
