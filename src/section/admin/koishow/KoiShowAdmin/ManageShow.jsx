import React, { useState, useRef, useEffect } from "react";
import { Button, Tabs } from "antd";
import Manager from "./Manager";
import Staff from "./Staff";
import { PlusOutlined } from "@ant-design/icons";

function ManageShow({ showId }) {
  const [activeTab, setActiveTab] = useState("manager");
  const managerRef = useRef(null);
  const staffRef = useRef(null);

  // Load initial data when component mounts
  useEffect(() => {
    if (showId) {
      // Initial load for manager tab since it's the default
      setTimeout(() => {
        if (managerRef.current && managerRef.current.fetchAvailableAccounts) {
          managerRef.current.fetchAvailableAccounts();
        }
      }, 500);
    }
  }, [showId]);

  const handleTabChange = async (activeKey) => {
    setActiveTab(activeKey);

    // Always fetch data for the tab that is being activated
    if (activeKey === "manager") {
      setTimeout(() => {
        if (managerRef.current && managerRef.current.fetchAvailableAccounts) {
          managerRef.current.fetchAvailableAccounts();
        }
      }, 100);
    } else if (activeKey === "staff") {
      setTimeout(() => {
        if (staffRef.current && staffRef.current.fetchAvailableAccounts) {
          staffRef.current.fetchAvailableAccounts();
        }
      }, 100);
    }
  };

  const handleAddButtonClick = () => {
    if (activeTab === "manager" && managerRef.current) {
      if (managerRef.current.showAddModal) {
        // Refresh accounts list before showing modal to ensure it's up to date
        managerRef.current.fetchAvailableAccounts().then(() => {
          managerRef.current.showAddModal();
        });
      } else {
        // Fallback to DOM method if ref method is not available
        const addButton = document.querySelector(
          '.manager-component button[data-add-button="true"]'
        );
        if (addButton) addButton.click();
      }
    } else if (activeTab === "staff" && staffRef.current) {
      if (staffRef.current.showAddModal) {
        // Refresh accounts list before showing modal to ensure it's up to date
        staffRef.current.fetchAvailableAccounts().then(() => {
          staffRef.current.showAddModal();
        });
      } else {
        // Fallback to DOM method if ref method is not available
        const addButton = document.querySelector(
          '.staff-component button[data-add-button="true"]'
        );
        if (addButton) addButton.click();
      }
    }
  };

  const items = [
    {
      key: "manager",
      label: <span className="text-lg">Quản lý</span>,
      children: (
        <div>
          <Manager ref={managerRef} showId={showId} hideAddButton={true} />
        </div>
      ),
    },
    {
      key: "staff",
      label: <span className="text-lg">Nhân viên</span>,
      children: (
        <div>
          <Staff ref={staffRef} showId={showId} hideAddButton={true} />
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <Tabs
        defaultActiveKey="manager"
        activeKey={activeTab}
        onChange={handleTabChange}
        items={items}
        tabBarExtraContent={{
          right: (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddButtonClick}
            >
              {activeTab === "manager" ? "Thêm quản lý" : "Thêm nhân viên"}
            </Button>
          ),
        }}
      />
    </div>
  );
}

export default ManageShow;
