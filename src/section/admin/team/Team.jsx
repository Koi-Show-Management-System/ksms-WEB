import React, { useEffect } from "react";
import { Tabs } from "antd";
import Manager from "./Manager";
import Staff from "./Staff";
import Referees from "./Referees";
import useAccountTeam from "../../../hooks/useAccountTeam";

function Team() {
  const { accountManage, fetchAccountTeam, isLoading } = useAccountTeam();

  // Fetch accounts when component mounts
  useEffect(() => {
    fetchAccountTeam(1, 10);
  }, []);

  const items = [
    {
      key: "manager",
      label: <span className="text-lg">Quản lý</span>,
      children: (
        <Manager accounts={accountManage.managers} isLoading={isLoading} />
      ),
    },
    {
      key: "staff",
      label: <span className="text-lg">Nhân viên</span>,
      children: <Staff accounts={accountManage.staff} isLoading={isLoading} />,
    },
    {
      key: "referees",
      label: <span className="text-lg">Trọng tài</span>,
      children: (
        <Referees accounts={accountManage.referees} isLoading={isLoading} />
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mx-2">
        <div className="flex-1">
          <Tabs defaultActiveKey="manager" items={items} />
        </div>
      </div>
    </div>
  );
}

export default Team;
