// src/pages/admin/OpsChartContent.jsx

import React, { useEffect, useState } from "react";
import api from "../../api/axios";

import StudyCountChart from "./charts/StudyCountChart";
import MemberRatioChart from "./charts/MemberRatioChart";
import AttendanceChart from "./charts/AttendanceChart";

import { FaChartLine, FaUsers, FaUserCheck } from "react-icons/fa";

const OpsChartContent = () => {
  const [studyCount, setStudyCount] = useState({ labels: [], data: [] });
  const [memberRatio, setMemberRatio] = useState({ labels: [], data: [] });
  const [attendance, setAttendance] = useState({ labels: [], data: [] });

  useEffect(() => {
    // -----------------------------
    // 1) 월별 스터디 생성 수
    // -----------------------------
    api
      .get("/stats/study-count")
      .then((res) => {
        setStudyCount({
          labels: res.data.labels,
          data: res.data.data,
        });
      })
      .catch(() => {
        // 더미 데이터
        setStudyCount({
          labels: ["1월", "2월", "3월"],
          data: [4, 8, 10],
        });
      });

    // -----------------------------
    // 2) 카테고리 비율
    // -----------------------------
    api
      .get("/stats/member-ratio")
      .then((res) => {
        setMemberRatio({
          labels: res.data.labels,
          data: res.data.data,
        });
      })
      .catch(() => {
        setMemberRatio({
          labels: ["자바", "프론트", "알고리즘"],
          data: [40, 35, 25],
        });
      });

    // -----------------------------
    // 3) 출석 상태 비율
    // -----------------------------
    api
      .get("/stats/attendance")
      .then((res) => {
        setAttendance({
          labels: res.data.labels,
          data: res.data.data,
        });
      })
      .catch(() => {
        setAttendance({
          labels: ["출석", "지각", "결석"],
          data: [70, 10, 20],
        });
      });
  }, []);

  return (
    <div className="ops-chart-content">
      <h3 className="fw-bold mb-4">📊 운영 통계 차트</h3>

      <div className="row g-4">

        {/* 월별 스터디 생성 수 */}
        <div className="col-lg-6 col-md-12">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-primary text-white d-flex align-items-center">
              <FaChartLine size={20} className="me-2" />
              <span className="fw-semibold">월별 스터디 생성 수</span>
            </div>
            <div className="card-body">
              <StudyCountChart labels={studyCount.labels} data={studyCount.data} />
            </div>
          </div>
        </div>

        {/* 카테고리 비율 */}
        <div className="col-lg-6 col-md-12">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-success text-white d-flex align-items-center">
              <FaUsers size={20} className="me-2" />
              <span className="fw-semibold">사용자 별 카테고리 분석</span>
            </div>
            <div className="card-body">
              <MemberRatioChart labels={memberRatio.labels} data={memberRatio.data} />
            </div>
          </div>
        </div>

        {/* 출석 상태 비율 */}
        <div className="col-lg-6 col-md-12">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-warning text-dark d-flex align-items-center">
              <FaUserCheck size={20} className="me-2" />
              <span className="fw-semibold">출석 상태 비율</span>
            </div>
            <div className="card-body">
              <AttendanceChart labels={attendance.labels} data={attendance.data} />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default OpsChartContent;
