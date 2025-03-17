import React, { useState } from "react";
import { Card, Row, Col, Select } from "antd";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
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

const { Option } = Select;

const Overview = () => {
  const [selectedShow, setSelectedShow] = useState("all");

  const showData = {
    "Triển lãm Koi lớn": {
      competitions: 2,
      users: 8,
      koiFish: 35,
      revenue: 4000000,
      refund: 500000,
      profit: 3500000,
    },
    "Triển lãm Koi cao cấp": {
      competitions: 1,
      users: 10,
      koiFish: 40,
      revenue: 5000000,
      refund: 300000,
      profit: 4700000,
    },
    "Tìm kiếm Koi hiếm": {
      competitions: 2,
      users: 7,
      koiFish: 30,
      revenue: 4500000,
      refund: 400000,
      profit: 4100000,
    },
    "Lễ hội Koi mùa xuân": {
      competitions: 1,
      users: 5,
      koiFish: 25,
      revenue: 3000000,
      refund: 200000,
      profit: 2800000,
    },
    "Triển lãm Koi thiên đường": {
      competitions: 2,
      users: 8,
      koiFish: 36,
      revenue: 3500000,
      refund: 250000,
      profit: 3250000,
    },
    "Giải Koi nhiệt đới": {
      competitions: 2,
      users: 5,
      koiFish: 25,
      revenue: 2000000,
      refund: 150000,
      profit: 1850000,
    },
  };

  const revenueData = Object.entries(showData).map(([name, data]) => ({
    name,
    revenue: data.revenue,
    refund: data.refund,
    profit: data.profit,
  }));

  const profitDistributionData = Object.entries(showData).map(
    ([name, data]) => ({
      name,
      value: data.profit,
    })
  );

  const filteredProfitData =
    selectedShow === "all"
      ? profitDistributionData
      : [
          {
            name: selectedShow,
            value: showData[selectedShow].profit,
          },
        ];

  function getTotalValue(key) {
    if (selectedShow === "all") {
      return Object.values(showData).reduce((sum, data) => sum + data[key], 0);
    }
    return showData[selectedShow][key];
  }

  function getTotalProfit() {
    return Object.values(showData).reduce((sum, data) => sum + data.profit, 0);
  }

  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#A28BEA",
    "#FF6699",
  ];

  const StatCard = ({ title, value, icon, color }) => (
    <Card className="hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 mb-1 text-sm">{title}</p>
          <p className="text-2xl font-bold" style={{ color: color }}>
            {value}
          </p>
        </div>
        <div
          className="p-3 rounded-full"
          style={{
            backgroundColor: `${color}15`,
            color: color,
          }}
        >
          {icon}
        </div>
      </div>
    </Card>
  );

  const filteredRevenueData =
    selectedShow === "all"
      ? revenueData
      : [revenueData.find((item) => item.name === selectedShow)];

  return (
    <div>
      <div className="mb-6">
        <Select
          style={{ width: 300 }}
          placeholder="Chọn một triển lãm"
          onChange={(value) => setSelectedShow(value)}
          defaultValue="all"
        >
          <Option value="all">Tất cả các triển lãm</Option>
          {Object.keys(showData).map((show) => (
            <Option key={show} value={show}>
              {show}
            </Option>
          ))}
        </Select>
      </div>

      <Row gutter={[24, 24]} className="mb-6">
        <Col xs={24} sm={12} lg={8}>
          <StatCard
            title="Số lượng cuộc thi"
            value={getTotalValue("competitions")}
            icon={<TrophyOutlined style={{ fontSize: "24px" }} />}
            color="#1890ff"
          />
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <StatCard
            title="Tổng số người dùng"
            value={getTotalValue("users")}
            icon={<UserOutlined style={{ fontSize: "24px" }} />}
            color="#52c41a"
          />
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <StatCard
            title="Tổng số Koi"
            value={getTotalValue("koiFish")}
            icon={<GoldOutlined style={{ fontSize: "24px" }} />}
            color="#722ed1"
          />
        </Col>
      </Row>

      <Row gutter={[24, 24]} className="mb-6">
        <Col xs={24} sm={12} lg={8}>
          <StatCard
            title="Tổng doanh thu"
            value={`${getTotalValue("revenue").toLocaleString()} đ`}
            icon={<DollarOutlined style={{ fontSize: "24px" }} />}
            color="#13c2c2"
          />
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <StatCard
            title="Hoàn trả"
            value={`${getTotalValue("refund").toLocaleString()} đ`}
            icon={<RollbackOutlined style={{ fontSize: "24px" }} />}
            color="#f5222d"
          />
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <StatCard
            title="Lợi nhuận ròng"
            value={`${getTotalValue("profit").toLocaleString()} đ`}
            icon={<LineChartOutlined style={{ fontSize: "24px" }} />}
            color="#faad14"
          />
        </Col>
      </Row>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-lg" styles={{ body: { padding: "20px" } }}>
          <h3 className="text-lg font-semibold text-center mb-4">
            Biểu đồ doanh thu
          </h3>
          <div style={{ height: "300px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredRevenueData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="#0088FE" name="Doanh thu" />
                <Bar dataKey="refund" fill="#FF8042" name="Hoàn trả" />
                <Bar dataKey="profit" fill="#00C49F" name="Lợi nhuận" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="shadow-lg" styles={{ body: { padding: "20px" } }}>
          <h3 className="text-lg font-semibold text-center mb-4">
            Phân phối lợi nhuận theo cuộc thi
          </h3>
          <div style={{ height: "300px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={filteredProfitData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={100}
                  fill="#8884d8"
                  label={({ name, percent }) =>
                    `(${(percent * 100).toFixed(1)}%)`
                  }
                >
                  {filteredProfitData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Overview;
