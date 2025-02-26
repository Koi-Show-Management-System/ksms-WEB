import React from "react";
import { Input, Button, Card, Tag } from "antd";
import { SearchOutlined, PlusOutlined } from "@ant-design/icons";

const News = () => {
  const newsItem = {
    id: 1,
    title: "Cuộc thi Cá Koi 2025 - Một sự kiện đáng mong chờ",
    category: "Cuộc thi",
    date: "Ngày 20 tháng 8, 2022",
    image:
      "https://static.wixstatic.com/media/0fa26a_f753a8e165714f6bb735e80883d0aad2~mv2.png/v1/fit/w_1000,h_1000,al_c,q_80/file.png",
    tag: "koi",
  };

  return (
    <div>
      <div className="flex gap-4 mb-8">
        <Input
          placeholder="Tìm kiếm..."
          prefix={<SearchOutlined className="text-gray-400" />}
          className="flex-1"
          size="large"
        />
        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          className="bg-blue-500 hover:bg-blue-600"
        >
          Tạo mới
        </Button>
      </div>

      <Card
        hoverable
        className="max-w-sm"
        cover={
          <img
            alt="Cuộc thi Cá Koi"
            src={newsItem.image}
            className="h-64 object-cover"
          />
        }
      >
        <div className="flex items-center justify-between mb-2">
          <Tag className="text-white bg-blue-500 border-0 rounded-full ">
            {newsItem.category}
          </Tag>
          <span className="text-gray-500 text-sm">{newsItem.date}</span>
        </div>
        <h2 className="text-xl font-semibold mb-3">{newsItem.title}</h2>
        <div className="bg-gray-100 border-0 rounded-full w-1/4 text-center p-2">
          Chỉnh sửa
        </div>
      </Card>
    </div>
  );
};

export default News;
