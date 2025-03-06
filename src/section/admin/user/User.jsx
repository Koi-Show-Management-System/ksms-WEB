import { useEffect } from "react";
import { Table, Space, Button } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import useAccountTeam from "../../../hooks/useAccountTeam";

const columns = [
  {
    title: "Họ và Tên",
    dataIndex: "fullName",
    width: "20%",
  },
  {
    title: "Email",
    dataIndex: "email",
    width: "25%",
  },
  {
    title: "Số điện thoại",
    dataIndex: "phone",
    width: "20%",
  },
  {
    title: "Trạng thái",
    dataIndex: "status",
    width: "15%",
  },
  {
    title: "Vai trò",
    dataIndex: "role",
    width: "10%",
  },
  {
    title: "Hành động",
    key: "action",
    width: "10%",
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

const User = () => {
  const {
    accountManage,
    fetchAccountTeam,
    isLoading,
    currentPage,
    pageSize,
    totalItems,
  } = useAccountTeam();

  useEffect(() => {
    fetchAccountTeam(currentPage, pageSize, "Member");
  }, [currentPage, pageSize]);

  const handleTableChange = (pagination) => {
    fetchAccountTeam(pagination.current, pagination.pageSize, "Member");
  };

  const data =
    accountManage.member?.map((account) => ({
      key: account.id,
      fullName: account.fullName,
      email: account.email,
      phone: account.phone || "0384499305",
      status: account.status || "Hoạt động",
      role: account.role,
    })) || [];

  return (
    <Table
      columns={columns}
      dataSource={data}
      loading={isLoading}
      pagination={{
        current: currentPage,
        pageSize: pageSize,
        total: totalItems,
        showSizeChanger: true,
        showQuickJumper: true,
      }}
      onChange={handleTableChange}
      className="w-full"
    />
  );
};

const handleEdit = (record) => {
  console.log("Edit account:", record);
};

const handleDelete = (record) => {
  console.log("Delete account:", record);
};

export default User;
