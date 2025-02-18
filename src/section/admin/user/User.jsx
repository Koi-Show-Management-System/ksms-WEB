import { Table, Space, Button } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from "@ant-design/icons"; // Added icons
import axios from "axios";
import qs from "qs";
import { useEffect, useState } from "react";

// Modified columns to include ID and icon-based actions
const columns = [
  {
    title: "ID",
    dataIndex: "ID",
    width: "10%",
  },
  {
    title: "Name",
    dataIndex: "name",
    sorter: true,
    render: (name) => `${name.first} ${name.last}`,
    width: "20%",
  },
  {
    title: "Email",
    dataIndex: "email",
    width: "25%",
  },
  {
    title: "Password",
    dataIndex: "login",
    width: "15%",
    render: (login, record) => (
      <Space>
        {record.showPassword ? login.password : "••••••••"}
        <Button
          type="text"
          icon={
            record.showPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />
          }
          onClick={() => handleTogglePassword(record)}
        />
      </Space>
    ),
  },
  {
    title: "Status",
    dataIndex: "status",
    render: () => "Active",
    width: "15%",
  },
  {
    title: "Action",
    key: "action",
    width: "15%",
    render: (_, record) => (
      <Space size="middle">
        <Button
          type="text"
          icon={<EditOutlined />}
          onClick={() => handleEdit(record)}
        />
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleDelete(record)}
        />
      </Space>
    ),
  },
];

// Add handlers for actions
const handleEdit = (record) => {
  console.log("Edit record:", record);
  // Add edit logic here
};

const handleDelete = (record) => {
  console.log("Delete record:", record);
  // Add delete logic here
};

const handleTogglePassword = (record) => {
  setData((prevData) =>
    prevData.map((item) =>
      item.login.uuid === record.login.uuid
        ? { ...item, showPassword: !item.showPassword }
        : item
    )
  );
};

// Rest of the code remains the same
const getRandomuserParams = (params) => ({
  results: params.pagination?.pageSize,
  page: params.pagination?.current,
  ...params,
});

const User = () => {
  const [data, setData] = useState();
  const [loading, setLoading] = useState(false);
  const [tableParams, setTableParams] = useState({
    pagination: {
      current: 1,
      pageSize: 10,
    },
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `https://randomuser.me/api?${qs.stringify(
          getRandomuserParams(tableParams)
        )}`
      );
      const { results } = response.data;
      // Add showPassword property to each record
      const resultsWithPasswordVisibility = results.map((item) => ({
        ...item,
        showPassword: false,
      }));
      setData(resultsWithPasswordVisibility);
      setLoading(false);
      setTableParams({
        ...tableParams,
        pagination: {
          ...tableParams.pagination,
          total: 200,
        },
      });
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [JSON.stringify(tableParams)]);

  const handleTableChange = (pagination, filters, sorter) => {
    setTableParams({
      pagination,
      filters,
      ...sorter,
    });
  };

  return (
    <Table
      columns={columns}
      rowKey={(record) => record.login.uuid}
      dataSource={data}
      pagination={tableParams.pagination}
      loading={loading}
      onChange={handleTableChange}
    />
  );
};

export default User;
