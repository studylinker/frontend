// src/pages/admin/charts/MemberRatioChart.jsx

import React, { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

const MemberRatioChart = ({ labels, data }) => {
    const chartRef = useRef(null);
    const chartInstanceRef = useRef(null);

    useEffect(() => {
        // 기존 차트 삭제
        if (chartInstanceRef.current) {
            chartInstanceRef.current.destroy();
        }

        if (!chartRef.current) return;
        const ctx = chartRef.current.getContext("2d");

        // 새 차트 생성 (수평 바 차트)
        const newChart = new Chart(ctx, {
            type: "bar",
            data: {
                labels,
                datasets: [
                    {
                        label: "카테고리 비율",
                        data,
                        backgroundColor: "#36a2eb",
                    },
                ],
            },
            options: {
                indexAxis: "y", // ← ★ 수평차트 핵심 설정
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: "사용자 별 카테고리 비율",
                    },
                    legend: {
                        display: false, // label 하나만 있을 때는 숨기는 게 깔끔함
                    },
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1,
                        },
                    },
                },
            },
        });

        chartInstanceRef.current = newChart;

        // 정리(cleanup)
        return () => {
            chartInstanceRef.current?.destroy();
        };
    }, [labels, data]);

    return (
        <div style={{ height: "350px" }}>
            <canvas ref={chartRef}></canvas>
        </div>
    );
};

export default MemberRatioChart;
