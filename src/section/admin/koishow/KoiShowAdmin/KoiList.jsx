import React, { useState, useEffect } from "react";
import {
  Table,
  Select,
  Input,
  Button,
  Popconfirm,
  Modal,
  Image,
  Col,
  Row,
  Card,
} from "antd";
import { EditOutlined, DeleteOutlined, EyeOutlined } from "@ant-design/icons";

const { Option } = Select;
const { Search } = Input;
const categories = ["Mini Kohaku", "Standard Showa", "Premium Taisho Sanke"];

function KoiList({ categoryId }) {
  const [data, setData] = useState([
    {
      id: "1",
      name: "Nguyen Van A",
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
      category: "Mini Kohaku",
    },
    {
      id: "2",
      name: "Tran Thi B",
      koiName: "Koi Showa 1",
      size: "30 cm",
      variety: "Showa",
      description: "A stunning Showa koi with vibrant colors.",
      image:
        "https://plus.unsplash.com/premium_photo-1674278193319-44cf375aeeb9?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8a29pJTIwZmlzaHxlbnwwfDB8MHx8fDA%3D",
      video: "https://www.example.com/video2",
      status: "Pending",
      categoryId: "2",
      category: "Standard Showa",
    },
    {
      id: "3",
      name: "Le Van C",
      koiName: "Koi Sanke 1",
      size: "40 cm",
      variety: "Sanke",
      description: "A young Sanke koi with great potential.",
      image:
        "https://plus.unsplash.com/premium_photo-1674278193319-44cf375aeeb9?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8a29pJTIwZmlzaHxlbnwwfDB8MHx8fDA%3D",
      video: "https://www.example.com/video3",
      status: "Rejected",
      categoryId: "1",
      category: "Premium Taisho Sanke",
    },
  ]);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentKoi, setCurrentKoi] = useState(null);

  const handleViewDetails = (record) => {
    setCurrentKoi(record);
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setCurrentKoi(null);
  };

  const handleApproveReject = (status) => {
    const updatedData = data.map((item) =>
      item.id === currentKoi.id ? { ...item, status } : item
    );
    setData(updatedData);
    setIsModalVisible(false); // Close the modal after update
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
    },
    {
      title: "Koi Name",
      dataIndex: "koiName",
      key: "koiName",
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
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
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        let statusClass = "";
        if (status === "Approved") statusClass = "text-green-600 font-bold";
        else if (status === "Pending")
          statusClass = "text-yellow-600 font-bold";
        else if (status === "Rejected") statusClass = "text-red-600 font-bold";

        return <span className={statusClass}>{status}</span>;
      },
    },

    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <div className="flex items-center space-x-2">
          <Button
            type="text"
            icon={<EyeOutlined />}
            className="text-gray-500 hover:text-blue-500"
            onClick={() => handleViewDetails(record)}
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
      <Table
        columns={columns}
        dataSource={data}
        pagination={{ pageSize: 5 }}
        rowKey="id"
      />

      <Modal
        title={currentKoi ? `${currentKoi.koiName} Details` : "Koi Details"}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={900}
      >
        {currentKoi && (
          <div className="p-4">
            <Row gutter={[16, 16]}>
              {/* Koi Information - Top Section */}
              <Card title="Koi Information" bordered={false} className="w-full">
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <h4>
                      <strong>Name:</strong> {currentKoi.name}
                    </h4>
                    <p>
                      <strong>Koi Name:</strong> {currentKoi.koiName}
                    </p>
                    <p>
                      <strong>Size:</strong> {currentKoi.size}
                    </p>
                    <p>
                      <strong>Variety:</strong> {currentKoi.variety}
                    </p>
                  </Col>
                  <Col span={12}>
                    <p>
                      <strong>Description:</strong> {currentKoi.description}
                    </p>
                    <p>
                      <strong>Category:</strong> {currentKoi.category}
                    </p>
                    <p>
                      <strong>Status:</strong>
                      <span
                        className={`ml-2 font-bold 
      ${currentKoi.status === "Approved" ? "text-green-600" : ""}
      ${currentKoi.status === "Pending" ? "text-yellow-600" : ""}
      ${currentKoi.status === "Rejected" ? "text-red-600" : ""}`}
                      >
                        {currentKoi.status}
                      </span>
                    </p>
                  </Col>
                </Row>
              </Card>

              <Card title="Media" bordered={false} className="w-full">
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Image
                      src={currentKoi.image}
                      alt="Koi"
                      className="w-full  object-cover"
                      style={{ height: "210px" }}
                    />
                  </Col>
                  <Col span={12}>
                    <video className="w-full h-[210px] object-cover" controls>
                      <source src={currentKoi.video} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  </Col>
                </Row>
              </Card>
            </Row>

            {/* Approve/Reject Buttons */}
            <div className="mt-4 text-center space-x-3">
              <Button
                type="primary"
                onClick={() => handleApproveReject("Approved")}
                className="bg-green-600 hover:bg-green-700 border-green-600 hover:border-green-700 text-white font-bold w-36"
              >
                Approve
              </Button>

              <Button
                type="primary"
                danger
                onClick={() => handleApproveReject("Rejected")}
                className="bg-red-600 hover:bg-red-700 border-red-600 hover:border-red-700 text-white font-bold w-36"
              >
                Reject
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default KoiList;
