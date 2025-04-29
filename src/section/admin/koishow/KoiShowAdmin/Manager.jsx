// Manager.jsx
import React, {
  useEffect,
  useState,
  useRef,
  useImperativeHandle,
  forwardRef,
} from "react";
import {
  Table,
  Button,
  notification,
  Tag,
  Modal,
  Select,
  Popconfirm,
  Empty,
} from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import useShowStaff from "../../../../hooks/useShowStaff";
import useAccountTeam from "../../../../hooks/useAccountTeam";

const Manager = forwardRef(({ showId, hideAddButton = false }, ref) => {
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [accountOptions, setAccountOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const addButtonRef = useRef(null);

  const {
    managerData: {
      items: managers,
      isLoading: managersLoading,
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

  useEffect(() => {
    if (!showId) {
      notification.error({
        message: "Lỗi",
        description: "Show ID is required to fetch manager data",
        placement: "topRight",
      });
      return;
    }
    fetchShowStaff(1, pageSize, "Manager", showId);
  }, [fetchShowStaff, pageSize, showId]);

  useEffect(() => {
    if (error) {
      notification.error({
        message: "Lỗi",
        description: error,
        placement: "topRight",
      });
    }
  }, [error]);

  const handlePageChange = (page, size) => {
    fetchShowStaff(page, size, "Manager", showId);
  };

  // Fetch accounts that are not already assigned to the show
  const fetchAvailableAccounts = async () => {
    setIsLoading(true);
    try {
      // Fetch all managers from account team
      await fetchAccountTeam(1, 100, "Manager"); // Get up to 100 managers

      // Filter out managers already in the show
      const currentManagerIds = managers.map((manager) => manager.accountId);

      const availableManagers = accountManage.managers.filter(
        (manager) =>
          !currentManagerIds.some((id) => id === manager.id) &&
          manager.status === "active"
      );

      setAccountOptions(availableManagers);
      return availableManagers.length; // Return count for parent component
    } catch (error) {
      notification.error({
        message: "Lỗi",
        description: "Failed to fetch available managers",
        placement: "topRight",
      });
      return 0;
    } finally {
      setIsLoading(false);
    }
  };

  const showAddModal = () => {
    setIsAddModalVisible(true);
    fetchAvailableAccounts();
  };

  const handleAddCancel = () => {
    setIsAddModalVisible(false);
    setSelectedAccountId(null);
  };

  const handleAddManager = async () => {
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
      "Manager"
    );
    if (success) {
      setIsAddModalVisible(false);
      setSelectedAccountId(null);
    }
  };

  const handleDeleteManager = async (showStaffId) => {
    await deleteShowStaffMember(showStaffId, "Manager", showId);
  };

  const columns = [
    {
      title: "Tên",
      dataIndex: "name",
      key: "name",
      render: (name) => name || "Chưa cập nhật",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (email) => email || "Chưa cập nhật",
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
      render: (role) => (role === "Manager" ? "Quản lý" : role || "Không rõ"),
    },
    {
      title: "Hành động",
      key: "action",
      render: (_, record) => (
        <div className="flex gap-3">
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa quản lý này?"
            onConfirm={() => handleDeleteManager(record.showStaffId)}
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
    <div className="manager-component">
      {!hideAddButton && (
        <div className="flex justify-end mb-4">
          <Button type="primary" icon={<PlusOutlined />} onClick={showAddModal}>
            Thêm quản lý
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
        dataSource={managers.map((item) => ({
          key: item.showStaffId,
          showStaffId: item.showStaffId,
          accountId: item.accountId,
          name: item.fullName,
          email: item.email,
          status: item.status,
          role: item.role,
        }))}
        loading={managersLoading}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: totalItems,
          showSizeChanger: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} trong ${total}`,
          onChange: handlePageChange,
          onShowSizeChange: handlePageChange,
        }}
        locale={{
          emptyText: (
            <Empty
              description="Không có dữ liệu"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              style={{ margin: "24px 0" }}
            />
          ),
        }}
      />

      <Modal
        title="Thêm quản lý"
        open={isAddModalVisible}
        onCancel={handleAddCancel}
        onOk={handleAddManager}
        okText="Thêm"
        cancelText="Hủy"
        confirmLoading={isLoading || accountsLoading}
      >
        <div className="mb-4">
          <p className="mb-2">Chọn tài khoản:</p>
          {accountOptions.length === 0 && !isLoading && (
            <p className="text-yellow-500">
              Không có quản lý nào khả dụng để thêm.
            </p>
          )}
          <Select
            placeholder="Chọn tài khoản"
            style={{ width: "100%" }}
            loading={isLoading || accountsLoading}
            onChange={(value) => setSelectedAccountId(value)}
            options={accountOptions.map((account) => ({
              value: account.id,
              label: `${account.fullName} (${account.email})`,
            }))}
            notFoundContent={
              isLoading || accountsLoading
                ? "Đang tải..."
                : "Không có quản lý nào khả dụng"
            }
          />
        </div>
      </Modal>
    </div>
  );
});

export default Manager;
