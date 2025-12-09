// src/pages/main/StudyList.jsx
import React, { useState, useEffect, useRef } from "react";
import api from "../../api/axios";
import StudyGroupDetailModal from "../../components/StudyGroupDetailModal";
import "./StudyListButtons.css";

function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const StudyList = () => {
  const [groups, setGroups] = useState([]);
  const [joinedGroups, setJoinedGroups] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [userLocation, setUserLocation] = useState(null);

  // 생성 모달
  const [showForm, setShowForm] = useState(false);

  // 상세 모달
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [showModal, setShowModal] = useState(false);

  // Google Maps
  const mapContainerRef = useRef(null); // 지도 DOM
  const googleMapRef = useRef(null); // 지도 객체
  const markerRef = useRef(null); // 생성 마커 객체

  // 생성 폼 데이터
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    maxMembers: 10,
    category: [],
    latitude: null,
    longitude: null,
  });

  const [myUserId, setMyUserId] = useState(null);
  const [isLeader, setIsLeader] = useState(false);

  // -------------------------------
  // 현재 로그인 사용자 정보 조회
  // -------------------------------
  useEffect(() => {
    api
      .get("/users/profile")
      .then((res) => setMyUserId(res.data.userId ?? res.data.user_id))
      .catch(() => {});
  }, []);

  // -------------------------------
  // 현재 위치 가져오기
  // -------------------------------
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) =>
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
      (err) => console.error("위치 가져오기 실패:", err)
    );
  }, []);

  // -------------------------------
  // 스터디 그룹 목록 조회
  // -------------------------------
  const loadGroups = async () => {
    try {
      const res = await api.get("/study-groups");
      const parsed = res.data.map((g) => ({
        ...g,
        categoryList:
          typeof g.category === "string" && g.category.trim().startsWith("[")
            ? JSON.parse(g.category)
            : [],
      }));
      setGroups(parsed);
    } catch (err) {
      console.error("스터디 조회 실패:", err);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  // -------------------------------
  // 이미 신청한 그룹 체크
  // -------------------------------
  useEffect(() => {
    if (!myUserId) return;

    const checkUserMembership = async () => {
      const newSet = new Set();
      for (const g of groups) {
        try {
          const res = await api.get(
            `/study-groups/${g.groupId}/members/${myUserId}`
          );
          if (res.data && res.data.status !== "REJECTED")
            newSet.add(g.groupId);
        } catch {}
      }
      setJoinedGroups(newSet);
    };

    checkUserMembership();
  }, [myUserId, groups]);

// -------------------------------
// Google Maps 초기화 (모달 열릴 때마다 새로 생성하도록 수정)
// -------------------------------
useEffect(() => {

  // ★ 모달 닫혔으면 cleanup 실행하고 지도 제거
  if (!showForm) {
    googleMapRef.current = null;      // ★ 수정: 지도 객체 제거
    markerRef.current = null;
    return;
  }

  // Google 객체 로드 확인
  if (!window.google || !window.google.maps) return;

  const container = mapContainerRef.current;
  if (!container) return;

  // ★ 지도는 모달 열릴 때마다 항상 새로 생성
  googleMapRef.current = new window.google.maps.Map(container, {
    center: userLocation || { lat: 37.45, lng: 127.12 },
    zoom: 15,
  });

  // 지도 클릭 → 마커 및 좌표 저장
  const clickListener = googleMapRef.current.addListener("click", (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();

    if (!markerRef.current) {
      markerRef.current = new window.google.maps.Marker({
        position: { lat, lng },
        map: googleMapRef.current,
      });
    } else {
      markerRef.current.setPosition({ lat, lng });
    }

    setFormData((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
    }));
  });

  // ★ cleanup: 모달 닫을 때 이벤트 제거
  return () => {
    if (clickListener) window.google.maps.event.removeListener(clickListener);
  };

}, [showForm, userLocation]);   // ★ showForm만으로도 충분하지만 userLocation도 포함

  // -------------------------------
  // 스터디 생성
  // -------------------------------
  const handleCreate = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) return alert("스터디 제목을 입력하세요.");
    if (!formData.latitude || !formData.longitude)
      return alert("지도에서 위치를 선택하세요.");

    try {
      await api.post("/study-groups", {
        title: formData.title,
        description: formData.description,
        maxMembers: formData.maxMembers,
        category: JSON.stringify(formData.category ?? []),
        latitude: formData.latitude,
        longitude: formData.longitude,
      });

      alert("스터디가 생성되었습니다!");
      setShowForm(false);
      loadGroups();
    } catch (err) {
      console.error("스터디 생성 실패:", err);
      alert("생성 실패: " + err.response?.data);
    }
  };

  // -------------------------------
  // 상세 모달 열기
  // -------------------------------
  const fetchGroupLeader = async (groupId) => {
    try {
      const res = await api.get(`/study-groups/${groupId}/leader`);
      return res.data;
    } catch {
      return null;
    }
  };

  const openDetailModal = async (group) => {
    const leader = await fetchGroupLeader(group.groupId);
    setIsLeader(leader && leader.userId === myUserId);

    setSelectedGroup({
      ...group,
      group_id: group.groupId,
      leaderName: leader?.name ?? "정보 없음",
    });

    if (window.google?.maps) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode(
        { location: { lat: group.latitude, lng: group.longitude } },
        (results, status) => {
          if (status === "OK" && results[0])
            setSelectedAddress(results[0].formatted_address);
        }
      );
    }

    setShowModal(true);
  };

  // -------------------------------
  // 참여 신청
  // -------------------------------
  const handleJoin = async (groupId) => {
    try {
      await api.post(`/study-groups/${groupId}/members`);
      alert("참여 신청 완료!");
      setJoinedGroups((prev) => new Set(prev).add(groupId));
    } catch (err) {
      const msg = err.response?.data || "신청 실패";
      if (msg.includes("이미 신청했거나 가입된"))
        setJoinedGroups((prev) => new Set(prev).add(groupId));

      alert(msg);
    }
  };

  // -------------------------------
  // 검색 + 거리 계산
  // -------------------------------
  const filteredGroups = groups
    .filter((g) => {
      const t = searchTerm.toLowerCase();
      return (
        g.title.toLowerCase().includes(t) ||
        g.description.toLowerCase().includes(t)
      );
    })
    .map((g) => {
      if (userLocation)
        g.distance = getDistance(
          userLocation.lat,
          userLocation.lng,
          g.latitude,
          g.longitude
        );
      return g;
    })
    .sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));

  // -------------------------------
  // UI
  // -------------------------------
  return (
    <div>
      <h2><strong>스터디 목록</strong></h2>
      <br />

      <input
        className="form-control mb-3"
        placeholder="스터디 검색..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <div className="text-end mb-3">
        <button className="learn-more" onClick={() => setShowForm(true)}>
          ➕ 새 스터디 생성
        </button>
      </div>

      {/* 스터디 목록 */}
      <div className="row">
        {filteredGroups.map((g) => (
          <div key={g.groupId} className="col-md-6 mb-3">
            <div className="card shadow-sm">
              <div className="card-body">
                <h5><strong>{g.title}</strong></h5>
                <p>{g.description}</p>

                <p>
                  거리:{" "}
                  {g.distance ? `${g.distance.toFixed(1)} km` : "계산 불가"}
                </p>

                <button
                  className="study-btn study-btn-detail me-2"
                  onClick={() => openDetailModal(g)}
                >
                  상세보기
                  <span className="icon-box">
                    <i className="bi bi-arrow-right"></i>
                  </span>
                </button>

                <button
                  className="study-btn study-btn-join"
                  disabled={joinedGroups.has(g.groupId)}
                  onClick={() => handleJoin(g.groupId)}
                >
                  {joinedGroups.has(g.groupId) ? "신청됨" : "참여 신청"}
                  <span className="icon-box">
                    <i className="bi bi-check2-circle"></i>
                  </span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 상세 보기 모달 */}
      {showModal && selectedGroup && (
        isLeader ? (
          <StudyGroupDetailModal
            group={selectedGroup}
            userId={myUserId}
            onClose={() => setShowModal(false)}
          />
        ) : (
          <div className="modal d-block" style={{ background: "rgba(0,0,0,0.4)" }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div
                  className="modal-header"
                  style={{ backgroundColor: "#bfb9b9", color: "#fff" }}
                >
                  <h5><strong>{selectedGroup.title}</strong></h5>
                  <button
                    className="btn-close btn-close-white"
                    onClick={() => setShowModal(false)}
                  />
                </div>

                <div className="modal-body">
                  <p><strong>리더:</strong> {selectedGroup.leaderName}</p>
                  <p><strong>설명:</strong> {selectedGroup.description}</p>
                  <p><strong>주소:</strong> {selectedAddress}</p>

                  <div className="mt-2">
                    <strong>카테고리:</strong>
                    {selectedGroup.categoryList.map((tag, idx) => (
                      <span
                        key={idx}
                        className="badge me-2"
                        style={{ backgroundColor: "#bfb9b9", color: "#fff" }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setShowModal(false)}
                  >
                    닫기
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      )}

      {/* 생성 모달 */}
      {showForm && (
        <div className="modal d-block" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div
                className="modal-header"
                style={{ backgroundColor: "#797979ff", color: "#fff" }}
              >
                <h5><strong>새 스터디 생성</strong></h5>
                <button
                  className="btn-close btn-close-white"
                  onClick={() => setShowForm(false)}
                />
              </div>

              <form onSubmit={handleCreate}>
                <div className="modal-body">
                  <input
                    className="form-control mb-2"
                    placeholder="스터디 제목"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                  />

                  <textarea
                    className="form-control mb-2"
                    placeholder="스터디 설명"
                    rows="3"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />

                  <input
                    className="form-control mb-3"
                    type="number"
                    placeholder="최대 인원 (10~20)"
                    value={formData.maxMembers}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxMembers: Number(e.target.value),
                      })
                    }
                  />

                  {/* 태그 */}
                  <label className="form-label">해시태그 추가</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Java, React 등"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const tag = e.target.value.trim();
                        if (tag && !formData.category.includes(tag)) {
                          setFormData((prev) => ({
                            ...prev,
                            category: [...prev.category, tag],
                          }));
                        }
                        e.target.value = "";
                      }
                    }}
                  />

                  <div className="mt-2">
                    {formData.category.map((tag, idx) => (
                      <span
                        key={idx}
                        className="badge bg-info text-dark me-2"
                        style={{ cursor: "pointer" }}
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            category: prev.category.filter(
                              (t) => t !== tag
                            ),
                          }))
                        }
                      >
                        #{tag} ✕
                      </span>
                    ))}
                  </div>

                  {/* 지도 */}
                  <div className="mt-3">
                    <h6>지도에서 위치 선택</h6>
                    <div
                      ref={mapContainerRef}
                      style={{
                        width: "100%",
                        height: "300px",
                        borderRadius: "10px",
                        border: "1px solid #ccc",
                      }}
                    ></div>
                  </div>

                  {formData.latitude && (
                    <p className="mt-2 text-muted">
                      선택된 좌표: {formData.latitude}, {formData.longitude}
                    </p>
                  )}
                </div>

                <div className="modal-footer">
                  <button
                    className="btn btn-sm"
                    style={{ backgroundColor: "#797979ff", color: "#fff" }}
                    onClick={() => setShowForm(false)}
                  >
                    취소
                  </button>
                  <button
                    className="btn btn-sm"
                    type="submit"
                    style={{ backgroundColor: "#f88888ff", color: "#fff" }}
                  >
                    생성
                  </button>
                </div>
              </form>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyList;
