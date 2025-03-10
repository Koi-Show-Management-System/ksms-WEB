import React, { useEffect, useState } from "react";
import { Tabs } from "antd";
import useAccountTeam from "../../../hooks/useAccountTeam";
import Staff from "./Staff";
import Referee from "./Referee";

function Team() {
  const { accountManage, fetchAccountTeam, isLoading } = useAccountTeam();
  const [activeRole, setActiveRole] = useState("Staff");

  useEffect(() => {
    fetchAccountTeam(1, 10, activeRole);
  }, [activeRole]);

  const items = [
    {
      key: "Staff",
      label: <span className="text-lg">Nhân viên</span>,
      children: (
        <Staff
          accounts={accountManage.staff}
          isLoading={isLoading}
          role={activeRole}
        />
      ),
    },
    {
      key: "Referee",
      label: <span className="text-lg">Trọng tài</span>,
      children: (
        <Referee
          accounts={accountManage.referees}
          isLoading={isLoading}
          role={activeRole}
        />
      ),
    },
  ];

  const handleTabChange = (key) => {
    setActiveRole(key);
  };

  return (
    <div>
      <div className="flex items-center justify-between mx-2">
        <div className="flex-1">
          <Tabs
            defaultActiveKey="Manager"
            items={items}
            onChange={handleTabChange}
          />
        </div>
      </div>
    </div>
  );
}

export default Team;
