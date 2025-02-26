import { Table, Space, Button } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from "@ant-design/icons"; 
import axios from "axios";
import qs from "qs";
import { useEffect, useState } from "react";

const columns = [
  {
    title: "ID",
    dataIndex: "ID",
    width: "10%",
  },
  {
    title: "Họ và Tên",
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
    title: "Mật khẩu",
    dataIndex: "login",
    width: "15%",
    render: (login, record) => (
      <Space>
        {record.showPassword ? login.password : "••••••••"}
        <Button
          type="text"
          icon={record.showPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
          onClick={() => handleTogglePassword(record)}
        />
      </Space>
    ),
  },
  {
    title: "Trạng thái",
    dataIndex: "status",
    render: () => "Hoạt động",
    width: "15%",
  },
  {
    title: "Hành động",
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

const handleEdit = (record) => {
  console.log("Chỉnh sửa bản ghi:", record);
};

const handleDelete = (record) => {
  console.log("Xóa bản ghi:", record);
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
      console.error("Lỗi khi lấy dữ liệu:", error);
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
      className="w-full"
    />
  );
};

export default User;
