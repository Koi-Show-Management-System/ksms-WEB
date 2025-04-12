// Staff.jsx
import React, {
  useState,
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
} from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Select,
  notification,
  Tag,
  Popconfirm,
} from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import useShowStaff from "../../../../hooks/useShowStaff";
import useAccountTeam from "../../../../hooks/useAccountTeam";

const Staff = forwardRef(({ showId, hideAddButton = false }, ref) => {
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [accountOptions, setAccountOptions] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [form] = Form.useForm();
  const addButtonRef = useRef(null);

  // Get the staff data and functions from the custom hook
  const {
    staffData: {
      items: staff,
      isLoading,
      error,
      currentPage,
      pageSize,
      totalItems,
    },
    fetchShowStaff,
    createShowStaffMember,
    deleteShowStaffMember,
  } = useShowStaff();

  // Get account team data
  const {
    fetchAccountTeam,
    accountManage,
    isLoading: accountsLoading,
  } = useAccountTeam();

  // Expose functions to parent component
  useImperativeHandle(ref, () => ({
    fetchAvailableAccounts,
    showAddModal,
  }));

  // Fetch staff data when component mounts or when pagination changes
  useEffect(() => {
    // If showId is not provided, you won't be able to fetch staff data
    if (!showId) {
      notification.error({
        message: "Lỗi",
        description: "Show ID is required to fetch staff data",
        placement: "topRight",
      });
      return;
    }

    // Pass the showId parameter to the fetchShowStaff function
    fetchShowStaff(currentPage, pageSize, "Staff", showId);
  }, [currentPage, pageSize, showId, fetchShowStaff]);

  // Show error message if API call fails
  useEffect(() => {
    if (error) {
      notification.error({
        message: "Lỗi",
        description: error,
        placement: "topRight",
      });
    }
  }, [error]);

  const handleTableChange = (pagination) => {
    fetchShowStaff(pagination.current, pagination.pageSize, "Staff", showId);
  };

  // Fetch accounts that are not already assigned to the show
  const fetchAvailableAccounts = async () => {
    setLoadingAccounts(true);
    try {
      // Fetch all staff from account team
      await fetchAccountTeam(1, 100, "Staff"); // Get up to 100 staff members

      // Filter out staff already in the show
      const currentStaffIds = staff.map((staffMember) => staffMember.accountId);

      const availableStaff = accountManage.staff.filter(
        (staffMember) => !currentStaffIds.some((id) => id === staffMember.id)
      );

      setAccountOptions(availableStaff);
      return availableStaff.length; // Return count for parent component
    } catch (error) {
      notification.error({
        message: "Lỗi",
        description: "Failed to fetch available staff members",
        placement: "topRight",
      });
      return 0;
    } finally {
      setLoadingAccounts(false);
    }
  };

  const showAddModal = () => {
    setIsAddModalVisible(true);
    fetchAvailableAccounts();
  };

  const handleAddCancel = () => {
    setIsAddModalVisible(false);
    setSelectedAccountId(null);
    form.resetFields();
  };

  const handleAddStaff = async () => {
    if (!selectedAccountId) {
      notification.error({
        message: "Lỗi",
        description: "Vui lòng chọn tài khoản",
        placement: "topRight",
      });
      return;
    }

    const success = await createShowStaffMember(
      showId,
      selectedAccountId,
      "Staff"
    );
    if (success) {
      setIsAddModalVisible(false);
      setSelectedAccountId(null);
      form.resetFields();
    }
  };

  const handleDeleteStaff = async (showStaffId) => {
    await deleteShowStaffMember(showStaffId, "Staff", showId);
  };

  const columns = [
    {
      title: "Tên",
      dataIndex: "fullName",
      key: "fullName",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <span
          className={status === "Active" ? "text-green-500" : "text-red-500"}
        >
          <Tag color={status === "active" ? "green" : "red"}>
            {status === "active" ? "Hoạt động" : "Không hoạt động"}
          </Tag>{" "}
        </span>
      ),
    },
    {
      title: "Vai trò",
      dataIndex: "role",
      key: "role",
      render: (role) => <span>{role === "Staff" ? "Nhân viên" : role}</span>,
    },
    {
      title: "Hành động",
      key: "action",
      render: (_, record) => (
        <div className="flex gap-3">
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa nhân viên này?"
            onConfirm={() => handleDeleteStaff(record.showStaffId)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <DeleteOutlined className="cursor-pointer text-red-500" />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="staff-component">
      {!hideAddButton && (
        <div className="flex justify-end mb-4">
          <Button type="primary" icon={<PlusOutlined />} onClick={showAddModal}>
            Thêm nhân viên
          </Button>
        </div>
      )}

      {/* Hidden button for parent component to trigger */}
      <button
        ref={addButtonRef}
        className="hidden"
        data-add-button="true"
        onClick={showAddModal}
      />

      <Table
        columns={columns}
        dataSource={staff.map((item) => ({
          ...item,
          key: item.showStaffId,
          showStaffId: item.showStaffId,
        }))}
        loading={isLoading}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: totalItems,
          showSizeChanger: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} trong ${total}`,
        }}
        onChange={handleTableChange}
      />

      <Modal
        title="Thêm nhân viên"
        open={isAddModalVisible}
        onCancel={handleAddCancel}
        onOk={handleAddStaff}
        okText="Thêm"
        cancelText="Hủy"
        confirmLoading={loadingAccounts || accountsLoading}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Chọn tài khoản"
            name="accountId"
            rules={[{ required: true, message: "Vui lòng chọn tài khoản" }]}
          >
            {accountOptions.length === 0 && !loadingAccounts && (
              <p className="text-yellow-500 mb-2">
                Không có nhân viên nào khả dụng để thêm.
              </p>
            )}
            <Select
              placeholder="Chọn tài khoản"
              loading={loadingAccounts || accountsLoading}
              onChange={(value) => setSelectedAccountId(value)}
              options={accountOptions.map((account) => ({
                value: account.id,
                label: `${account.fullName} (${account.email})`,
              }))}
              notFoundContent={
                loadingAccounts || accountsLoading
                  ? "Đang tải..."
                  : "Không có nhân viên nào khả dụng"
              }
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
});

export default Staff;
