import React, { useState } from "react";
import { Table, Tag, Space, Select, Row, Col } from "antd";

const { Option } = Select;

const competitionData = [
  {
    key: "1",
    entryNumber: "SW-001",
    image:
      "https://cdn.pixabay.com/photo/2018/08/19/18/29/carp-3617292_640.jpg",

    size: "53 cm",
    variety: "Taisho Sanke",
    category: "Standard Showa",
    totalVote: 200,
    status: "Complete",
  },
  {
    key: "2",
    entryNumber: "TC-005",
    image:
      "https://cdn.pixabay.com/photo/2021/04/04/05/43/animal-6149183_640.jpg",

    size: "58 cm",
    variety: "Showa",
    category: "Mini Kohaku",
    totalVote: 180,
    status: "Complete",
  },
  {
    key: "3",
    entryNumber: "KH-004",
    image:
      "https://cdn.pixabay.com/photo/2018/03/28/01/12/nature-3267971_640.jpg",

    size: "60 cm",
    variety: "Kohaku",
    category: "Premium Taisho Sanke",
    totalVote: 150,
    status: "Complete",
  },
  {
    key: "4",
    entryNumber: "SW-004",
    image:
      "https://cdn.pixabay.com/photo/2020/06/04/20/25/koi-fish-5260406_640.jpg",

    size: "62 cm",
    variety: "Showa",
    category: "Mini Kohaku",
    totalVote: 120,
    status: "Complete",
  },
  {
    key: "5",
    entryNumber: "SW-005",
    image: "https://cdn.pixabay.com/photo/2019/08/20/09/22/koi-4418256_640.jpg",
    size: "65 cm",
    variety: "Kohaku",
    category: "Standard Showa",
    totalVote: 100,
    status: "Notcomplete",
  },
];

function Votes() {
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
      title: "Total Vote",
      dataIndex: "totalVote",
      render: (totalVote) => <span>{totalVote}</span>,
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
      <Table columns={columns} dataSource={competitionData} />
    </div>
  );
}

export default Votes;
