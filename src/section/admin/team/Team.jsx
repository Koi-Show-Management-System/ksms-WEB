import React, { useEffect, useState } from "react";
import { Tabs } from "antd";
import Manager from "./Manager";
import Staff from "./Staff";
import Referees from "./Referees";
import useAccountTeam from "../../../hooks/useAccountTeam";
import Cookies from "js-cookie";

function Team() {
  const { accountManage, fetchAccountTeam, isLoading } = useAccountTeam();
  const userRole = Cookies.get("__role");
  const [activeRole, setActiveRole] = useState(
    userRole === "Manager" ? "Staff" : "Manager"
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchAccountTeam(1, 10, activeRole);
      } catch (error) {
        console.error("Error fetching team data:", error);
      }
    };
    fetchData();
  }, [activeRole, fetchAccountTeam]);

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
    setActiveRole(key);
  };

  return (
    <div>
      <div className="flex items-center justify-between mx-2">
        <div className="flex-1">
          <Tabs
            defaultActiveKey={userRole === "Manager" ? "Staff" : "Manager"}
            items={getTabItems()}
            onChange={handleTabChange}
            destroyInactiveTabPane={false}
          />
        </div>
      </div>
    </div>
  );
}

export default Team;
