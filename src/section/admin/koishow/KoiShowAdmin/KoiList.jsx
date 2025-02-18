import React, { useState, useEffect } from "react";
import {
  Table,
  Tag,
  Select,
  Input,
  Button,
  Popconfirm,
  Modal,
  Image,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
} from "@ant-design/icons";

const { Option } = Select;
const { Search } = Input;

function KoiList({ categoryId }) {
  const [data, setData] = useState([
    {
      id: "1",
      name: "Nguyen Van A",
      email: "nguyenvana@example.com",
      koiName: "Koi Kohaku 1",
      size: "20 cm",
      variety: "Kohaku",
      description: "A beautiful Kohaku koi with perfect patterns.",
      image:
        "https://plus.unsplash.com/premium_photo-1674278193319-44cf375aeeb9?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8a29pJTIwZmlzaHxlbnwwfDB8MHx8fDA%3D",
      video:
        "https://videos.pexels.com/video-files/856951/856951-hd_1920_1080_25fps.mp4",
      status: "Approved",
      categoryId: "1",
    },
    {
      id: "2",
      name: "Tran Thi B",
      email: "tranthib@example.com",
      koiName: "Koi Showa 1",
      size: "40 cm",
      variety: "Showa",
      description: "A stunning Showa koi with vibrant colors.",
      image:
        "https://plus.unsplash.com/premium_photo-1674278193319-44cf375aeeb9?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8a29pJTIwZmlzaHxlbnwwfDB8MHx8fDA%3D",
      video: "https://www.example.com/video2",
      status: "Pending",
      categoryId: "2",
    },
    {
      id: "3",
      name: "Le Van C",
      email: "levanc@example.com",
      koiName: "Koi Sanke 1",
      size: "35 cm",
      variety: "Sanke",
      description: "A young Sanke koi with great potential.",
      image:
        "https://plus.unsplash.com/premium_photo-1674278193319-44cf375aeeb9?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8a29pJTIwZmlzaHxlbnwwfDB8MHx8fDA%3D",
      video: "https://www.example.com/video3",
      status: "Rejected",
      categoryId: "1",
    },
  ]);

  const [filteredData, setFilteredData] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(categoryId || "");
  const [filterVariety, setFilterVariety] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");

  // Lọc dữ liệu dựa trên categoryId và searchText
  useEffect(() => {
    let filtered = data;

    if (selectedCategory) {
      filtered = filtered.filter(
        (item) => item.categoryId === selectedCategory
      );
    }

    if (searchText) {
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(searchText.toLowerCase()) ||
          item.koiName.toLowerCase().includes(searchText.toLowerCase()) ||
          item.variety.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (filterVariety) {
      filtered = filtered.filter((item) => item.variety === filterVariety);
    }

    if (filterStatus) {
      filtered = filtered.filter((item) => item.status === filterStatus);
    }

    setFilteredData(filtered);
  }, [selectedCategory, searchText, filterVariety, filterStatus, data]);

  const handleStatusChange = (value, recordId) => {
    const updatedData = data.map((item) =>
      item.id === recordId ? { ...item, status: value } : item
    );
    setData(updatedData);
  };

  const handleDelete = (recordId) => {
    const updatedData = data.filter((item) => item.id !== recordId);
    setData(updatedData);
  };

  const handleVideoClick = (url) => {
    setVideoUrl(url);
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setVideoUrl("");
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      width: 130,
    },
    {
      title: "Koi Name",
      dataIndex: "koiName",
      key: "koiName",
      width: 120,
    },
    {
      title: "Size",
      dataIndex: "size",
      key: "size",
      width: 80,
    },
    {
      title: "Variety",
      dataIndex: "variety",
      key: "variety",
      filters: [
        { text: "Kohaku", value: "Kohaku" },
        { text: "Showa", value: "Showa" },
        { text: "Sanke", value: "Sanke" },
      ],
      onFilter: (value, record) => record.variety === value,
    },

    {
      title: "Description",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Image",
      dataIndex: "image",
      key: "image",
      render: (image) => (
        <Image
          src={image}
          alt="Koi"
          style={{ width: 100, objectFit: "cover" }}
          className="rounded-md"
        />
      ),
    },
    {
      title: "Video",
      dataIndex: "video",
      key: "video",
      render: (video, record) => (
        <div onClick={() => handleVideoClick(video)}>
          {" "}
          {/* Click để mở modal */}
          <Button
            icon={<PlayCircleOutlined />}
            style={{
              position: "absolute",
              top: "46%",
              left: "50%",
              width: 50,
              height: 35,
              transform: "translate(-50%, -50%)",
            }}
            onClick={() => handleVideoClick(video)}
          ></Button>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status, record) => {
        let color = "";
        if (status === "Approved") color = "green";
        else if (status === "Pending") color = "orange";
        else if (status === "Rejected") color = "red";

        return (
          <Select
            value={status}
            onChange={(value) => handleStatusChange(value, record.id)}
            style={{ width: 120 }}
          >
            <Option value="Approved" style={{ color: "green" }}>
              Approved
            </Option>
            <Option value="Pending" style={{ color: "orange" }}>
              Pending
            </Option>
            <Option value="Rejected" style={{ color: "red" }}>
              Rejected
            </Option>
          </Select>
        );
      },
      filters: [
        { text: "Approved", value: "Approved" },
        { text: "Pending", value: "Pending" },
        { text: "Rejected", value: "Rejected" },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <div className="flex items-center space-x-2">
          <Button
            type="text"
            icon={<EditOutlined />}
            className="text-gray-500 hover:text-blue-500"
          />
          <Popconfirm
            title="Are you sure to delete this koi?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="text"
              icon={<DeleteOutlined />}
              className="text-gray-500 hover:text-red-500"
              danger
            />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
        <Search
          placeholder="Search Koi..."
          onSearch={(value) => setSearchText(value)}
          allowClear
          className="w-full md:w-1/3 mb-2 md:mb-0"
        />
      </div>

      <Table
        columns={columns}
        dataSource={filteredData}
        pagination={{ pageSize: 5 }}
        rowKey="id"
      />

      {/* Modal Video */}
      <Modal
        title="Video"
        visible={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={800}
      >
        <video width="100%" controls>
          <source src={videoUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </Modal>
    </div>
  );
}

export default KoiList;
