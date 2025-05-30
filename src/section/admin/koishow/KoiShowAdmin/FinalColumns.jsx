import React from "react";
import {
  Tag,
  Button,
  Space,
  Tooltip,
  Image,
  Skeleton,
  Select,
  Typography,
} from "antd";
import { EyeOutlined, StarFilled } from "@ant-design/icons";

// Placeholder image for missing images
const PLACEHOLDER_IMAGE = "https://placehold.co/70x50/eee/ccc?text=No+Image";

const { Option } = Select;

// Hàm tạo columns cho vòng đánh giá chính
export const getFinalColumns = (props) => {
  const {
    handleViewDetails,
    loadingImages,
    allTanksAssigned,
    isRoundPublished,
    assigningTank,
    competitionRoundTanks,
    handleTankChange,
    criteria = [],
    hasTank = false,
  } = props;

  // Keep using the existing columns structure, but don't add criteria columns
  const columns = [
    {
      title: "Top",
      dataIndex: ["rank"],
      width: 60,
      responsive: ["md"],
      render: (rank) => (
        <span style={{ color: "blue", fontWeight: "bold" }}>
          {rank ? `#${rank}` : "_"}
        </span>
      ),
      sorter: (a, b) => {
        // Handle null/undefined values for sorting
        const rankA = a.rank || Number.MAX_VALUE;
        const rankB = b.rank || Number.MAX_VALUE;
        return rankA - rankB;
      },
    },
    {
      title: "Mã Đăng Ký",
      dataIndex: ["registration", "registrationNumber"],
      key: "registrationCode",
      render: (registrationNumber) => {
        return registrationNumber || "—";
      },
      sorter: (a, b) => {
        const regNumA = a.registration?.registrationNumber || "";
        const regNumB = b.registration?.registrationNumber || "";
        return regNumA.localeCompare(regNumB);
      },
    },
    {
      title: "Hình ảnh",
      dataIndex: ["registration", "koiMedia"],
      key: "image",
      width: 90,
      render: (koiMedia, record) => {
        const imageMedia =
          koiMedia && koiMedia.length > 0
            ? koiMedia.find((item) => item.mediaType === "Image")
            : null;

        const imageUrl = imageMedia ? imageMedia.mediaUrl : null;

        return (
          <div className="w-[70px] h-[50px] bg-gray-100 flex items-center justify-center rounded-md overflow-hidden">
            {loadingImages[record.id] ? (
              <Skeleton.Image active style={{ width: 70, height: 50 }} />
            ) : (
              <Image
                src={imageUrl || PLACEHOLDER_IMAGE}
                alt="Hình cá"
                width={70}
                height={50}
                className="object-cover"
                preview={{
                  src: imageMedia?.mediaUrl,
                  mask: <div className="text-xs">Xem</div>,
                }}
                placeholder={
                  <div className="w-full h-full flex items-center justify-center bg-gray-200">
                    <Skeleton.Image />
                  </div>
                }
                fallback={PLACEHOLDER_IMAGE}
              />
            )}
          </div>
        );
      },
    },
    {
      title: "Kích thước",
      dataIndex: ["registration", "koiSize"],
      key: "size",
      responsive: ["md"],
      render: (size) => (size ? `${size} cm` : "—"),
    },
    {
      title: "Giống",
      dataIndex: ["registration", "koiProfile", "variety", "name"],
      key: "variety",
      ellipsis: true,
      responsive: ["lg"],
      render: (name) => name || "—",
    },
    {
      title: "Điểm",
      dataIndex: ["roundResults", "0", "totalScore"],
      key: "score",
      render: (totalScore) => {
        if (totalScore === undefined || totalScore === null) return "—";
        return (
          <Tooltip title="Điểm tổng">
            <Tag color="blue" style={{ fontSize: "14px", fontWeight: "bold" }}>
              {totalScore.toFixed(2)}
            </Tag>
          </Tooltip>
        );
      },
    },
    // Kết quả
    {
      title: "Kết quả",
      dataIndex: ["roundResults", "0", "status"],
      key: "result",
      width: 90,
      render: (status) => {
        if (!status) return <Tag color="gray">Chưa có</Tag>;

        return (
          <Tag color={status === "Pass" ? "success" : "error"}>
            {status === "Pass" ? "Đạt" : "Không đạt"}
          </Tag>
        );
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status) => {
        let color = "blue";
        let text = status;

        switch (status) {
          case "unpublic":
            color = "gray";
            text = "Chưa công khai";
            break;
          case "public":
            color = "green";
            text = "Đã công khai";
            break;
          case "pending":
            color = "orange";
            text = "Đang chờ";
            break;
          default:
            text = status || "—";
        }

        return <Tag color={color}>{text}</Tag>;
      },
    },
  ];

  // Chỉ thêm cột "Bể" khi hạng mục có sử dụng bể
  if (hasTank) {
    columns.push({
      title: "Bể",
      dataIndex: "tankName",
      key: "tankName",
      width: 90,
      render: (tankName, record) => {
        // Try to find the matching tank ID by comparing names
        let tankIdToUse = record.tankId;

        // If no tankId but we have a name, try to find the ID from the name
        if (!tankIdToUse && tankName) {
          // Find the matching tank
          const matchingTank = competitionRoundTanks?.find(
            (tank) =>
              tank.name === tankName || // Exact match
              `Bể ${tank.name}` === tankName || // "Bể X" format
              tank.name === tankName.replace("Bể ", "") || // Remove "Bể " prefix
              tank.id === tankName.replace("Bể ", "") // Compare with ID
          );

          if (matchingTank) {
            tankIdToUse = matchingTank.id;
          }
        }

        // Kiểm tra nếu đã công khai vòng thi thì chỉ hiển thị tên bể, không cho chọn
        if (record.status === "public") {
          return <Typography.Text>{tankName || "Chưa gán bể"}</Typography.Text>;
        }

        return (
          <div className="relative">
            <Select
              style={{ width: "100%" }}
              value={tankIdToUse}
              onChange={(value) => {
                console.log("Selecting tank ID:", value);
                handleTankChange(record.id, value);
              }}
              loading={assigningTank[record.id]}
              disabled={assigningTank[record.id] || record.status === "public"}
              placeholder="Chọn bể"
              showSearch
              optionFilterProp="children"
              status={
                !(tankName || tankIdToUse) && !isRoundPublished
                  ? "error"
                  : undefined
              }
              dropdownMatchSelectWidth={false}
            >
              {competitionRoundTanks?.map((tank) => (
                <Option key={tank.id} value={tank.id}>
                  {tank.name}
                </Option>
              ))}
            </Select>
          </div>
        );
      },
    });
  }

  columns.push({
    title: "Hành động",
    key: "action",
    fixed: "right",
    width: 70,
    render: (_, record) => (
      <Button
        type="text"
        icon={<EyeOutlined />}
        className="text-gray-500 hover:text-blue-500"
        onClick={() => handleViewDetails(record)}
      />
    ),
  });

  return columns;
};
