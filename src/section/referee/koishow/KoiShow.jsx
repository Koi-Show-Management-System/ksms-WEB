import React, { useState } from "react";
import { Button, Table, Input, DatePicker, Tag } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import NoKoiShow from "../../../assets/NoKoiShow.png";
import { useNavigate } from "react-router-dom";

function KoiShow() {
  const [searchText, setSearchText] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const navigate = useNavigate();
  const [data, setData] = useState([
    {
      key: "1",
      id: "1",
      showName: "Koi Fish Show 2025",
      date: "29/05/2025",
      participants: "684/1000",
      status: "InProgress",
    },
    {
      key: "2",
      id: "2",
      showName: "Koi Fish Show 2024",
      date: "29/05/2024",
      participants: "680/1000",
      status: "Completed",
    },
  ]);

  const handleStatusChange = (record) => {
    const newData = data.map((item) => {
      if (item.key === record.key) {
        return {
          ...item,
          status: item.status === "Completed" ? "InProgress" : "Completed",
        };
      }
      return item;
    });
    setData(newData);
  };

  const getFilteredData = () => {
    return data.filter((item) => {
      const matchName = item.showName
        .toLowerCase()
        .includes(searchText.toLowerCase());
      const matchDate = selectedDate
        ? item.date === selectedDate.format("DD/MM/YYYY")
        : true;
      return matchName && matchDate;
    });
  };

  const handleSearch = () => {
    console.log(
      "Searching with:",
      searchText,
      selectedDate?.format("DD/MM/YYYY")
    );
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      sorter: (a, b) => a.id.localeCompare(b.id),
    },
    {
      title: "Show Name",
      dataIndex: "showName",
      key: "showName",
      sorter: (a, b) => a.showName.localeCompare(b.showName),
      render: (text, record) => (
        <span
          className="text-blue-600 cursor-pointer hover:underline"
          onClick={() => navigate(`/referee/koiShow/detail/${record.id}`)}
        >
          {text}
        </span>
      ),
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      sorter: (a, b) => new Date(a.date) - new Date(b.date),
    },
    {
      title: "Participants",
      dataIndex: "participants",
      key: "participants",
      sorter: (a, b) => {
        const [aCount] = a.participants.split("/");
        const [bCount] = b.participants.split("/");
        return parseInt(aCount) - parseInt(bCount);
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      sorter: (a, b) => a.status.localeCompare(b.status),
      render: (status, record) => (
        <Tag
          color={status === "Completed" ? "success" : "processing"}
          className="rounded-full px-3 py-1 cursor-pointer"
          onClick={() => handleStatusChange(record)}
        >
          {status}
        </Tag>
      ),
    },
  ];

  return (
    <div>
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <div className="mb-2 text-sm">Search for show :</div>
          <Input
            placeholder="Search..."
            className="max-w-md"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
        <div>
          <div className="mb-2 text-sm">Select Date:</div>
          <div className="flex gap-2">
            <DatePicker
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
              Search
            </Button>
          </div>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={getFilteredData()}
        className="bg-white rounded-lg shadow-sm"
        locale={{
          emptyText: (
            <div className="flex flex-col items-center justify-center py-12">
              <h3 className="text-xl font-bold">No Shows Today</h3>
              <img
                src={NoKoiShow}
                alt="No shows"
                className="w-64 h-64 object-contain"
              />
            </div>
          ),
        }}
      />
    </div>
  );
}

export default KoiShow;
