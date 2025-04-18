import React, { useState } from "react";
import { Button } from "antd";
import Team from "../Team";
import AccountForm from "../AccoutForm";
import Cookies from "js-cookie";

function TeamView() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const userRole = Cookies.get("__role"); // Lấy role từ cookies

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6 mt-5">
        <h2 className="text-3xl font-semibold">Quản lý nhân sự</h2>
        <div className="flex justify-end">
          {userRole !== "Manager" && (
            <Button type="primary" onClick={() => setIsModalVisible(true)}>
              Thêm mới
            </Button>
          )}
        </div>
      </div>

      <AccountForm
        isVisible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
      />

      <Team />
    </div>
  );
}

export default TeamView;
