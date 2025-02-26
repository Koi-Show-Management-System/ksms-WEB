import { Typography } from "antd";
import React from "react";
import User from "../User";
import Title from "antd/es/typography/Title";

function UserView() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6 mt-5">
        <h2 className="text-3xl font-semibold">Quản lý Người Dùng</h2>
      </div>
      <User />
    </div>
  );
}

export default UserView;
