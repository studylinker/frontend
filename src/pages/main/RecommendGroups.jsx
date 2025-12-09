// src/pages/main/RecommendGroups.jsx
import React, { useState, useEffect, useRef } from "react";
import api from "../../api/axios";
import "./StudyListButtons.css";

const RecommendGroups = () => {
  const [algorithm, setAlgorithm] = useState("locationNLP");
  const [radius, setRadius] = useState(2);
  const [userLocation, setUserLocation] = useState(null);

  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState("");

  const [userId, setUserId] = useState(null);

  const mapRef = useRef(null);
  const googleMap = useRef(null);
  const markersRef = useRef([]);

  // ======================================
  // 0) 로그인 사용자 정보 가져오기
  // ======================================
  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const res = await api.get("/users/profile");
        setUserId(res.data.userId);
      } catch (err) {
        console.error("유저 정보 불러오기 실패:", err);
      }
    };
    loadUserInfo();
  }, []);

  // ======================================
  // 1) 사용자 GPS 가져오기
  // ======================================
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
      (err) => console.error("위치 실패:", err)
    );
  }, []);

  // ======================================
  // 2) 추천 API 호출
  // ======================================
  const loadRecommendations = async () => {
    if (!userLocation || !userId) return;

    try {
      let url =
        algorithm === "locationNLP"
          ? "/recommend/tag"
          : "/recommend/popular";

      const res = await api.get(url, {
        params: {
          userId,
          limit: 10,
          lat: userLocation.lat,
          lng: userLocation.lng,
          radiusKm: radius,
        },
      });

      const rawGroups = res.data.groups || [];

      const enriched = await Promise.all(
        rawGroups.map(async (g) => {
          const id = g.studyGroupId ?? g.groupId;
          if (!id) return g;

          try {
            const detail = await api.get(`/study-groups/${id}`);
            return {
              ...g,
              description: detail.data.description,
              category:
                typeof detail.data.category === "string"
                  ? JSON.parse(detail.data.category)
                  : detail.data.category,
            };
          } catch {
            return g;
          }
        })
      );

      setGroups(enriched);
    } catch (err) {
      console.error("추천 불러오기 실패", err);
    }
  };

  useEffect(() => {
    loadRecommendations();
  }, [userLocation, radius, algorithm, userId]);

  // ======================================
  // 3) 참여 신청
  // ======================================
  const handleJoin = async (groupId) => {
    try {
      await api.post(`/study-groups/${groupId}/members`);
      alert("참여 신청 완료");
      loadRecommendations();
    } catch (err) {
      alert("참여 신청 실패");
      console.error(err);
    }
  };

  // ======================================
  // 4) Google Maps 마커 표시
  // ======================================
  useEffect(() => {
    if (!window.google || groups.length === 0) return;

    const container = document.getElementById("recommend-map");
    if (!container) return;

    container.innerHTML = "";

    const first = groups[0];
    const lat = first.lat || first.latitude;
    const lng = first.lng || first.longitude;

    if (!lat || !lng) return;

    const zoomByRadius = radius === 2 ? 14 : radius === 5 ? 13 : 12;

    googleMap.current = new window.google.maps.Map(container, {
      center: { lat, lng },
      zoom: zoomByRadius,
    });

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    groups.forEach((g) => {
      const glat = g.lat || g.latitude;
      const glng = g.lng || g.longitude;
      if (!glat || !glng) return;

      const marker = new window.google.maps.Marker({
        position: { lat: glat, lng: glng },
        map: googleMap.current,
        icon: {
          url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
        },
      });

      markersRef.current.push(marker);
    });
  }, [groups, radius]);

  // ======================================
  // 5) 상세보기 모달 → 주소 변환
  // ======================================
  useEffect(() => {
    if (!selectedGroup) return;
    if (!window.google?.maps) return;

    const geocoder = new window.google.maps.Geocoder();

    const lat = selectedGroup.lat || selectedGroup.latitude;
    const lng = selectedGroup.lng || selectedGroup.longitude;

    if (!lat || !lng) return;

    geocoder.geocode(
      { location: { lat, lng } },
      (results, status) => {
        if (status === "OK" && results[0]) {
          setSelectedAddress(results[0].formatted_address);
        }
      }
    );
  }, [selectedGroup]);

  // ======================================
  // UI
  // ======================================
  return (
    <div>
      <h2><strong>스터디 추천</strong></h2>
      <br />

      {/* 추천 방식 선택 */}
      <div className="mb-1">
        <label className="form-label fw-bold me-2">추천 방식:</label>
        <select
          value={algorithm}
          onChange={(e) => setAlgorithm(e.target.value)}
          className="form-select d-inline-block w-auto"
        >
          <option value="locationNLP">위치·자연어 기반 추천</option>
          <option value="popular">인기 기반 추천</option>
        </select>
      </div>

      {/* 반경 */}
      <div className="mb-3">
        <label className="form-label fw-bold me-2">반경:</label>
        <select
          value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
          className="form-select d-inline-block w-auto"
        >
          <option value={2}>2 km</option>
          <option value={5}>5 km</option>
          <option value={10}>10 km</option>
        </select>
      </div>

      {/* 지도 */}
      <div
        id="recommend-map"
        style={{
          width: "100%",
          height: "400px",
          borderRadius: "10px",
          background: "#eee",
          marginBottom: "20px",
        }}
      ></div>

      {/* 리스트 */}
      <div className="row">
        {groups.map((g) => {
          const id = g.studyGroupId ?? g.groupId;
          const name = g.name ?? g.title;
          const description = g.description ?? "-";

          return (
            <div key={id} className="col-md-6 mb-3">
              <div className="card shadow-sm">
                <div className="card-body">
                  <h5><strong>{name}</strong></h5>
                  <p>{description}</p>

                  {Array.isArray(g.category) && (
                    <p>
                      <strong>카테고리: </strong>
                      {g.category.map((tag, idx) => (
                        <span key={idx} className="badge bg-secondary me-1">
                          #{tag}
                        </span>
                      ))}
                    </p>
                  )}

                  <button
                    className="study-btn study-btn-detail me-2"
                    onClick={() => {
                      setSelectedGroup(g);
                      setShowModal(true);
                    }}
                  >
                    상세보기
                    <span className="icon-box"><i className="bi bi-arrow-right"></i></span>
                  </button>

                  <button
                    className="study-btn study-btn-join"
                    onClick={() => handleJoin(id)}
                  >
                    참여 신청
                    <span className="icon-box"><i className="bi bi-check2-circle"></i></span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {groups.length === 0 && <p>추천된 스터디가 없습니다.</p>}
      </div>

      {/* 상세 모달 */}
      {showModal && selectedGroup && (
        <div className="modal d-block" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="modal-dialog">
            <div className="modal-content">

              <div className="modal-header" style={{ backgroundColor: "#bfb9b9", color: "#fff" }}>
                <h5><strong>{selectedGroup.name ?? selectedGroup.title}</strong></h5>
                <button className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>

              <div className="modal-body">
                <p><strong>설명:</strong> {selectedGroup.description ?? "-"}</p>

                <p>
                  <strong>주소:</strong> {selectedAddress || "주소 변환 중..."}
                </p>

                <p>
                  <strong>추천 점수:</strong> ⭐ {selectedGroup.finalScore?.toFixed(2) ?? "-"}
                </p>
              </div>

              <div className="modal-footer">
                <button className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)}>
                  닫기
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecommendGroups;
