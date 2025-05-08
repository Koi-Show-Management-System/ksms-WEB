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
  GiftOutlined,
  ShoppingOutlined,
  TagOutlined,
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

  // Dữ liệu cho biểu đồ cột - đơn giản hóa
  const chartData = topKoiShows.map((show) => ({
    name:
      show.koiShowName.length > 15
        ? show.koiShowName.substring(0, 12) + "..."
        : show.koiShowName,
    registration: show.registrationRevenue,
    ticket: show.ticketRevenue,
    sponsor: show.sponsorRevenue,
    award: show.awardRevenue,
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
      // Không hiển thị totalRevenue khi xem tất cả triển lãm
      if (key === "totalRevenue") return null;
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
        return "-";
      case "totalKoi":
        // Sử dụng giá trị totalKoi từ API nếu đang xem một triển lãm cụ thể
        return dashboardData.totalKoi || "-";
      case "totalRefund":
        return (
          selectedShowData.registrationRefundAmount +
          selectedShowData.ticketRefundAmount
        );
      case "netProfit":
        return selectedShowData.netProfit;
      case "registrationRevenue":
        return selectedShowData.registrationRevenue;
      case "ticketRevenue":
        return selectedShowData.ticketRevenue;
      case "sponsorRevenue":
        return selectedShowData.sponsorRevenue;
      case "awardRevenue":
        return selectedShowData.awardRevenue;
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
  const filteredChartData =
    selectedShow === "all"
      ? chartData
      : dashboardData.koiShowRevenues
          .filter((show) => show.koiShowName === selectedShow)
          .map((show) => ({
            name: show.koiShowName,
            registration: show.registrationRevenue,
            ticket: show.ticketRevenue,
            sponsor: show.sponsorRevenue,
            award: show.awardRevenue,
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

  // Xác định xem có đang xem triển lãm cụ thể không
  const isViewingSpecificShow = selectedShow !== "all";

  return (
    <div>
      <Row gutter={[16, 16]} className="mb-5">
        <Col xs={24} sm={8}>
          <StatCard
            title="Lợi nhuận"
            value={getTotalValue("netProfit")}
            icon={<LineChartOutlined style={{ fontSize: "24px" }} />}
            color="#52c41a"
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
            title="Tổng số Koi tham gia"
            value={getTotalValue("totalKoi")}
            icon={<GoldOutlined style={{ fontSize: "24px" }} />}
            color="#13c2c2"
            isCurrency={false}
          />
        </Col>
      </Row>

      {!isViewingSpecificShow ? (
        // Hiển thị thông tin tổng quan khi xem tất cả triển lãm
        <Row gutter={[16, 16]} justify="space-between" className="mb-5">
          <Col xs={24} sm={12}>
            <StatCard
              title="Số lượng triển lãm"
              value={getTotalValue("totalKoiShows")}
              icon={<TrophyOutlined style={{ fontSize: "24px" }} />}
              color="#722ed1"
              isCurrency={false}
            />
          </Col>
          <Col xs={24} sm={12}>
            <StatCard
              title="Tổng số người dùng"
              value={getTotalValue("totalUsers")}
              icon={<UserOutlined style={{ fontSize: "24px" }} />}
              color="#fa8c16"
              isCurrency={false}
            />
          </Col>
        </Row>
      ) : (
        // Hiển thị thông tin chi tiết khi xem triển lãm cụ thể
        <Row gutter={[16, 16]} className="mb-5">
          <Col xs={24} sm={6}>
            <StatCard
              title="Tổng giá trị đăng ký"
              value={getTotalValue("registrationRevenue")}
              icon={<ShoppingOutlined style={{ fontSize: "24px" }} />}
              color="#1890ff"
              isCurrency={true}
            />
          </Col>
          <Col xs={24} sm={6}>
            <StatCard
              title="Tổng giá trị vé"
              value={getTotalValue("ticketRevenue")}
              icon={<TagOutlined style={{ fontSize: "24px" }} />}
              color="#13c2c2"
              isCurrency={true}
            />
          </Col>
          <Col xs={24} sm={6}>
            <StatCard
              title="Tổng giá trị tài trợ"
              value={getTotalValue("sponsorRevenue")}
              icon={<DollarOutlined style={{ fontSize: "24px" }} />}
              color="#722ed1"
              isCurrency={true}
            />
          </Col>
          <Col xs={24} sm={6}>
            <StatCard
              title="Tổng giá trị giải thưởng"
              value={getTotalValue("awardRevenue")}
              icon={<GiftOutlined style={{ fontSize: "24px" }} />}
              color="#fa8c16"
              isCurrency={true}
            />
          </Col>
        </Row>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card
          title={
            <h3 className="text-lg font-semibold">
              {selectedShow === "all"
                ? "Top 5 triển lãm theo lợi nhuận"
                : "Chi tiết triển lãm"}
            </h3>
          }
        >
          <div style={{ height: "400px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={filteredChartData}
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
                {isViewingSpecificShow && (
                  <>
                    <Bar
                      dataKey="registration"
                      name="Đăng ký"
                      fill="#1890ff"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="ticket"
                      name="Vé"
                      fill="#13c2c2"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="sponsor"
                      name="Tài trợ"
                      fill="#722ed1"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="award"
                      name="Giải thưởng"
                      fill="#fa8c16"
                      radius={[4, 4, 0, 0]}
                    />
                  </>
                )}
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
