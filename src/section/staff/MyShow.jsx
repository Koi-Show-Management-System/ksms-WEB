import { Button, DatePicker, Input, Pagination } from "antd";
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useKoiShow from "../../hooks/useKoiShow";
import { Loading } from "../../components";

function MyShow() {
  const [showDetails, setShowDetails] = React.useState(false);
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [filteredData, setFilteredData] = useState([]);
  const {
    koiShows,
    isLoading,
    error,
    fetchKoiShowList,
    currentPage,
    pageSize,
    totalItems,
  } = useKoiShow();

  console.log("my show", koiShows);

  useEffect(() => {
    fetchKoiShowList(currentPage, pageSize);
  }, []);

  useEffect(() => {
    handleSearch();
  }, [searchText, selectedDate, koiShows]);

  const handleSearch = () => {
    const filtered = koiShows.filter((item) => {
      const matchName = item.name
        .toLowerCase()
        .includes(searchText.toLowerCase());

      const matchDate = selectedDate
        ? dayjs(item.startExhibitionDate).format("DD/MM/YYYY") ===
          selectedDate.format("DD/MM/YYYY")
        : true;

      return matchName && matchDate;
    });
    setFilteredData(filtered);
  };

  const handlePageChange = (page, size) => {
    fetchKoiShowList(page, size);
  };

  if (isLoading) return <Loading />;
  if (error) {
    return <p className="text-red-500 text-center">Không thể tải dữ liệu.</p>;
  }

  const toggleDetails = () => {
    setShowDetails(!showDetails);
  };

  return (
    <div>
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <div className="mb-2 text-sm">Tìm kiếm triển lãm:</div>
          <Input
            placeholder="Tìm kiếm..."
            className="max-w-md"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
        <div>
          <div className="mb-2 text-sm">Ngày:</div>
          <div className="flex gap-2">
            <DatePicker
              placeholder="Chọn ngày"
              className="w-96"
              format="DD/MM/YYYY"
              value={selectedDate}
              onChange={(date) => setSelectedDate(date)}
            />
            <Button
              type="primary"
              className="bg-blue-500"
              onClick={handleSearch}
            >
              Tìm kiếm
            </Button>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {filteredData
          .filter((show) => show.status === "inprogress")
          .map((show) => (
            <div
              key={show.id}
              className="bg-white rounded-lg shadow-md overflow-hidden"
              onClick={() => navigate(`/staff/koiShow/detail/${show.id}`)}
            >
              {/* Show Image */}
              <img
                src={show.imgUrl}
                alt={show.name}
                className="w-full h-40 object-cover"
              />

              {/* Basic Information */}
              <div className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <h2 className="text-lg font-bold text-gray-800">
                    {show.name}
                  </h2>
                  <span
                    className={`px-2 py-1 rounded-full text-xs border ${
                      show.status === "pending"
                        ? "text-orange-500 bg-orange-50 border-orange-200"
                        : show.status === "approved"
                          ? "text-green-500 bg-green-50 border-green-200"
                          : show.status === "upcoming"
                            ? "text-blue-500 bg-blue-50 border-blue-200"
                            : show.status === "inprogress"
                              ? "text-yellow-500 bg-yellow-50 border-yellow-200"
                              : "text-gray-500 bg-gray-50 border-gray-200"
                    }`}
                  >
                    {show.status === "pending"
                      ? "Đang chờ"
                      : show.status === "approved"
                        ? "Đã duyệt"
                        : show.status === "upcoming"
                          ? "Sắp diễn ra"
                          : show.status === "inprogress"
                            ? "Đang diễn ra"
                            : "Không xác định"}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <p>
                    <strong>Sự kiện:</strong>{" "}
                    {new Date(show.startExhibitionDate).toLocaleDateString()} -{" "}
                    {new Date(show.endExhibitionDate).toLocaleDateString()}
                  </p>
                  <p>
                    <strong>Đăng ký:</strong>{" "}
                    {new Date(show.startDate).toLocaleDateString()} -{" "}
                    {new Date(show.endDate).toLocaleDateString()}
                  </p>
                  <p>
                    <strong>Địa điểm:</strong> {show.location}
                  </p>
                  <p>
                    <strong>Giá:</strong>{" "}
                    {(show.registrationFee || 0).toLocaleString()} VND
                  </p>
                </div>
                <Link to={`/staff/koiShow/detail/${show.id}`}>
                  <Button className="mt-3 w-full bg-blue-500" type="primary">
                    Xem chi tiết
                  </Button>
                </Link>
              </div>
            </div>
          ))}
      </div>
      <div className="flex justify-end items-center mt-4">
        <span>{`1-${koiShows.length} của ${totalItems}`}</span>
        <Pagination
          current={currentPage}
          total={totalItems}
          pageSize={pageSize}
          showSizeChanger
          onChange={handlePageChange}
        />
      </div>
    </div>
  );
}

export default MyShow;
