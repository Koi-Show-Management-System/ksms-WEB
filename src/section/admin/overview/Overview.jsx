import React from "react";
import { Card, Row, Col } from "antd";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  TrophyOutlined,
  UserOutlined,
  GoldOutlined,
  RollbackOutlined,
  LineChartOutlined,
  DollarOutlined,
} from "@ant-design/icons";

// Hàm định dạng số tiền
const formatCurrency = (value) => {
  if (value === 0) return "0 đ";
  if (!value) return "0 đ";

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Bảng màu hiện đại nhưng đơn giản
const COLORS = [
  "#1890ff", // Xanh dương
  "#52c41a", // Xanh lá
  "#fa8c16", // Cam
  "#f5222d", // Đỏ
  "#722ed1", // Tím
  "#13c2c2", // Ngọc lam
  "#faad14", // Vàng
  "#eb2f96", // Hồng
  "#bfbfbf", // Xám
];

const Overview = ({ selectedShow = "all", onShowChange, dashboardData }) => {
  // Lọc ra top 5 triển lãm có lợi nhuận cao nhất
  const topKoiShows = [...dashboardData.koiShowRevenues]
    .sort((a, b) => b.netProfit - a.netProfit)
    .slice(0, 5);

  // Dữ liệu doanh thu cho biểu đồ cột - đơn giản hóa
  const revenueData = topKoiShows.map((show) => ({
    name:
      show.koiShowName.length > 15
        ? show.koiShowName.substring(0, 12) + "..."
        : show.koiShowName,
    revenue:
      show.registrationRevenue + show.ticketRevenue + show.sponsorRevenue,
    refund: show.registrationRefundAmount + show.ticketRefundAmount,
    profit: show.netProfit,
    fullName: show.koiShowName,
  }));

  // Dữ liệu phân phối lợi nhuận cho biểu đồ tròn
  const profitDistributionData = [...dashboardData.profitDistribution]
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 5) // Chỉ lấy top 5 phần trăm cao nhất
    .map((item) => ({
      name: item.koiShowName,
      value: dashboardData.netProfit * (item.percentage / 100),
      percentage: item.percentage,
    }));

  // Thêm mục "Khác" nếu còn lại
  if (dashboardData.profitDistribution.length > 5) {
    const otherPercentage = dashboardData.profitDistribution
      .sort((a, b) => b.percentage - a.percentage)
      .slice(5)
      .reduce((sum, item) => sum + item.percentage, 0);

    if (otherPercentage > 0) {
      profitDistributionData.push({
        name: "Khác",
        value: dashboardData.netProfit * (otherPercentage / 100),
        percentage: Number(otherPercentage.toFixed(2)),
      });
    }
  }

  // Lấy số liệu thống kê theo triển lãm đã chọn
  function getTotalValue(key) {
    if (selectedShow === "all") {
      return dashboardData[key];
    }

    const selectedShowData = dashboardData.koiShowRevenues.find(
      (show) => show.koiShowName === selectedShow
    );

    if (!selectedShowData) return 0;

    switch (key) {
      case "totalKoiShows":
        return 1;
      case "totalUsers":
      case "totalKoi":
        return "-";
      case "totalRevenue":
        return (
          selectedShowData.registrationRevenue +
          selectedShowData.ticketRevenue +
          selectedShowData.sponsorRevenue
        );
      case "totalRefund":
        return (
          selectedShowData.registrationRefundAmount +
          selectedShowData.ticketRefundAmount
        );
      case "netProfit":
        return selectedShowData.netProfit;
      default:
        return 0;
    }
  }

  // Component Card thống kê đơn giản
  const StatCard = ({ title, value, icon, color, isCurrency = false }) => (
    <Card styles={{ body: { padding: "16px" } }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 mb-1 text-sm">{title}</p>
          <p className="text-2xl font-semibold" style={{ color }}>
            {isCurrency ? formatCurrency(value) : value}
          </p>
        </div>
        <div
          className="p-3 rounded-full"
          style={{ backgroundColor: `${color}15`, color }}
        >
          {icon}
        </div>
      </div>
    </Card>
  );

  // Dữ liệu cho biểu đồ được chọn
  const filteredRevenueData =
    selectedShow === "all"
      ? revenueData
      : dashboardData.koiShowRevenues
          .filter((show) => show.koiShowName === selectedShow)
          .map((show) => ({
            name: show.koiShowName,
            revenue:
              show.registrationRevenue +
              show.ticketRevenue +
              show.sponsorRevenue,
            refund: show.registrationRefundAmount + show.ticketRefundAmount,
            profit: show.netProfit,
            fullName: show.koiShowName,
          }));

  // Tooltip tùy chỉnh cho biểu đồ
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-100 shadow-md rounded-md">
          <p className="font-semibold">
            {payload[0]?.payload?.fullName || label}
          </p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center mt-1">
              <span style={{ color: entry.color }}>●</span>
              <span className="ml-2">{entry.name}: </span>
              <span className="ml-1 font-medium">
                {formatCurrency(entry.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <Row gutter={[16, 16]} className="mb-5">
        <Col xs={24} sm={8}>
          <StatCard
            title="Tổng doanh thu"
            value={getTotalValue("totalRevenue")}
            icon={<DollarOutlined style={{ fontSize: "24px" }} />}
            color="#1890ff"
            isCurrency={true}
          />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard
            title="Hoàn trả"
            value={getTotalValue("totalRefund")}
            icon={<RollbackOutlined style={{ fontSize: "24px" }} />}
            color="#f5222d"
            isCurrency={true}
          />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard
            title="Lợi nhuận ròng"
            value={getTotalValue("netProfit")}
            icon={<LineChartOutlined style={{ fontSize: "24px" }} />}
            color="#52c41a"
            isCurrency={true}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="mb-5">
        <Col xs={24} sm={8}>
          <StatCard
            title="Số lượng triển lãm"
            value={getTotalValue("totalKoiShows")}
            icon={<TrophyOutlined style={{ fontSize: "24px" }} />}
            color="#722ed1"
            isCurrency={false}
          />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard
            title="Tổng số người dùng"
            value={getTotalValue("totalUsers")}
            icon={<UserOutlined style={{ fontSize: "24px" }} />}
            color="#fa8c16"
            isCurrency={false}
          />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard
            title="Tổng số Koi"
            value={getTotalValue("totalKoi")}
            icon={<GoldOutlined style={{ fontSize: "24px" }} />}
            color="#13c2c2"
            isCurrency={false}
          />
        </Col>
      </Row>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card
          title={
            <h3 className="text-lg font-semibold">
              {selectedShow === "all"
                ? "Top 5 triển lãm theo doanh thu"
                : "Chi tiết doanh thu"}
            </h3>
          }
        >
          <div style={{ height: "400px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={filteredRevenueData}
                margin={{ top: 10, right: 10, left: 20, bottom: 50 }}
                barSize={30}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f0f0f0"
                />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  tick={{ fontSize: 12 }}
                />
                <YAxis tickFormatter={(value) => value.toLocaleString()} />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={50}
                  wrapperStyle={{ paddingTop: 40, marginBottom: 1 }}
                />
                <Bar
                  dataKey="revenue"
                  name="Doanh thu"
                  fill="#1890ff"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="refund"
                  name="Hoàn trả"
                  fill="#f5222d"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="profit"
                  name="Lợi nhuận"
                  fill="#52c41a"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card
          title={
            <h3 className="text-lg font-semibold">
              Phân phối lợi nhuận theo triển lãm
            </h3>
          }
        >
          <div style={{ height: "360px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={profitDistributionData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  innerRadius={60}
                  paddingAngle={2}
                  label={({ name, percentage }) => `${percentage.toFixed(1)}%`}
                >
                  {profitDistributionData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  labelFormatter={(name) => `${name}`}
                />
                <Legend
                  formatter={(value, entry, index) => (
                    <span
                      style={{
                        color: COLORS[index % COLORS.length],
                        fontSize: "14px",
                      }}
                    >
                      {value} ({entry.payload.percentage.toFixed(1)}%)
                    </span>
                  )}
                  wrapperStyle={{ paddingTop: 10, marginBottom: 1 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Overview;
