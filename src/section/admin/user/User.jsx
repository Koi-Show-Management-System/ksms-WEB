import { useEffect, useState } from "react";
import { Table, Space, Button, Select, notification } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import useAccountTeam from "../../../hooks/useAccountTeam";
import { updateStatus } from "../../../api/accountManage";

const User = () => {
  const {
    accountManage,
    fetchAccountTeam,
    isLoading,
    currentPage,
    pageSize,
    totalItems,
  } = useAccountTeam();
  // Add local state to store updated data
  const [localData, setLocalData] = useState([]);

  useEffect(() => {
    fetchAccountTeam(currentPage, pageSize, "Member");
  }, [currentPage, pageSize]);

  // Update local data when accountManage changes
  useEffect(() => {
    if (accountManage.member) {
      const formattedData = accountManage.member.map((account) => ({
        key: account.id,
        fullName: account.fullName,
        email: account.email,
        phone: account.phone || "0384499305",
        status: account.status || "active",
        role: account.role,
      }));
      setLocalData(formattedData);
    }
  }, [accountManage]);

  const handleTableChange = (pagination) => {
    fetchAccountTeam(pagination.current, pagination.pageSize, "Member");
  };

  const handleEdit = (record) => {
    console.log("Edit account:", record);
  };

  const handleDelete = (record) => {
    console.log("Delete account:", record);
  };

  const handleStatusChange = async (accountId, newStatus) => {
    try {
      console.log(`Changing status for account ${accountId} to ${newStatus}`);

      // Update locally first (optimistic update)
      setLocalData((prevData) =>
        prevData.map((item) =>
          item.key === accountId ? { ...item, status: newStatus } : item
        )
      );

      const res = await updateStatus(accountId, newStatus);

      if (res && res.status === 200) {
        notification.success({
          message: "Thành công",
          description: `Trạng thái tài khoản đã được cập nhật thành ${newStatus}`,
          placement: "topRight",
        });

        // Fetch fresh data from the server to ensure everything is in sync
        fetchAccountTeam(currentPage, pageSize, "Member");
      } else {
        // Revert the optimistic update if the server request fails
        fetchAccountTeam(currentPage, pageSize, "Member");
        throw new Error("Failed to update status");
      }
    } catch (error) {
      console.error("Error in handleStatusChange:", error);
      notification.error({
        message: "Lỗi",
        description: "Đã xảy ra lỗi khi cập nhật trạng thái tài khoản",
        placement: "topRight",
      });
      // Revert the optimistic update on error
      fetchAccountTeam(currentPage, pageSize, "Member");
    }
  };

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
      render: (status, record) => {
        const options = [
          {
            value: "active",
            label: <span className="text-green-500">Active</span>,
          },
          {
            value: "blocked",
            label: <span className="text-orange-500">Blocked</span>,
          },
          {
            value: "deleted",
            label: <span className="text-red-500">Deleted</span>,
          },
        ];

        return (
          <Select
            value={status.toLowerCase()}
            style={{ width: 120 }}
            onChange={(value) => handleStatusChange(record.key, value)}
            options={options}
            dropdownStyle={{ minWidth: 120 }}
          />
        );
      },
    },
    {
      title: "Vai trò",
      dataIndex: "role",
      render: (role) => (role === "Member" ? "Thành viên" : role),
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

  return (
    <Table
      columns={columns}
      dataSource={localData}
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

export default User;
