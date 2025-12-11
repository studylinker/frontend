// src/pages/main/MyPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import StudyGroupDetailModal from "../../components/StudyGroupDetailModal";

// ⭐ React Icons 추가
import { FaUser, FaStar, FaBook, FaPenNib } from "react-icons/fa";

const MyPage = () => {
  const navigate = useNavigate();

  const [userInfo, setUserInfo] = useState(null);
  const [manner, setManner] = useState(null);
  const [joinedGroups, setJoinedGroups] = useState([]);
  const [activity, setActivity] = useState({
    posts: 0,
    reviews: 0,
    comments: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showGroupModal, setShowGroupModal] = useState(false);

  const fetchUserProfile = async () => {
    try {
      const res = await api.get("/users/profile");
      setUserInfo(res.data);
      return res.data;
    } catch (err) {
      console.error("사용자 정보 조회 오류:", err);
      return null;
    }
  };

  const fetchJoinedGroups = async (userId) => {
    try {
      const allGroupsRes = await api.get("/study-groups");
      const groups = allGroupsRes.data || [];

      const myGroups = [];

      for (const g of groups) {
        try {
          const memRes = await api.get(
            `/study-groups/${g.groupId}/members/${userId}`
          );

          if (memRes.data && memRes.data.status === "APPROVED") {
            const leaderRes = await api.get(
              `/study-groups/${g.groupId}/leader`
            );

            const leaderName = leaderRes.data?.name || "(알 수 없음)";

            myGroups.push({
              ...g,
              status: memRes.data.status,
              leaderName: leaderName,
            });
          }
        } catch {}
      }

      setJoinedGroups(myGroups);
    } catch (err) {
      console.error("참여 그룹 조회 오류:", err);
    }
  };

  const fetchMannerScore = async (userId) => {
    try {
      const res = await api.get(`/manners/${userId}`);
      setManner(res.data);
    } catch (err) {
      console.error("매너점수 조회 오류:", err);
    }
  };

  const fetchActivityHistory = async (userId) => {
    try {
      const postsRes = await api.get("/study-posts");
      const allPosts = postsRes.data || [];

      const myPosts = allPosts.filter((p) => p.leaderId === userId);

      const postCount = myPosts.filter((p) => p.type === "FREE").length;
      const reviewCount = myPosts.filter((p) => p.type === "REVIEW").length;

      let commentCount = 0;
      for (const post of allPosts) {
        try {
          const cmRes = await api.get(`/study-posts/${post.postId}/comments`);
          const comments = cmRes.data || [];

          commentCount += comments.filter((c) => c.userId === userId).length;
        } catch {}
      }

      setActivity({
        posts: postCount,
        reviews: reviewCount,
        comments: commentCount,
      });
    } catch (err) {
      console.error("활동 이력 계산 오류:", err);
    }
  };

  const handleDeleteAccount = async () => {
    if (
      !window.confirm("정말 계정을 탈퇴하시겠습니까?\n탈퇴 후 복구는 불가능합니다.")
    )
      return;

    try {
      if (!userInfo) return;

      await api.delete(`/users/${userInfo.userId}`);

      alert("회원 탈퇴가 완료되었습니다.");
      localStorage.removeItem("token");
      navigate("/login");
    } catch (err) {
      console.error("회원 탈퇴 오류:", err);
      alert("회원 탈퇴 실패. 관리자에게 문의하세요.");
    }
  };

  useEffect(() => {
    const load = async () => {
      const user = await fetchUserProfile();
      if (user) {
        const userId = user.userId;
        await Promise.all([
          fetchJoinedGroups(userId),
          fetchMannerScore(userId),
          fetchActivityHistory(userId),
        ]);
      }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="container mt-4">로딩중...</div>;

  // ⭐ 매너점수 파스텔톤 색상 정의
  const getMannerColor = (score) => {
    if (score >= 70) return "#A3E4D7"; // 파스텔 민트
    if (score >= 40) return "#F9E79F"; // 파스텔 옐로우
    return "#F5B7B1"; // 파스텔 핑크
  };

  return (
    <div>
      <h2>
        <strong>내 프로필</strong>
      </h2>
      <br />

      {/* ------------------ 기본 정보 ------------------ */}
      <div className="card mb-4 shadow-sm">
        <div className="card-body">
          <h5 className="card-title mb-3">
            <FaUser className="me-2 text-primary" /> 기본 정보
          </h5>

          <p><strong>이름:</strong> {userInfo?.name}</p>
          <p><strong>아이디:</strong> {userInfo?.username}</p>
          <p><strong>이메일:</strong> {userInfo?.email}</p>
          <p>
            <strong>관심사:</strong>{" "}
            {userInfo?.interestTags?.length > 0
              ? userInfo.interestTags.join(", ")
              : "없음"}
          </p>

          <div className="d-flex justify-content-end mt-3">
            <button
              className="btn btn-outline-primary me-2"
              onClick={() => navigate("/main/edit-profile")}
            >
              내 정보 수정
            </button>
            <button
              className="btn btn-outline-secondary me-2"
              onClick={() => {
                localStorage.removeItem("token");   // 토큰 삭제
                navigate("/login");                 // 로그인 페이지로 이동
              }}
            >
              로그아웃
            </button>
            <button
              className="btn btn-outline-danger"
              onClick={handleDeleteAccount}
            >
              회원 탈퇴
            </button>
          </div>
        </div>
      </div>

      {/* ------------------ 매너점수 ------------------ */}
      <div className="card mb-4 shadow-sm">
        <div className="card-body">
          <h5 className="card-title mb-3">
            <FaStar className="me-2 text-warning" /> 매너점수
          </h5>

          <div className="progress" style={{ height: "25px" }}>
            <div
              className="progress-bar"
              role="progressbar"
              style={{
                width: `${manner?.currentMannerScore || 0}%`,
                backgroundColor: getMannerColor(
                  manner?.currentMannerScore || 0
                ),
                color: "#333",
                fontWeight: "bold",
              }}
            >
              {manner?.currentMannerScore ?? 0}점
            </div>
          </div>
        </div>
      </div>

      {/* ------------------ 참여 스터디 그룹 ------------------ */}
      <div className="card mb-4 shadow-sm">
        <div className="card-body">
          <h5 className="card-title mb-3">
            <FaBook className="me-2 text-success" /> 참여한 스터디 그룹
          </h5>

          {joinedGroups.length > 0 ? (
            <ul className="list-group">
              {joinedGroups.map((g) => (
                <li
                  key={g.groupId}
                  className="list-group-item d-flex justify-content-between align-items-center"
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    setSelectedGroup({ ...g, group_id: g.groupId });
                    setShowGroupModal(true);
                  }}
                >
                  <div>
                    <strong>{g.title}</strong>
                    <div className="small text-muted mt-1">
                      리더: {g.leaderName} / 상태: {g.status}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p>참여 중인 스터디가 없습니다.</p>
          )}
        </div>
      </div>

      {/* ------------------ 활동 이력 ------------------ */}
      <div className="card mb-4 shadow-sm">
        <div className="card-body">
          <h5 className="card-title mb-3">
            <FaPenNib className="me-2 text-primary" /> 활동 이력
          </h5>
          <div className="d-flex justify-content-around text-center">
            <div>
              <p className="h4 text-primary">{activity.posts}</p>
              <small className="text-muted">자유 게시글</small>
            </div>
            <div>
              <p className="h4 text-success">{activity.reviews}</p>
              <small className="text-muted">스터디 후기글</small>
            </div>
            <div>
              <p className="h4 text-warning">{activity.comments}</p>
              <small className="text-muted">댓글</small>
            </div>
          </div>
        </div>
      </div>

      {showGroupModal && selectedGroup && (
        <StudyGroupDetailModal
          group={selectedGroup}
          userId={userInfo.userId}
          onClose={() => {
            setShowGroupModal(false);
            setSelectedGroup(null);
          }}
        />
      )}
    </div>
  );
};

export default MyPage;
