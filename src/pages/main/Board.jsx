// src/pages/main/Board.jsx
import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { AuthContext } from "../../auth/AuthContext";

const Board = () => {
  const [tab, setTab] = useState("FREE"); // FREE | REVIEW
  const [posts, setPosts] = useState([]);
  const [allPosts, setAllPosts] = useState([]);
  const [keyword, setKeyword] = useState("");

  // ⭐ 수정: 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const POSTS_PER_PAGE = 10;

  const { user } = useContext(AuthContext);
  const [groupTitles, setGroupTitles] = useState({});

  const navigate = useNavigate();

  // =============================
  // 게시글 전체 조회
  // =============================
  const fetchPosts = async (targetTab = tab) => {
    try {
      const res = await api.get("/study-posts");
      const list = Array.isArray(res.data) ? res.data : [];

      // 최신순 정렬
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setAllPosts(list);

      // ⭐ 수정: 탭별 필터링
      const filtered = list.filter((p) => p.type === targetTab);
      setPosts(filtered);

      if (targetTab === "REVIEW") {
        fetchGroupTitles(list);
      }
    } catch (err) {
      console.error("게시글 조회 실패:", err);
    }
  };

  // =============================
  // 최초 렌더링
  // =============================
  useEffect(() => {
    if (user) fetchPosts("FREE");
  }, [user]);

  // =============================
  // 탭 변경 시
  // =============================
  useEffect(() => {
    if (user) {
      fetchPosts(tab);
      setCurrentPage(1); // ⭐ 수정: 탭 변경 시 1페이지로
    }
  }, [tab, user]);

  // =============================
  // REVIEW → 스터디명 조회
  // =============================
  const fetchGroupTitles = async (list) => {
    try {
      const reviewPosts = list.filter(
        (p) => p.type === "REVIEW" && p.groupId
      );

      const titles = {};
      await Promise.all(
        reviewPosts.map(async (p) => {
          try {
            const res = await api.get(`/study-groups/${p.groupId}`);
            titles[p.groupId] = res.data.title;
          } catch (err) {
            console.error("스터디명 조회 실패:", err);
          }
        })
      );

      setGroupTitles(titles);
    } catch (err) {
      console.error("스터디명 처리 실패:", err);
    }
  };

  // =============================
  // 검색
  // =============================
  const handleSearch = () => {
    if (keyword.length < 2) {
      alert("검색어는 2자 이상 입력하세요.");
      return;
    }

    const lower = keyword.toLowerCase();
    const filtered = allPosts.filter(
      (p) =>
        p.type === tab &&
        ((p.title || "").toLowerCase().includes(lower) ||
          (p.content || "").toLowerCase().includes(lower) ||
          (p.leaderName || "").toLowerCase().includes(lower))
    );

    setPosts(filtered);
    setCurrentPage(1); // ⭐ 수정: 검색 시 1페이지로
  };

  // =============================
  // ⭐ 수정: 현재 페이지 게시글 계산
  // =============================
  const indexOfLastPost = currentPage * POSTS_PER_PAGE;
  const indexOfFirstPost = indexOfLastPost - POSTS_PER_PAGE;
  const currentPosts = posts.slice(indexOfFirstPost, indexOfLastPost);

  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE);

  return (
    <div>
      <h2><strong>게시판</strong></h2>
      <br />

      {/* 탭 버튼 */}
      <div className="btn-group mb-3">
        <button
          className="btn"
          style={{
            backgroundColor: tab === "FREE" ? "#a78bfa" : "white",
            color: tab === "FREE" ? "white" : "#a78bfa",
            border: "1px solid #a78bfa"
          }}
          onClick={() => setTab("FREE")}
        >
          자유게시판
        </button>

        <button
          className="btn"
          style={{
            backgroundColor: tab === "REVIEW" ? "#a78bfa" : "white",
            color: tab === "REVIEW" ? "white" : "#a78bfa",
            border: "1px solid #a78bfa"
          }}
          onClick={() => setTab("REVIEW")}
        >
          스터디 리뷰
        </button>
      </div>

      {/* 글쓰기 */}
      <div className="mb-3 text-end">
        <button
          className="learn-more"
          onClick={() => navigate("/main/board/write")}
        >
          ➕ 글 쓰기
        </button>
      </div>

      {/* 검색 */}
      <div className="input-group mb-3">
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch();
          }}
          className="form-control"
          placeholder="검색어 입력"
        />
      </div>

      {/* 게시글 목록 */}
      {posts.length > 0 ? (
        <table className="table table-hover">
          <thead className="table-light">
            <tr>
              <th style={{ width: "8%" }}>No</th>
              <th style={{ width: "55%" }}>제목</th>
              <th style={{ width: "15%" }}>글쓴이</th>
              <th style={{ width: "20%" }}>작성날짜</th>
            </tr>
          </thead>

          {/* ⭐ 수정: currentPosts 사용 */}
          <tbody>
            {currentPosts.map((p, index) => {
              const date = p.createdAt
                ? p.createdAt.slice(0, 10)
                : "-";

              return (
                <tr
                  key={p.postId}
                  style={{ cursor: "pointer" }}
                  onClick={() =>
                    navigate(`/main/board/detail/${p.postId}`)
                  }
                >
                  {/* ⭐ 수정: 페이지 고려한 No */}
                  <td>{posts.length - (indexOfFirstPost + index)}</td>

                  <td>
                    {p.title}
                    {tab === "REVIEW" && groupTitles[p.groupId] && (
                      <span
                        className="text-muted ms-2"
                        style={{ fontSize: "0.8rem" }}
                      >
                        ({groupTitles[p.groupId]})
                      </span>
                    )}
                  </td>

                  <td>{p.leaderName || "익명"}</td>
                  <td>{date}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <p>게시글이 없습니다.</p>
      )}

      {/* ⭐ 수정: 페이지네이션 */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-center mt-4">
          <ul className="pagination">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(
              (page) => (
                <li
                  key={page}
                  className={`page-item ${
                    page === currentPage ? "active" : ""
                  }`}
                >
                  <button
                    className="page-link"
                    onClick={() => setCurrentPage(page)}
                    style={{
                      color:
                        page === currentPage ? "white" : "#a78bfa",
                      backgroundColor:
                        page === currentPage ? "#a78bfa" : "white",
                      border: "1px solid #a78bfa",
                    }}
                  >
                    {page}
                  </button>
                </li>
              )
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Board;
