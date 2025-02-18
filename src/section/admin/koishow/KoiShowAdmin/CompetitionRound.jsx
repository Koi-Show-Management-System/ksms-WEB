import React, { useState } from "react";
import { Table, Tag, Space, Select, Row, Col } from "antd";

const { Option } = Select;

const competitionData = [
  {
    key: "1",
    entryNumber: "SW-001",
    image:
      "https://cdn.pixabay.com/photo/2021/04/04/05/43/animal-6149183_640.jpg",
    size: "23 cm",
    variety: "Showa",
    result: "Pass",
    status: "Complete",
  },
  {
    key: "2",
    entryNumber: "SW-002",
    image:
      "https://cdn.pixabay.com/photo/2018/08/19/18/29/carp-3617292_640.jpg",
    size: "35 cm",
    variety: "Showa",
    result: "Pass",
    status: "Complete",
  },
  {
    key: "3",
    entryNumber: "SW-003",
    image:
      "https://cdn.pixabay.com/photo/2018/03/28/01/12/nature-3267971_640.jpg",
    size: "23 cm",
    variety: "Showa",
    result: "Pass",
    status: "Complete",
  },
  {
    key: "4",
    entryNumber: "SW-004",
    image: "https://cdn.pixabay.com/photo/2019/08/20/09/22/koi-4418256_640.jpg",
    size: "23 cm",
    variety: "Showa",
    result: "Fail",
    status: "Complete",
  },
  {
    key: "5",
    entryNumber: "SW-005",
    image:
      "https://cdn.pixabay.com/photo/2020/06/04/20/25/koi-fish-5260406_640.jpg",
    size: "23 cm",
    variety: "Showa",
    result: "Fail",
    status: "Notcomplete",
  },
];

const categories = ["Mini Kohaku	", "Standard Showa	", "Premium Taisho Sanke	"];
const mainRounds = ["Vòng Sơ Khảo", "Vòng Đánh Giá Chính", "Vòng Chung Kết"];
const subRounds = ["Round 1", "Round 2"];

function CompetitionRound() {
  const [category, setCategory] = useState(categories[0]);
  const [mainRound, setMainRound] = useState(mainRounds[0]);
  const [subRound, setSubRound] = useState(subRounds[0]);

  const handleCategoryChange = (value) => setCategory(value);
  const handleMainRoundChange = (value) => setMainRound(value);
  const handleSubRoundChange = (value) => setSubRound(value);

  const columns = [
    {
      title: "Top",
      dataIndex: "key",
      render: (text, record, index) => (
        <span style={{ color: "blue" }}>{`#${index + 1}`}</span>
      ),
    },
    {
      title: "Registration Number",
      dataIndex: "entryNumber",
      width: 180,
    },
    {
      title: "Image",
      dataIndex: "image",
      render: (text) => (
        <img
          src={text}
          alt="Entry"
          width="50"
          height="50"
          className="rounded-md"
        />
      ),
    },
    {
      title: "Size",
      dataIndex: "size",
    },
    {
      title: "Variety",
      dataIndex: "variety",
    },
    {
      title: "Result",
      dataIndex: "result",
      render: (result) => (
        <Tag color={result === "Pass" ? "green" : "red"}>{result}</Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status) => (
        <Tag color={status === "Complete" ? "green" : "red"}>{status}</Tag>
      ),
    },
  ];

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <Row gutter={16}>
        <Col span={8}>
          <div className="mb-4">
            <span className="block text-lg font-medium">Category:</span>
            <Select
              value={category}
              onChange={handleCategoryChange}
              style={{ width: "100%" }}
              className="border rounded-md"
            >
              {categories.map((category) => (
                <Option key={category} value={category}>
                  {category}
                </Option>
              ))}
            </Select>
          </div>
        </Col>

        <Col span={8}>
          <div className="mb-4">
            <span className="block text-lg font-medium">Main Round:</span>
            <Select
              value={mainRound}
              onChange={handleMainRoundChange}
              style={{ width: "100%" }}
              className="border rounded-md"
            >
              {mainRounds.map((round) => (
                <Option key={round} value={round}>
                  {round}
                </Option>
              ))}
            </Select>
          </div>
        </Col>

        {mainRound === "Vòng Đánh Giá Chính" && (
          <Col span={8}>
            <div className="mb-4">
              <span className="block text-lg font-medium">Sub-round:</span>
              <Select
                value={subRound}
                onChange={handleSubRoundChange}
                style={{ width: "100%" }}
                className="border rounded-md"
              >
                {subRounds.map((round) => (
                  <Option key={round} value={round}>
                    {round}
                  </Option>
                ))}
              </Select>
            </div>
          </Col>
        )}
      </Row>

      <Table columns={columns} dataSource={competitionData} />
    </div>
  );
}

export default CompetitionRound;
