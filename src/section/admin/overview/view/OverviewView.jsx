import { Typography, Select, Spin, Empty } from "antd";
import React, { useState, useEffect } from "react";
import Overview from "../Overview";
import useDashBoard from "../../../../hooks/useDashBoard";

const { Option } = Select;
const { Text } = Typography;

function OverviewView() {
  const [selectedShow, setSelectedShow] = useState("all");
  const { dashboardData, isLoading, error, fetchDashboardData } =
    useDashBoard();

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (isLoading) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen">
        <div className="flex justify-center items-center h-96">
          <Spin size="large" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen">
        <div className="flex justify-center items-center h-96">
          <Empty
            description={<Text type="danger">Đã xảy ra lỗi: {error}</Text>}
          />
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen">
        <div className="flex justify-center items-center h-96">
          <Empty description="Không có dữ liệu để hiển thị" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Tổng quan</h1>
        <Select
          style={{ width: 240 }}
          placeholder="Chọn triển lãm"
          onChange={setSelectedShow}
          defaultValue="all"
        >
          <Option value="all">Tất cả các triển lãm</Option>
          {dashboardData.koiShowRevenues.map((show) => (
            <Option key={show.koiShowId} value={show.koiShowName}>
              {show.koiShowName}
            </Option>
          ))}
        </Select>
      </div>
      <Overview
        selectedShow={selectedShow}
        onShowChange={setSelectedShow}
        dashboardData={dashboardData}
        isLoading={isLoading}
        error={error}
      />
    </div>
  );
}

export default OverviewView;
