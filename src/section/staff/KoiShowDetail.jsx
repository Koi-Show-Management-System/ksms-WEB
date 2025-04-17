import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Collapse, Timeline, Card, Image, Tabs, Modal, message } from "antd";
import dayjs from "dayjs";
import sponsorLogo1 from "../../assets/sponsorLogo1.png";
import Category from "./Category";
import koiFishImage from "../../assets/koiFishImage.png";
import { useParams } from "react-router-dom";
import { Loading } from "../../components";
import useKoiShow from "../../hooks/useKoiShow";
import Rules from "./Rules";
import Tank from "../admin/koishow/KoiShowAdmin/Tank";
import Registration from "../admin/koishow/KoiShowAdmin/Registration";
import ScanQr from "./ScanQr";
import CompetitionRound from "../admin/koishow/KoiShowAdmin/CompetitionRound";
import Ticket from "../admin/koishow/KoiShowAdmin/Ticket";
import ScanQrWrapper from "./ScanQrWrapper";
import LiveStream from "./LiveStream";
import RoundResult from "../admin/koishow/KoiShowAdmin/RoundResult";
import CheckOutKoi from "./CheckOutKoi";
import Votes from "../admin/koishow/KoiShowAdmin/Votes";
import StatusManager from "../admin/koishow/KoiShowAdmin/StatusManager";

