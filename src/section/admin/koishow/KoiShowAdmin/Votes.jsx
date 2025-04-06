import React, { useState, useEffect } from "react";
import {
  Table,
  Tag,
  Button,
  Modal,
  Form,
  Space,
  DatePicker,
  notification,
  Drawer,
  Descriptions,
  Tabs,
  Card,
} from "antd";
import {
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PictureOutlined,
  InfoCircleOutlined,
  TrophyOutlined,
  UserOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import useVote from "../../../../hooks/useVote";
import moment from "moment";

const { TabPane } = Tabs;

// Countdown component for time remaining
const CountdownTimer = ({ endTime, onTimerEnd }) => {
  const [timeRemaining, setTimeRemaining] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0,
  });

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const end = new Date(endTime).getTime();
      const total = end - now;

      if (total <= 0) {
        if (onTimerEnd) onTimerEnd();
        return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
      }

      const days = Math.floor(total / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (total % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((total % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((total % (1000 * 60)) / 1000);

      return { days, hours, minutes, seconds, total };
    };

    setTimeRemaining(calculateTimeRemaining());

    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining();
      setTimeRemaining(remaining);

      if (remaining.total <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime, onTimerEnd]);

  return (
    <div className="flex items-center gap-1">
      <ClockCircleOutlined className="mr-1" />
      <span className="font-medium">
        {timeRemaining.days > 0 && `${timeRemaining.days} ngày `}
        {String(timeRemaining.hours).padStart(2, "0")}:
        {String(timeRemaining.minutes).padStart(2, "0")}:
        {String(timeRemaining.seconds).padStart(2, "0")}
      </span>
    </div>
  );
};

function Votes({ showId }) {
  const [isDetailDrawerVisible, setIsDetailDrawerVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [enableModal, setEnableModal] = useState(false);
  const [endTime, setEndTime] = useState(null);
  const [votingActive, setVotingActive] = useState(false);
  const [votingEndTime, setVotingEndTime] = useState(null);
  const [votingExpired, setVotingExpired] = useState(false);
  const {
    votes,
    loading,
    fetchVotes,
    UpdateEnableVoting,
    UpdateDisableVoting,
  } = useVote();

  useEffect(() => {
    if (showId) {
      fetchVotes(showId).then((data) => {
        // Assuming the API response includes voting status information
        // If not, you'll need to modify your API to include this information
        if (data && data.length > 0 && data[0].votingStatus) {
          setVotingActive(data[0].votingStatus.isActive || false);
          setVotingEndTime(data[0].votingStatus.endTime || null);
        }
      });
    }
  }, [showId]);

  // Check if voting period has ended and update state
  useEffect(() => {
    if (votingActive && votingEndTime) {
      const checkTime = () => {
        const now = new Date();
        const end = new Date(votingEndTime);
        if (now >= end) {
          setVotingActive(false);
          setVotingExpired(true);
        }
      };

      checkTime();
      const interval = setInterval(checkTime, 1000);

      return () => clearInterval(interval);
    }
  }, [votingActive, votingEndTime]);

  const showDetailDrawer = (record) => {
    setCurrentRecord(record);
    setIsDetailDrawerVisible(true);
  };

  const showEnableModal = () => {
    setEnableModal(true);
  };

  const handleEnableVoting = async () => {
    if (!endTime) {
      notification.error({
        message: "Lỗi",
        description: "Vui lòng chọn thời gian kết thúc",
        placement: "topRight",
      });
      return;
    }

    try {
      await UpdateEnableVoting(showId, endTime.toISOString());
      notification.success({
        message: "Thành công",
        description: "Bật bình chọn thành công",
        placement: "topRight",
      });
      setEnableModal(false);
      setVotingActive(true);
      setVotingEndTime(endTime);
      fetchVotes(showId);
    } catch (error) {
      notification.error({
        message: "Lỗi",
        description: "Lỗi khi bật bình chọn",
        placement: "topRight",
      });
    }
  };

  const handleDisableVoting = async () => {
    try {
      await UpdateDisableVoting(showId);
      notification.success({
        message: "Thành công",
        description: "Tắt bình chọn thành công",
        placement: "topRight",
      });
      setVotingActive(false);
      setVotingEndTime(null);
      setVotingExpired(false);
      fetchVotes(showId);
    } catch (error) {
      notification.error({
        message: "Lỗi",
        description: "Lỗi khi tắt bình chọn",
        placement: "topRight",
      });
    }
  };

  const columns = [
    {
      title: "Mã Đăng Ký",
      dataIndex: "registrationNumber",
      width: 140,
    },
    {
      title: "Hình ảnh",
      dataIndex: "koiMedia",
      render: (media) => {
        const image = media?.find((m) => m.mediaType === "Image");
        return image ? (
          <img
            src={image.mediaUrl}
            alt="Entry"
            width="70"
            height="50"
            className="rounded-md object-cover"
          />
        ) : (
          <div className="w-[50px] h-[50px] bg-gray-200 flex items-center justify-center">
            N/A
          </div>
        );
      },
    },
    {
      title: "Kích thước",
      dataIndex: "size",
      render: (size) => `${size} cm`,
    },
    {
      title: "Giống",
      dataIndex: "koiVariety",
    },
    {
      title: "Số Phiếu",
      dataIndex: "voteCount",
      width: 120,
      sorter: (a, b) => a.voteCount - b.voteCount,
    },
    {
      title: "Chủ sở hữu",
      dataIndex: "ownerName",
    },
    {
      title: "Bể",
      dataIndex: ["roundInfo", "tankNumber"],
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_, record) => (
        <Button
          type="text"
          className="text-gray-500 hover:text-blue-500"
          icon={<EyeOutlined />}
          onClick={() => showDetailDrawer(record)}
          size="small"
        />
      ),
    },
  ];

  // Render voting control buttons based on state
  const renderVotingControls = () => {
    if (votingActive) {
      return (
        <div className="flex items-center">
          <Tag color="green" className="mr-2">
            Bình chọn đang diễn ra
          </Tag>
          {votingEndTime && (
            <div className="flex flex-col">
              <CountdownTimer
                endTime={votingEndTime}
                onTimerEnd={() => {
                  setVotingActive(false);
                  setVotingExpired(true);
                }}
              />
            </div>
          )}
        </div>
      );
    } else if (
      votingExpired ||
      (votingEndTime && new Date() > new Date(votingEndTime))
    ) {
      return (
        <Button
          type="primary"
          danger
          icon={<CloseCircleOutlined />}
          onClick={handleDisableVoting}
        >
          Tắt bình chọn
        </Button>
      );
    } else {
      return (
        <Button
          type="primary"
          icon={<CheckCircleOutlined />}
          onClick={showEnableModal}
        >
          Bật bình chọn
        </Button>
      );
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-semibold">Quản lý bình chọn</h2>
        <Space>{renderVotingControls()}</Space>
      </div>

      <Table
        columns={columns}
        dataSource={votes}
        rowKey="registrationId"
        loading={loading}
      />

      {/* Detail Drawer */}
      <Drawer
        title={
          currentRecord?.koiName
            ? `Chi tiết: ${currentRecord.koiName}`
            : "Chi tiết cá Koi"
        }
        placement="right"
        width={720}
        onClose={() => setIsDetailDrawerVisible(false)}
        open={isDetailDrawerVisible}
      >
        {currentRecord && (
          <Tabs defaultActiveKey="1">
            <TabPane
              tab={
                <span>
                  <InfoCircleOutlined /> Thông tin chung
                </span>
              }
              key="1"
            >
              <Descriptions bordered column={1} className="mb-4">
                <Descriptions.Item label="Tên cá">
                  {currentRecord.koiName}
                </Descriptions.Item>
                <Descriptions.Item label="Mã đăng ký">
                  {currentRecord.registrationNumber}
                </Descriptions.Item>
                <Descriptions.Item label="Hạng mục">
                  {currentRecord.categoryName}
                </Descriptions.Item>
                <Descriptions.Item label="Giống">
                  {currentRecord.koiVariety}
                </Descriptions.Item>
                <Descriptions.Item label="Kích thước">
                  {currentRecord.size} cm
                </Descriptions.Item>
                <Descriptions.Item label="Tuổi">
                  {currentRecord.age} năm
                </Descriptions.Item>
                <Descriptions.Item label="Giới tính">
                  {currentRecord.gender}
                </Descriptions.Item>
                <Descriptions.Item label="Dòng máu">
                  {currentRecord.bloodline}
                </Descriptions.Item>
                <Descriptions.Item label="Bể">
                  {currentRecord.roundInfo?.tankNumber}
                </Descriptions.Item>
              </Descriptions>
            </TabPane>

            <TabPane
              tab={
                <span>
                  <UserOutlined /> Thông tin chủ sở hữu & Hình ảnh
                </span>
              }
              key="2"
            >
              <div className="space-y-6">
                {/* Owner Information */}
                <h3 className="font-medium text-lg mb-4">
                  Thông tin chủ sở hữu
                </h3>
                <Descriptions bordered column={1}>
                  <Descriptions.Item label="Chủ sở hữu">
                    {currentRecord.ownerName}
                  </Descriptions.Item>
                  <Descriptions.Item label="Người đăng ký">
                    {currentRecord.registerName}
                  </Descriptions.Item>
                </Descriptions>

                {/* Images and Videos */}
                <div className="space-y-4">
                  <h3 className="font-medium text-lg">Hình ảnh</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {currentRecord.koiMedia
                      ?.filter((media) => media.mediaType === "Image")
                      .map((media, index) => (
                        <div
                          key={`img-${index}`}
                          className="border rounded-md overflow-hidden"
                        >
                          <img
                            src={media.mediaUrl}
                            alt={`Koi ${index + 1}`}
                            className="w-full h-48 object-cover"
                          />
                        </div>
                      ))}
                  </div>

                  <h3 className="font-medium text-lg mt-6">Video</h3>
                  <div className="space-y-4">
                    {currentRecord.koiMedia
                      ?.filter((media) => media.mediaType === "Video")
                      .map((media, index) => (
                        <div
                          key={`video-${index}`}
                          className="border rounded-md overflow-hidden"
                        >
                          <video
                            src={media.mediaUrl}
                            controls
                            className="w-full"
                          />
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </TabPane>

            <TabPane
              tab={
                <span>
                  <TrophyOutlined /> Thông tin bình chọn
                </span>
              }
              key="4"
            >
              <Descriptions bordered column={1}>
                <Descriptions.Item label="Số lượt bình chọn">
                  <span className="text-xl font-bold text-blue-600">
                    {currentRecord.voteCount}
                  </span>
                </Descriptions.Item>
                {currentRecord.award && (
                  <Descriptions.Item label="Giải thưởng">
                    <div>
                      <Tag color="gold">
                        {currentRecord.award.name || "Không có tên"}
                      </Tag>
                      {/* {currentRecord.award.awardType && (
                          <div className="mt-1">
                            Loại: {currentRecord.award.awardType}
                          </div>
                        )} */}
                      {currentRecord.award.prizeValue && (
                        <div>
                          Giá trị:{" "}
                          {currentRecord.award.prizeValue.toLocaleString()} VND
                        </div>
                      )}
                    </div>
                  </Descriptions.Item>
                )}
                <Descriptions.Item label="Bể thi đấu">
                  {currentRecord.roundInfo?.tankNumber}
                </Descriptions.Item>
              </Descriptions>
            </TabPane>
          </Tabs>
        )}
      </Drawer>

      {/* Enable Voting Modal */}
      <Modal
        title="Bật bình chọn"
        open={enableModal}
        onCancel={() => setEnableModal(false)}
        onOk={handleEnableVoting}
        okText="Xác nhận"
        cancelText="Hủy"
      >
        <Form layout="vertical">
          <Form.Item
            label="Thời gian kết thúc bình chọn"
            required
            rules={[
              { required: true, message: "Vui lòng chọn thời gian kết thúc" },
            ]}
          >
            <DatePicker
              showTime
              onChange={setEndTime}
              className="w-full"
              placeholder="Chọn thời gian kết thúc"
              disabledDate={(current) =>
                current && current < moment().startOf("day")
              }
              disabledTime={(current) => ({
                disabledHours: () => {
                  if (current && current.isSame(moment(), "day")) {
                    const hours = [];
                    for (let i = 0; i < moment().hour(); i++) {
                      hours.push(i);
                    }
                    return hours;
                  }
                  return [];
                },
              })}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default Votes;
