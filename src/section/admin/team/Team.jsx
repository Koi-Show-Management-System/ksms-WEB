import React, { useEffect, useState } from "react";
import { Tabs } from "antd";
import Manager from "./Manager";
import Staff from "./Staff";
import Referees from "./Referees";
import useAccountTeam from "../../../hooks/useAccountTeam";
import Cookies from "js-cookie";

function Team() {
  const { accountManage, fetchAccountTeam, isLoading } = useAccountTeam();
  const [activeRole, setActiveRole] = useState("Manager"); // Default to "manager"
  const userRole = Cookies.get("__role"); // Lấy role từ cookies

  // Fetch accounts when component mounts or when the active role changes
  useEffect(() => {
    fetchAccountTeam(1, 10, activeRole); // Call API with role
  }, [activeRole]); // Khi role thay đổi, sẽ gọi lại API với role mới

  // Tạo danh sách tabs dựa vào role của người dùng
  const getTabItems = () => {
    const tabItems = [
      {
        key: "Staff",
        label: <span className="text-lg">Nhân viên</span>,
        children: (
          <Staff
            accounts={accountManage.staff}
            isLoading={isLoading}
            role={activeRole}
            userRole={userRole}
          />
        ),
      },
      {
        key: "Referee",
        label: <span className="text-lg">Trọng tài</span>,
        children: (
          <Referees
            accounts={accountManage.referees}
            isLoading={isLoading}
            role={activeRole}
            userRole={userRole}
          />
        ),
      },
    ];

    // Chỉ hiển thị tab Manager nếu người dùng không phải là Manager
    if (userRole !== "Manager") {
      tabItems.unshift({
        key: "Manager",
        label: <span className="text-lg">Quản lý</span>,
        children: (
          <Manager
            accounts={accountManage.managers}
            isLoading={isLoading}
            role={activeRole}
          />
        ),
      });
    }

    return tabItems;
  };

  const handleTabChange = (key) => {
    setActiveRole(key); // Set the role based on the selected tab
  };

  // Điều chỉnh tab mặc định dựa trên role của người dùng
  const getDefaultActiveKey = () => {
    if (userRole === "Manager") {
      return "Staff"; // Nếu người dùng là Manager, mặc định hiển thị tab Staff
    }
    return "Manager"; // Ngược lại, giữ nguyên tab Manager
  };

  return (
    <div>
      <div className="flex items-center justify-between mx-2">
        <div className="flex-1">
          <Tabs
            defaultActiveKey={getDefaultActiveKey()}
            items={getTabItems()}
            onChange={handleTabChange} // Listen for tab change
          />
        </div>
      </div>
    </div>
  );
}

export default Team;
