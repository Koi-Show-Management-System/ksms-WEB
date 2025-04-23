import React, { useEffect, useState } from "react";
import {
  Collapse,
  Timeline,
  Card,
  Image,
  Tabs,
  Spin,
  notification,
  Modal,
} from "antd";
import dayjs from "dayjs";
import { EyeOutlined } from "@ant-design/icons";
import sponsorLogo1 from "../../assets/sponsorLogo1.png";
import koiFishImage from "../../assets/koiFishImage.png";
import CompetitionRound from "./CompetitionRound";
import { useParams } from "react-router-dom";
import { Loading } from "../../components";
import useKoiShow from "../../hooks/useKoiShow";
import Rules from "../staff/Rules";
import ScanQrByReferee from "./ScanQrByReferee";
import Cookies from "js-cookie";
import StatusManager from "../admin/koishow/KoiShowAdmin/StatusManager";
import Category from "../staff/Category";

function KoiShowDetail() {
  const { Panel } = Collapse;
  const { id } = useParams();
  const { koiShowDetail, isLoading, fetchKoiShowDetail } = useKoiShow();
  const refereeId = Cookies.get("__id");
  const [showAll, setShowAll] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTabKey, setActiveTabKey] = useState("category");

  const statusMapping = {
    RegistrationOpen: { label: "Có Thể Đăng Ký", color: "blue" },
    RegistrationClosed: { label: "Đóng Đăng Ký", color: "red" },
    CheckIn: { label: "Điểm danh", color: "cyan" },
    Preliminary: { label: "Vòng Sơ Loại", color: "green" },
    Evaluation: { label: "Vòng Đánh Giá", color: "purple" },
    Final: { label: "Vòng Chung Kết", color: "orange" },
    GrandChampion: { label: "Grand Champion", color: "yellow" },
    Completed: { label: "Hoàn Thành ", color: "gray" },
    Exhibition: { label: "Triễn Lãm ", color: "teal" },
    Finished: { label: "Kết Thúc", color: "brown" },
  };

  const renderTabContent = (key) => {
    if (key !== activeTabKey) return null;

    if (!koiShowDetail?.data) return null;

    const showRule = koiShowDetail?.data?.showRules;

    switch (key) {
      case "category":
        return <Category showId={id} />;
      case "scanQrByReferee":
        return <ScanQrByReferee refereeAccountId={refereeId} />;
      case "competitionRound":
        return <CompetitionRound />;
      case "rules":
        return <Rules showId={id} showRule={showRule} />;
      default:
        return null;
    }
  };

  const formatDate = (date) => dayjs(date).format("DD/MM/YYYY");
  const formatTime = (date) => dayjs(date).format("hh:mm A");

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

  const items = [
    {
      key: "category",
      label: "Danh Mục",
      children: renderTabContent("category"),
    },
    {
      key: "scanQrByReferee",
      label: "Quét QR Chấm Điểm",
      children: renderTabContent("scanQrByReferee"),
    },
    {
      key: "competitionRound",
      label: "Lịch Sử Chấm Điểm",
      children: renderTabContent("competitionRound"),
    },
    {
      key: "rules",
      label: "Quy Tắc",
      children: renderTabContent("rules"),
    },
  ];

  return (
    <div className="max-w-8xl mx-auto p-2 md:p-4">
      <Collapse
        defaultActiveKey={["info"]}
        ghost
        items={[
          {
            key: "info",
            label: (
              <div className="flex items-center justify-between w-full">
                <h1 className="text-xl md:text-2xl font-semibold">
                  {koiShowDetail.data.name}
                </h1>
              </div>
            ),
            children: (
              <>
                <p className="text-gray-600 text-sm md:text-base">
                  {koiShowDetail.data.description}
                </p>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 my-4">
                  <div className="lg:col-span-2">
                    <div className="mb-4">
                      <div className="flex justify-center lg:justify-start mb-6">
                        <Image
                          src={koiShowDetail.data.imgUrl || koiFishImage}
                          alt="Cá Koi"
                          className="w-full h-[280px] sm:h-[320px] md:h-[380px] lg:h-[420px] xl:h-[480px] object-cover rounded-lg shadow-md"
                          preview={{
                            mask: (
                              <div className="flex items-center justify-center">
                                <span className="font-medium text-base">
                                  <EyeOutlined />
                                </span>
                              </div>
                            ),
                          }}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="mt-2">
                          <Collapse
                            defaultActiveKey={["1"]}
                            items={[
                              {
                                key: "1",
                                label: (
                                  <span className="font-medium">
                                    Lịch Trình Sự Kiện
                                  </span>
                                ),
                                children: (
                                  <div className="space-y-2 text-sm md:text-sm">
                                    <div className="flex flex-col md:flex-row md:justify-between">
                                      <span className="font-medium">
                                        Thời gian bắt đầu:
                                      </span>
                                      <span>
                                        {new Date(
                                          koiShowDetail.data.startDate
                                        ).toLocaleDateString("vi-VN")}{" "}
                                        {formatTime(
                                          koiShowDetail.data.startDate
                                        )}
                                      </span>
                                    </div>
                                    <div className="flex flex-col md:flex-row md:justify-between">
                                      <span className="font-medium">
                                        Thời gian kết thúc:
                                      </span>
                                      <span>
                                        {new Date(
                                          koiShowDetail.data.endDate
                                        ).toLocaleDateString("vi-VN")}{" "}
                                        {formatTime(koiShowDetail.data.endDate)}
                                      </span>
                                    </div>
                                    <div className="flex flex-col md:flex-row md:justify-between">
                                      <span className="font-medium">
                                        Số người tham gia:
                                      </span>
                                      <span>
                                        {koiShowDetail.data.minParticipants} -{" "}
                                        {koiShowDetail.data.maxParticipants}{" "}
                                        người
                                      </span>
                                    </div>
                                    <div className="flex flex-col md:flex-row md:justify-between">
                                      <span className="font-medium">
                                        Địa điểm:
                                      </span>
                                      <span>{koiShowDetail.data.location}</span>
                                    </div>
                                  </div>
                                ),
                              },
                            ]}
                          />
                        </div>

                        <div className="mt-2">
                          <Collapse
                            defaultActiveKey={["2"]}
                            items={[
                              {
                                key: "2",
                                label: <span className="font-medium">Vé</span>,
                                children: (
                                  <div className="space-y-2 text-sm md:text-sm">
                                    {koiShowDetail.data.ticketTypes.length >
                                    0 ? (
                                      koiShowDetail.data.ticketTypes.map(
                                        (ticket) => (
                                          <div
                                            key={ticket.id}
                                            className="flex flex-col md:flex-row md:justify-between"
                                          >
                                            <span>{ticket.name}</span>
                                            <div className="flex justify-between md:block">
                                              <span className="text-blue-600">
                                                {new Intl.NumberFormat(
                                                  "vi-VN",
                                                  {
                                                    style: "currency",
                                                    currency: "VND",
                                                  }
                                                ).format(ticket.price)}
                                              </span>
                                              <span className="ml-2 text-gray-500">
                                                ({ticket.availableQuantity} vé)
                                              </span>
                                            </div>
                                          </div>
                                        )
                                      )
                                    ) : (
                                      <div className="text-gray-500">
                                        Chưa có thông tin vé
                                      </div>
                                    )}
                                  </div>
                                ),
                              },
                            ]}
                          />
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-black/[0.02] p-3 md:p-4 rounded-lg">
                          <h3 className="font-bold mb-3 text-base md:text-lg">
                            Tài Trợ
                          </h3>
                          <div className="grid grid-cols-2 gap-3 md:gap-4 relative">
                            {displaySponsors.map((sponsor, index) => (
                              <div
                                key={sponsor.id}
                                className="relative flex justify-center items-center"
                              >
                                <Image
                                  src={sponsor.logoUrl || sponsorLogo1}
                                  alt={`Tài Trợ ${index + 1}`}
                                  className="rounded-xl"
                                  width={180}
                                  height={180}
                                />
                                {index === 1 && extraCount > 0 && (
                                  <div
                                    onClick={() => setIsModalOpen(true)}
                                    className="absolute inset-0 bg-black bg-opacity-50 rounded-xl flex items-center justify-center cursor-pointer"
                                  >
                                    <span className="text-white font-semibold text-base md:text-lg">
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
                            width={700}
                          >
                            <div className="grid grid-cols-2 gap-5">
                              {sponsors.map((sponsor) => (
                                <Image
                                  key={sponsor.id}
                                  src={sponsor.logoUrl || sponsorLogo1}
                                  alt="Tài trợ"
                                  className="rounded-xl"
                                  width={250}
                                  height={250}
                                />
                              ))}
                            </div>
                          </Modal>
                        </div>

                        <div className="bg-black/[0.02] p-3 md:p-4 rounded-lg">
                          <h3 className="font-bold mb-3 text-base md:text-lg">
                            Tiêu Chí Đánh Giá{" "}
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                            {/* Cột 1: Chứa 5 phần tử đầu tiên */}
                            <div className="space-y-2 md:space-y-3">
                              {koiShowDetail.data.criteria
                                .slice(0, 5)
                                .map((criteriaList, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center"
                                  >
                                    <div className="w-6 h-6 md:w-7 md:h-7 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs md:text-sm mr-2 flex-shrink-0">
                                      {index + 1}
                                    </div>
                                    <div className="text-xs md:text-sm">
                                      {criteriaList}
                                    </div>
                                  </div>
                                ))}
                            </div>

                            {/* Cột 2: Chứa các phần tử còn lại */}
                            <div className="space-y-2 md:space-y-3">
                              {koiShowDetail.data.criteria
                                .slice(5)
                                .map((criteriaList, index) => (
                                  <div
                                    key={index + 5}
                                    className="flex items-center"
                                  >
                                    <div className="w-6 h-6 md:w-7 md:h-7 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs md:text-sm mr-2 flex-shrink-0">
                                      {index + 6}
                                    </div>
                                    <div className="text-xs md:text-sm">
                                      {criteriaList}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="mb-4">
                      <StatusManager
                        showId={id}
                        showStatuses={koiShowDetail.data.showStatuses}
                        disabled={true}
                      />
                    </div>
                  </div>
                </div>
              </>
            ),
          },
        ]}
      />

      <div className="mt-2 md:mt-4 p-2 md:p-4">
        <Tabs
          defaultActiveKey="category"
          activeKey={activeTabKey}
          onChange={setActiveTabKey}
          items={items}
          size="small"
          tabBarGutter={12}
          className="koishow-tabs"
        />
      </div>
    </div>
  );
}

export default KoiShowDetail;
