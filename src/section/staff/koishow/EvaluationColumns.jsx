import React from "react";
import { Tag, Button, Space, Tooltip, Image, Skeleton, Select } from "antd";
import { EyeOutlined, StarFilled } from "@ant-design/icons";

// Placeholder image for missing images
const PLACEHOLDER_IMAGE = "https://placehold.co/70x50/eee/ccc?text=No+Image";

// Các tiêu chí đánh giá cho vòng Đánh Giá Chính
const evaluationCriteria = [
  { key: "skin", name: "Da" },
  { key: "pattern", name: "Họa tiết" },
  { key: "body", name: "Thân hình" },
  { key: "fins", name: "Vây" },
  { key: "overall", name: "Tổng thể" }
];

// Hàm tạo columns cho vòng đánh giá chính
export const getEvaluationColumns = (props) => {
  const { 
    handleViewDetails, 
    loadingImages, 
    allTanksAssigned, 
    isRoundPublished,
    assigningTank, 
    competitionRoundTanks,
    handleTankChange
  } = props;

  return [
    {
      title: "#",
      dataIndex: "index",
      key: "index",
      width: 50,
      render: (_, __, index) => <strong>#{index + 1}</strong>,
    },
    {
      title: "Mã Đăng Ký",
      dataIndex: ["registration", "registrationCode"],
      key: "registrationCode",
      width: 130,
    },
    {
      title: "Hình ảnh",
      dataIndex: ["registration", "koiMedia"],
      key: "image",
      width: 120,
      render: (koiMedia, record) => {
        const imageMedia = koiMedia && koiMedia.length > 0
          ? koiMedia.find((item) => item.mediaType === "Image")
          : null;
        
        const imageUrl = imageMedia ? imageMedia.mediaUrl : null;
        
        return (
          <div style={{ position: "relative", height: "50px", width: "70px" }}>
            {loadingImages[record.id] ? (
              <Skeleton.Image active style={{ width: 70, height: 50 }} />
            ) : (
              <Image
                src={imageUrl || PLACEHOLDER_IMAGE}
                alt="Koi Image"
                style={{
                  height: "50px",
                  width: "70px",
                  objectFit: "cover",
                  borderRadius: "4px",
                }}
                fallback={PLACEHOLDER_IMAGE}
                preview={!!imageUrl}
              />
            )}
          </div>
        );
      },
    },
    {
      title: "Kích thước",
      dataIndex: ["registration", "size"],
      key: "size",
      width: 120,
      render: (size) => (size ? `${size} cm` : "—"),
    },
    {
      title: "Giống",
      dataIndex: ["registration", "variety"],
      key: "variety",
      width: 130,
    },
    {
      title: "Bể",
      dataIndex: "tankName",
      key: "tankName",
      width: 150,
      render: (tankName, record) => (
        <div>
          {allTanksAssigned || isRoundPublished ? (
            tankName || "Chưa gán bể"
          ) : (
            <div className="min-w-[120px]">
              <Select
                style={{ width: "100%" }}
                value={record.tankId || undefined}
                onChange={(value) => handleTankChange(record.id, value)}
                loading={assigningTank[record.id]}
                placeholder="Chọn bể"
              >
                {competitionRoundTanks?.map((tank) => (
                  <Option key={tank.id} value={tank.id}>
                    {tank.name}
                  </Option>
                ))}
              </Select>
            </div>
          )}
        </div>
      ),
    },
    // Điểm trung bình
    {
      title: "Điểm",
      dataIndex: ["roundResults", "0", "score"],
      key: "score",
      width: 80,
      render: (score) => {
        if (score === undefined || score === null) return "—";
        return (
          <Tooltip title="Điểm trung bình">
            <Tag color="blue" style={{ fontSize: "14px", fontWeight: "bold" }}>
              {score.toFixed(1)}
            </Tag>
          </Tooltip>
        );
      },
    },
    // Điểm từng tiêu chí
    ...evaluationCriteria.map(criterion => ({
      title: criterion.name,
      dataIndex: ["roundResults", "0", "details", criterion.key],
      key: criterion.key,
      width: 80,
      render: (score) => {
        if (score === undefined || score === null) return "—";
        return (
          <div className="flex items-center">
            <StarFilled style={{ color: "#fadb14", marginRight: 4 }} />
            <span>{score.toFixed(1)}</span>
          </div>
        );
      },
    })),
    // Kết quả
    {
      title: "Kết quả",
      dataIndex: ["roundResults", "0", "status"],
      key: "result",
      width: 100,
      render: (status) => {
        if (!status) return "—";
        
        return (
          <Tag color={status === "Pass" ? "success" : "error"}>
            {status === "Pass" ? "Đạt" : "Không đạt"}
          </Tag>
        );
      }
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (status) => {
        let color =
          status === "public"
            ? "green"
            : status === "unpublic"
              ? "gray"
              : status === "pending"
                ? "orange"
                : "default";

        let text =
          status === "public"
            ? "Đã công khai"
            : status === "unpublic"
              ? "Chưa công khai"
              : status === "pending"
                ? "Đang chờ"
                : status || "—";

        return (
          <Tag color={color} key={status}>
            {text}
          </Tag>
        );
      },
    },
    {
      title: "Hành động",
      key: "action",
      fixed: "right",
      width: 100,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
          >
            Chi tiết
          </Button>
        </Space>
      ),
    },
  ];
}; 