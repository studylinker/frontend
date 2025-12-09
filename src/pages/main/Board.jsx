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
  const { user } = useContext(AuthContext);
  const [groupTitles, setGroupTitles] = useState({});

  const navigate = useNavigate();

  // =============================
  // 🔹 게시글 전체 조회
  // =============================
  const fetchPosts = async (targetTab = tab) => {
    try {
      const res = await api.get("/study-posts");
      const list = Array.isArray(res.data) ? res.data : [];

      // 최신순 정렬 추가
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setAllPosts(list);
      setPosts(list.filter((p) => p.type === targetTab));

      if (targetTab === "REVIEW") {
        fetchGroupTitles(list);
      }
    } catch (err) {
      console.error("게시글 조회 실패:", err);
    }
  };

  // =============================
  // 최초 렌더링 시 게시판 로딩
  // =============================
  useEffect(() => {
    if (user) fetchPosts("FREE");
  }, [user]);

  // =============================
  // 🔹 탭 변경 시 재조회
  // =============================
  useEffect(() => {
    if (user) fetchPosts(tab);
  }, [tab, user]);


  // =============================
  // 🔹 REVIEW 글 → 스터디명 조회
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
  // 🔹 검색
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
  };

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
        <button className="learn-more" onClick={() => navigate("/main/board/write")}>
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
            if (e.key === "Enter") {
              handleSearch();
            }
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
          <tbody>
            {posts.map((p, index) => {
              // 날짜 YYYY-MM-DD 로 변환
              const date = p.createdAt ? p.createdAt.slice(0, 10) : "-";

              return (
                <tr
                  key={p.postId}
                  style={{ cursor: "pointer" }}
                  onClick={() => navigate(`/main/board/detail/${p.postId}`)}
                >
                  <td>{posts.length - index}</td>

                  <td>
                    {p.title}
                    {tab === "REVIEW" && groupTitles[p.groupId] && (
                      <span className="text-muted ms-2" style={{ fontSize: "0.8rem" }}>
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
    </div>
  );
};

export default Board;
