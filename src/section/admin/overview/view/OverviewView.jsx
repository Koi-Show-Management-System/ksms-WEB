import { Typography, Select, Spin, Empty } from "antd";
import React, { useState, useEffect } from "react";
import Overview from "../Overview";
import useDashBoard from "../../../../hooks/useDashBoard";
import { Loading } from "../../../../components";

const { Option } = Select;
const { Text } = Typography;

function OverviewView() {
  const [selectedShow, setSelectedShow] = useState("all");
  const [selectedKoiShowId, setSelectedKoiShowId] = useState(null);
  const { dashboardData, isLoading, error, fetchDashboardData } =
    useDashBoard();
  const [allKoiShows, setAllKoiShows] = useState([]);

  // Tách thành 2 gọi API riêng biệt:
  // 1. Gọi để lấy danh sách tất cả các triển lãm (API không có tham số koiShowId)
  // 2. Gọi để lấy chi tiết triển lãm cụ thể (API có tham số koiShowId)
  useEffect(() => {
    // Đầu tiên luôn gọi API để lấy danh sách tất cả các triển lãm
    const fetchAllShowsData = async () => {
      await fetchDashboardData();
    };

    fetchAllShowsData();
  }, []);

  // Khi có dữ liệu tất cả triển lãm và chưa lưu vào state
  useEffect(() => {
    if (
      dashboardData &&
      dashboardData.koiShowRevenues &&
      (!allKoiShows.length || selectedShow === "all")
    ) {
      setAllKoiShows(dashboardData.koiShowRevenues);
    }
  }, [dashboardData]);

  // Khi người dùng chọn một triển lãm cụ thể
  useEffect(() => {
    if (selectedKoiShowId) {
      fetchDashboardData(selectedKoiShowId);
    }
  }, [selectedKoiShowId]);

  const handleShowChange = (value, option) => {
    setSelectedShow(value);
    if (value === "all") {
      setSelectedKoiShowId(null);
      fetchDashboardData();
    } else {
      // Find the koiShowId based on the selected show name
      const selectedShowData = allKoiShows.find(
        (show) => show.koiShowName === value
      );
      if (selectedShowData) {
        setSelectedKoiShowId(selectedShowData.koiShowId);
      }
    }
  };

  if (isLoading && !dashboardData) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen">
        <div className="flex justify-center items-center h-96">
          <Loading />
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

  // Sử dụng danh sách triển lãm từ state allKoiShows để dropdown luôn hiển thị đủ
  const koiShowOptions =
    allKoiShows.length > 0 ? allKoiShows : dashboardData.koiShowRevenues;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Tổng quan</h1>
        <Select
          style={{ width: 240 }}
          placeholder="Chọn triển lãm"
          onChange={handleShowChange}
          defaultValue="all"
          value={selectedShow}
          loading={isLoading}
        >
          <Option value="all">Tất cả các triển lãm</Option>
          {koiShowOptions.map((show) => (
            <Option key={show.koiShowId} value={show.koiShowName}>
              {show.koiShowName}
            </Option>
          ))}
        </Select>
      </div>
      {isLoading && selectedKoiShowId ? (
        <div className="flex justify-center items-center py-10">
          <Loading />
        </div>
      ) : (
        <Overview
          selectedShow={selectedShow}
          onShowChange={handleShowChange}
          dashboardData={dashboardData}
          isLoading={isLoading}
          error={error}
        />
      )}
    </div>
  );
}

export default OverviewView;
