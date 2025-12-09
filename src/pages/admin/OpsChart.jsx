// src/pages/admin/OpsChart.jsx
import React, { useState, useEffect } from "react";
import { FaUsers, FaClipboardList, FaUserPlus, FaDownload } from "react-icons/fa";
import api from "../../api/axios";
import OpsChartContent from "./OpsChartContent";

// -----------------------------------------------------------------
// 📦 데이터 내보내기 모달
// -----------------------------------------------------------------
const ExportModal = ({ show, onClose, onConfirm }) => {
    if (!show) return null;

    return (
        <div
            className="modal show"
            tabIndex="-1"
            style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">📊 통계 데이터 내보내기</h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <div className="modal-body">
                        <p>CSV 파일로 다운로드하시겠습니까?</p>
                    </div>
                    <div className="modal-footer">
                        <button className="btn btn-secondary" onClick={onClose}>취소</button>
                        <button className="btn btn-primary" onClick={onConfirm}>확인</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// -----------------------------------------------------------------
// 📊 대시보드 본문
// -----------------------------------------------------------------
const OpsChart = () => {
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);

    const [summary, setSummary] = useState({
        totalUsers: 0,
        activeStudies: 0,
        newSignupsToday: 0
    });

    useEffect(() => {
        api.get("/stats/summary")
            .then(res => setSummary(res.data))
            .catch(err => console.error("요약 통계 불러오기 실패:", err));
    }, []);

    const handleConfirmExport = () => {
    setIsExportModalOpen(false);

    api.get("/stats/export", { responseType: "blob" })
        .then((res) => {
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", "stats.csv");
            document.body.appendChild(link);
            link.click();
            link.remove();
        })
        .catch((err) => {
            console.error("CSV 다운로드 실패:", err);
            alert("CSV 다운로드 실패");
        });
};


    return (
        <div>
            <h2 className="mb-4">📊 운영 대시보드</h2>

            {/* ================================================================= */}
            {/* 🔵 KPI 카드 3개 */}
            {/* ================================================================= */}
            <div className="row g-3 mb-4">

                {/* 총 회원 */}
                <div className="col-md-4">
                    <div className="card shadow-sm p-3 d-flex flex-row align-items-center">
                        <FaUsers size={30} className="text-primary me-3" />
                        <div>
                            <h6 className="text-muted mb-1">총 회원</h6>
                            <h4 className="fw-bold">{summary.totalUsers}명</h4>
                        </div>
                    </div>
                </div>

                {/* 활성 스터디 */}
                <div className="col-md-4">
                    <div className="card shadow-sm p-3 d-flex flex-row align-items-center">
                        <FaClipboardList size={30} className="text-success me-3" />
                        <div>
                            <h6 className="text-muted mb-1">활성 스터디</h6>
                            <h4 className="fw-bold">{summary.activeStudies}개</h4>
                        </div>
                    </div>
                </div>

                {/* 신규 가입 */}
                <div className="col-md-4">
                    <div className="card shadow-sm p-3 d-flex flex-row align-items-center">
                        <FaUserPlus size={30} className="text-warning me-3" />
                        <div>
                            <h6 className="text-muted mb-1">오늘 신규 가입</h6>
                            <h4 className="fw-bold">{summary.newSignupsToday}명</h4>
                        </div>
                    </div>
                </div>
            </div>

            {/* ================================================================= */}
            {/* 📥 데이터 내보내기 Floating 버튼 */}
            {/* ================================================================= */}
            <div className="d-flex justify-content-end mb-3">
                <button
                    className="btn btn-outline-primary d-flex align-items-center"
                    onClick={() => setIsExportModalOpen(true)}
                >
                    <FaDownload className="me-2" />
                    데이터 내보내기
                </button>
            </div>

            {/* ================================================================= */}
            {/* ⭐ 차트 영역 */}
            {/* ================================================================= */}
            <OpsChartContent />

            {/* 모달 */}
            <ExportModal
                show={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                onConfirm={handleConfirmExport}
            />
        </div>
    );
};

export default OpsChart;