function KoiShowDetail() {
  const { id } = useParams();
  const { koiShowDetail, isLoading, fetchKoiShowDetail } = useKoiShow();

  const [showAll, setShowAll] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  // Detect tablet size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsTablet(window.innerWidth >= 768 && window.innerWidth <= 1024);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => {
      window.removeEventListener("resize", checkScreenSize);
    };
  }, []);

  const items = useMemo(() => {
    if (!koiShowDetail?.data) return [];

    const showRule = koiShowDetail?.data?.showRules;
    return [
      {
        key: "category",
        label: (
          <span style={{ fontSize: isTablet ? "16px" : "14px" }}>Danh Mục</span>
        ),
        children: <Category showId={id} statusShow={koiShowDetail.data.showStatuses} />,
      },
      {
        key: "registration",
        label: (
          <span style={{ fontSize: isTablet ? "16px" : "14px" }}>
            Đơn Đăng Ký
          </span>
        ),
        children: <Registration showId={id} />,
      },
      {
        key: "ticket",
        label: (
          <span style={{ fontSize: isTablet ? "16px" : "14px" }}>
            Quản lý vé
          </span>
        ),
        children: <Ticket showId={id} />,
      },
      {
        key: "tank",
        label: (
          <span style={{ fontSize: isTablet ? "16px" : "14px" }}>
            Quản Lý bể
          </span>
        ),
        children: <Tank showId={id} />,
      },
      {
        key: "scanQr",
        label: (
          <span style={{ fontSize: isTablet ? "16px" : "14px" }}>Quét mã</span>
        ),
        children: <ScanQrWrapper />,
      },
      {
        key: "competitionRound",
        label: (
          <span style={{ fontSize: isTablet ? "16px" : "14px" }}>Vòng thi</span>
        ),
        children: <CompetitionRound showId={id} />,
      },
      {
        key: "roundResult",
        label: (
          <span style={{ fontSize: isTablet ? "16px" : "14px" }}>
            Kết quả cuối cùng
          </span>
        ),
        children: <RoundResult showId={id} />,
      },
      {
        key: "votes",
        label: (
          <span style={{ fontSize: isTablet ? "16px" : "14px" }}>
            Bình chọn
          </span>
        ),
        children: <Votes showId={id} />,
      },
      {
        key: "checkOutKoi",
        label: (
          <span style={{ fontSize: isTablet ? "16px" : "14px" }}>
            Check out
          </span>
        ),
        children: <CheckOutKoi showId={id} />,
      },
      {
        key: "rules",
        label: (
          <span style={{ fontSize: isTablet ? "16px" : "14px" }}>Quy tắc</span>
        ),
        children: <Rules showId={id} showRule={showRule} />,
      },
      {
        key: "liveStream",
        label: (
          <span style={{ fontSize: isTablet ? "16px" : "14px" }}>
            LiveStream
          </span>
        ),
        children: <LiveStream showId={id} />,
      },
    ];
  }, [id, koiShowDetail?.data, isTablet]);

  useEffect(() => {
    fetchKoiShowDetail(id);
  }, [id, fetchKoiShowDetail]);

  if (isLoading) return <Loading />;

  if (!koiShowDetail) {
    return (
      <p className="text-red-500 text-center">Không có thông tin triển lãm.</p>
    );
  }

  const sponsors = koiShowDetail?.data?.sponsors || [];
  const displaySponsors = showAll ? sponsors : sponsors.slice(0, 2);
  const extraCount = sponsors.length - 2;
  const showRule = koiShowDetail?.data?.showRules;

  const statusMapping = {
    RegistrationOpen: { label: "Có Thể Đăng Ký", color: "blue" },
    RegistrationClosed: { label: "Đóng Đăng Ký", color: "red" },
    CheckIn: { label: "Điểm danh", color: "cyan" },
    Preliminary: { label: "Vòng Sơ Loại", color: "green" },
    Evaluation: { label: "Vòng Đánh Giá", color: "purple" },
    Final: { label: "Vòng Chung Kết", color: "orange" },
    GrandChampion: { label: "Grand Champion", color: "yellow" },
    Completed: { label: "Hoàn Thành ", color: "gray" },
    Exhibition: { lablel: "Triễn Lãm ", color: "teal" },
    Finished: { lablel: "Kết Thúc", color: "brown" },
  };

  const formatDate = (date) => dayjs(date).format("DD/MM/YYYY");
  const formatTime = (date) => dayjs(date).format("hh:mm A");

  const scheduleItems = [
    {
      key: "1",
      label: (
        <span
          style={{ fontSize: isTablet ? "16px" : "14px", fontWeight: "bold" }}
        >
          Lịch Trình Sự Kiện
        </span>
      ),
      children: (
        <div className="space-y-2 text-sm md:text-sm">
          <div className="flex flex-col md:flex-row md:justify-between">
            <span className="font-medium">Thời gian bắt đầu:</span>
            <span>
              {new Date(koiShowDetail.data.startDate).toLocaleDateString(
                "vi-VN"
              )}{" "}
              {formatTime(koiShowDetail.data.startDate)}
            </span>
          </div>
          <div className="flex flex-col md:flex-row md:justify-between">
            <span className="font-medium">Thời gian kết thúc:</span>
            <span>
              {new Date(koiShowDetail.data.endDate).toLocaleDateString("vi-VN")}{" "}
              {formatTime(koiShowDetail.data.endDate)}
            </span>
          </div>
          <div className="flex flex-col md:flex-row md:justify-between">
            <span className="font-medium">Số người tham gia:</span>
            <span>
              {koiShowDetail.data.minParticipants} -{" "}
              {koiShowDetail.data.maxParticipants} người
            </span>
          </div>
          <div className="flex flex-col md:flex-row md:justify-between">
            <span className="font-medium">Địa điểm:</span>
            <span>{koiShowDetail.data.location}</span>
          </div>
        </div>
      ),
    },
  ];

  const ticketItems = [
    {
      key: "2",
      label: (
        <span
          style={{ fontSize: isTablet ? "16px" : "14px", fontWeight: "bold" }}
        >
          Vé
        </span>
      ),
      children: (
        <div className="space-y-2 text-sm md:text-sm">
          {koiShowDetail.data.ticketTypes.length > 0 ? (
            koiShowDetail.data.ticketTypes.map((ticket) => (
              <div
                key={ticket.id}
                className="flex flex-col md:flex-row md:justify-between"
              >
                <span>{ticket.name}</span>
                <div className="flex justify-between md:block">
                  <span className="text-blue-600">
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(ticket.price)}
                  </span>
                  <span className="ml-2 text-gray-500">
                    ({ticket.availableQuantity} vé)
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-gray-500">Chưa có thông tin vé</div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div
      className={`max-w-8xl mx-auto p-3 ${isTablet ? "tablet-container" : ""}`}
    >
      <Collapse
        defaultActiveKey={["info"]}
        ghost
        items={[
          {
            key: "info",
            label: (
              <div className="flex items-center justify-between w-full">
                <h1
                  className={`text-2xl font-semibold ${isTablet ? "tablet-heading" : ""}`}
                >
                  {koiShowDetail.data.name}
                </h1>
              </div>
            ),
            children: (
              <>
                <p
                  className="text-gray-600"
                  style={{ fontSize: isTablet ? "16px" : "14px" }}
                >
                  {koiShowDetail.data.description}
                </p>

                <div
                  className={`grid ${isTablet ? "grid-cols-1" : "grid-cols-1 md:grid-cols-3"} gap-4 md:gap-8`}
                >
                  <div className={isTablet ? "col-span-1" : "md:col-span-2"}>
                    <div className="flex justify-center mb-4">
                      <Image
                        src={koiShowDetail.data.imgUrl || koiFishImage}
                        alt="Cá Koi"
                        className={
                          isTablet
                            ? "w-full max-w-lg h-auto object-cover rounded-lg"
                            : "w-[300px] h-[200px] object-cover rounded-lg"
                        }
                      />
                    </div>

                    <div
                      className={`grid ${isTablet ? "grid-cols-1 gap-4" : "grid-cols-2 gap-4"}`}
                    >
                      <div className="mt-4">
                        <Collapse
                          defaultActiveKey={["1"]}
                          items={scheduleItems}
                          className={isTablet ? "tablet-collapse" : ""}
                        />
                      </div>

                      <div className="mt-4">
                        <Collapse
                          defaultActiveKey={["2"]}
                          items={ticketItems}
                          className={isTablet ? "tablet-collapse" : ""}
                        />
                      </div>
                    </div>

                    <div
                      className={`mt-4 grid ${isTablet ? "grid-cols-1 gap-6" : "grid-cols-2 gap-4"}`}
                    >
                      <div className="bg-black/[0.02] p-4 rounded-lg">
                        <h3
                          className={`font-bold mb-4 ${isTablet ? "text-xl" : "text-lg"}`}
                        >
                          Tài Trợ
                        </h3>
                        <div className="grid grid-cols-2 gap-4 relative">
                          {displaySponsors.map((sponsor, index) => (
                            <div key={sponsor.id} className="relative">
                              <Image
                                src={sponsor.logoUrl || sponsorLogo1}
                                alt={`Tài Trợ ${index + 1}`}
                                className="rounded-xl"
                                width={isTablet ? 180 : 150}
                                height={isTablet ? 180 : 150}
                              />
                              {index === 1 && extraCount > 0 && (
                                <div
                                  onClick={() => setIsModalOpen(true)}
                                  className="absolute inset-0 bg-black bg-opacity-50 rounded-xl flex items-center justify-center cursor-pointer"
                                >
                                  <span
                                    className="text-white font-semibold"
                                    style={{
                                      fontSize: isTablet ? "20px" : "16px",
                                    }}
                                  >
                                    +{extraCount}
                                  </span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        <Modal
                          title="Tất cả nhà tài trợ"
                          open={isModalOpen}
                          onCancel={() => setIsModalOpen(false)}
                          footer={null}
                          width={isTablet ? 600 : 520}
                        >
                          <div className="grid grid-cols-2 gap-4">
                            {sponsors.map((sponsor) => (
                              <Image
                                key={sponsor.id}
                                src={sponsor.logoUrl || sponsorLogo1}
                                alt="Tài trợ"
                                className="rounded-xl"
                                width={isTablet ? 180 : 150}
                                height={isTablet ? 180 : 150}
                              />
                            ))}
                          </div>
                        </Modal>
                      </div>

                      <div className="bg-black/[0.02] p-4 rounded-lg">
                        <h3
                          className={`font-bold mb-4 ${isTablet ? "text-xl" : "text-lg"}`}
                        >
                          Tiêu Chí Đánh Giá{" "}
                        </h3>
                        <div className="grid grid-cols-2 gap-4 md:gap-8">
                          {/* Cột 1: Chứa 5 phần tử đầu tiên */}
                          <div className="space-y-3">
                            {koiShowDetail.data.criteria
                              .slice(0, 5)
                              .map((criteriaList, index) => (
                                <div key={index} className="flex items-center">
                                  <div
                                    className={`${isTablet ? "w-8 h-8" : "w-7 h-7"} bg-blue-500 text-white rounded-full flex items-center justify-center text-sm mr-2 flex-shrink-0`}
                                  >
                                    {index + 1}
                                  </div>
                                  <div
                                    className={
                                      isTablet ? "text-base" : "text-sm"
                                    }
                                  >
                                    {criteriaList}
                                  </div>
                                </div>
                              ))}
                          </div>

                          {/* Cột 2: Chứa các phần tử còn lại */}
                          <div className="space-y-3">
                            {koiShowDetail.data.criteria
                              .slice(5)
                              .map((criteriaList, index) => (
                                <div
                                  key={index + 5}
                                  className="flex items-center"
                                >
                                  <div
                                    className={`${isTablet ? "w-8 h-8" : "w-7 h-7"} bg-blue-500 text-white rounded-full flex items-center justify-center text-sm mr-2 flex-shrink-0`}
                                  >
                                    {index + 6}
                                  </div>
                                  <div
                                    className={
                                      isTablet ? "text-base" : "text-sm"
                                    }
                                  >
                                    {criteriaList}
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={isTablet ? "mt-4" : ""}>
                    <StatusManager
                      showId={id}
                      showStatuses={koiShowDetail.data.showStatuses}
                      disabled={true}
                    />
                  </div>
                </div>
              </>
            ),
          },
        ]}
      />

      <div className="flex items-center justify-between mx-2 mt-4">
        <div className="flex-1">
          <Tabs
            defaultActiveKey="category"
            items={items}
            size={isTablet ? "large" : "middle"}
            tabBarGutter={isTablet ? 24 : 16}
            tabBarStyle={{
              margin: isTablet ? "0 0 24px 0" : "0 0 16px 0",
              padding: isTablet ? "0 8px" : "0",
            }}
            className={isTablet ? "tablet-tabs" : ""}
          />
        </div>
      </div>

      <style jsx="true" global>{`
        .tablet-container {
          padding: 16px;
        }

        .tablet-heading {
          font-size: 28px;
          margin-bottom: 16px;
        }

        .tablet-card .ant-card-head {
          padding: 16px 24px;
          min-height: 60px;
        }

        .tablet-card .ant-card-body {
          padding: 20px 24px;
        }

        .tablet-collapse .ant-collapse-header {
          padding: 16px 20px !important;
        }

        .tablet-collapse .ant-collapse-content-box {
          padding: 16px 20px !important;
        }

        .tablet-tabs .ant-tabs-nav-list {
          width: 100%;
          overflow-x: auto;
          white-space: nowrap;
          padding-bottom: 6px;
        }

        .tablet-tabs .ant-tabs-tab {
          padding: 12px 16px;
          touch-action: manipulation;
        }

        .tablet-tabs .ant-tabs-ink-bar {
          height: 3px;
        }

        /* Tablet sizes for touch interface */
        @media (min-width: 768px) and (max-width: 1024px) {
          .ant-collapse-header {
            min-height: 50px;
          }

          .ant-btn {
            min-height: 44px;
          }

          .ant-select-selector {
            height: 44px !important;
          }

          .ant-input {
            height: 44px;
            font-size: 16px;
          }

          .ant-pagination-item {
            min-width: 36px;
            height: 36px;
            line-height: 34px;
          }

          /* Avoid zoom on input fields */
          input,
          select,
          textarea {
            font-size: 16px !important;
          }
        }
      `}</style>
    </div>
  );
}

export default KoiShowDetail;
