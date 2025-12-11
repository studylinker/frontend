import React, { useEffect, useState } from "react";
import api from "../../api/axios";

// Recharts
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, BarChart, Bar, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";

// Icons
import {
  FaBrain, FaChartLine, FaMapMarkerAlt, FaMagnet, FaTags,
  FaSyncAlt, FaChartBar, FaCompass, FaSlidersH, FaFire
} from "react-icons/fa";

const RecoManagement = () => {

  // -------------------------
  // 📍 상태값
  // -------------------------
  const [lat, setLat] = useState(37.5665);
  const [lng, setLng] = useState(126.9780);
  const [radius, setRadius] = useState(5);

  const [popWeight, setPopWeight] = useState(0.7);
  const [distanceWeight, setDistanceWeight] = useState(0.3);

  const [alpha, setAlpha] = useState(0.5);
  const [beta, setBeta] = useState(0.5);

  const [popularData, setPopularData] = useState([]);
  const [tagData, setTagData] = useState([]);
  const [history, setHistory] = useState([]);

  // -------------------------
  // 📌 공통 함수
  // -------------------------
  const avg = (arr) =>
    arr.length ? +(arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2) : 0;

  const diversity = (arr) => {
    const tags = new Set();
    arr.forEach((g) => g.category?.forEach((t) => tags.add(t)));
    return tags.size;
  };

  // -------------------------
  // 🔥 인기 기반 추천
  // -------------------------
  const loadPopular = async () => {
    try {
      const res = await api.get("/recommend/popular", {
        params: {
          lat,
          lng,
          radiusKm: radius,
          limit: 10,
          popWeight,
          distanceWeight,
        },
      });

      setPopularData(res.data.groups || []);
      return res.data.groups || [];

    } catch (err) {
      console.error("🔥 인기 기반 추천 불러오기 실패:", err);
      setPopularData([]);
      return [];
    }
  };

  // -------------------------
  // 🏷 태그 기반 추천
  // -------------------------
  const loadTag = async () => {
    try {
      const res = await api.get("/recommend/tag", {
        params: {
          lat,
          lng,
          radiusKm: radius,
          limit: 10,
          alpha,
          beta,
        },
      });

      setTagData(res.data.groups || []);
      return res.data.groups || [];

    } catch (err) {
      console.error("🏷 태그 기반 추천 불러오기 실패:", err);
      setTagData([]);
      return [];
    }
  };

  // -------------------------
  // 🔄 추천 다시 불러오기 + 히스토리 추가
  // -------------------------
  const refreshAll = async () => {
    const pop = await loadPopular();
    const tag = await loadTag();

    const newItem = {
      time: new Date().toLocaleTimeString(),
      popScore: avg(pop.map((g) => g.finalScore)),
      tagScore: avg(tag.map((g) => g.finalScore)),
    };

    setHistory((prev) => [...prev.slice(-9), newItem]); // 최대 10개 유지
  };

  useEffect(() => {
    refreshAll();
  }, []);

  // -------------------------
  // 📊 Bar Chart 데이터 구성
  // -------------------------
  const barData = [
    { name: "그룹 수", popular: popularData.length, tag: tagData.length },
    { name: "평균 점수", popular: avg(popularData.map((g) => g.finalScore)), tag: avg(tagData.map((g) => g.finalScore)) },
    { name: "평균 거리", popular: avg(popularData.map((g) => g.distanceKm)), tag: avg(tagData.map((g) => g.distanceKm)) },
    { name: "다양성", popular: diversity(popularData), tag: diversity(tagData) },
  ];

  // -------------------------
  // 🧭 레이더 차트 데이터 구성
  // -------------------------
  const radarData = [
    {
      metric: "거리점수",
      popular: avg(popularData.map((g) => g.distanceScore || 0)),
      tag: avg(tagData.map((g) => g.distanceScore || 0)),
    },
    {
      metric: "인기점수",
      popular: avg(popularData.map((g) => g.popScore || 0)),
      tag: 0,
    },
    {
      metric: "태그유사도",
      popular: 0,
      tag: avg(tagData.map((g) => g.tagSimilarity || 0)),
    },
    {
      metric: "최종점수",
      popular: avg(popularData.map((g) => g.finalScore)),
      tag: avg(tagData.map((g) => g.finalScore)),
    },
  ];

  return (
    <div>
      {/* 제목: 🧠 → FaBrain */}
      <h2 className="mb-4 d-flex align-items-center">
        <FaBrain className="me-2 text-primary" />
        추천 알고리즘 관리 및 모니터링
      </h2>

      {/* 가중치 패널 */}
      <div className="card p-4 mb-4 shadow-sm">

        <h5 className="fw-bold mb-4 d-flex align-items-center">
          <FaSlidersH className="me-2 text-primary" />
          추천 알고리즘 설정
        </h5>

        <div className="row g-4">

          {/* 인기 기반 */}
          <div className="col-md-6">
            <div className="p-3 border rounded shadow-sm bg-light">
              <h6 className="fw-bold mb-3 d-flex align-items-center text-primary">
                <FaFire className="me-2" /> 인기 기반 추천
              </h6>

              <label className="form-label">📈 인기 가중치</label>
              <input type="number" step="0.1" min="0" max="1"
                value={popWeight} onChange={(e) => setPopWeight(+e.target.value)}
                className="form-control mb-3" />

              <label className="form-label">📍 거리 가중치</label>
              <input type="number" step="0.1" min="0" max="1"
                value={distanceWeight} onChange={(e) => setDistanceWeight(+e.target.value)}
                className="form-control" />
            </div>
          </div>

          {/* 태그 기반 */}
          <div className="col-md-6">
            <div className="p-3 border rounded shadow-sm bg-light">
              <h6 className="fw-bold mb-3 d-flex align-items-center text-danger">
                <FaTags className="me-2" /> 태그 기반 추천
              </h6>

              <label className="form-label">🧲 거리 점수 가중치 (α)</label>
              <input type="number" step="0.1" min="0" max="1"
                value={alpha} onChange={(e) => setAlpha(+e.target.value)}
                className="form-control mb-3" />

              <label className="form-label">🏷 태그 유사도 가중치 (β)</label>
              <input type="number" step="0.1" min="0" max="1"
                value={beta} onChange={(e) => setBeta(+e.target.value)}
                className="form-control" />
            </div>
          </div>

        </div>

        <button className="btn refresh-btn mt-3" onClick={refreshAll}>
          <FaSyncAlt className="me-2" /> 새로고침 / 재계산
        </button>

      </div>

      {/* 라인 차트 */}
      <div className="card p-3 mb-4 shadow-sm">
        <h5 className="fw-bold d-flex align-items-center">
          <FaChartLine className="me-2 text-primary" /> 점수 변화 모니터링
        </h5>

        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer>
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="popScore" stroke="#007BFF" name="인기 기반" />
              <Line type="monotone" dataKey="tagScore" stroke="#FF5722" name="태그 기반" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 바 차트 */}
      <div className="card p-3 mb-4 shadow-sm">
        <h5 className="fw-bold d-flex align-items-center">
          <FaChartBar className="me-2 text-primary" />
          핵심 지표 비교
        </h5>

        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="popular" fill="#007BFF" name="인기 기반" />
              <Bar dataKey="tag" fill="#FF5722" name="태그 기반" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 레이더 차트 */}
      <div className="card p-3 shadow-sm">
        <h5 className="fw-bold d-flex align-items-center">
          <FaCompass className="me-2 text-primary" />
          알고리즘 특성 레이더 비교
        </h5>

        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" />
              <PolarRadiusAxis angle={90} domain={[0, 1]} />
              <Radar name="Popular" dataKey="popular" stroke="#007BFF" fill="#007BFF" fillOpacity={0.6} />
              <Radar name="Tag" dataKey="tag" stroke="#FF5722" fill="#FF5722" fillOpacity={0.6} />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default RecoManagement;
