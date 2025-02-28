import React, { useEffect, useState } from "react";
import { Tabs } from "antd";
import Manager from "./Manager";
import Staff from "./Staff";
import Referees from "./Referees";
import useAccountTeam from "../../../hooks/useAccountTeam";

function Team() {
  const { accountManage, fetchAccountTeam, isLoading } = useAccountTeam();
  const [activeRole, setActiveRole] = useState("Manager"); // Default to "manager"

  // Fetch accounts when component mounts or when the active role changes
  useEffect(() => {
    fetchAccountTeam(1, 10, activeRole); // Call API with role
  }, [activeRole]); // Khi role thay đổi, sẽ gọi lại API với role mới

  const items = [
    {
      key: "Manager",
      label: <span className="text-lg">Quản lý</span>,
      children: (
        <Manager
          accounts={accountManage.managers}
          isLoading={isLoading}
          role={activeRole} // Truyền role vào Manager
        />
      ),
    },
    {
      key: "Staff",
      label: <span className="text-lg">Nhân viên</span>,
      children: (
        <Staff
          accounts={accountManage.staff}
          isLoading={isLoading}
          role={activeRole} // Truyền role vào Staff
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
          role={activeRole} // Truyền role vào Referees
        />
      ),
    },
  ];

  const handleTabChange = (key) => {
    setActiveRole(key); // Set the role based on the selected tab
  };

  return (
    <div>
      <div className="flex items-center justify-between mx-2">
        <div className="flex-1">
          <Tabs
            defaultActiveKey="Manager"
            items={items}
            onChange={handleTabChange} // Listen for tab change
          />
        </div>
      </div>
    </div>
  );
}

export default Team;
