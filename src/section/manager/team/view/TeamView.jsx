import React from "react";
import Team from "../Team";

function TeamView() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6 mt-5">
        <h2 className="text-3xl font-semibold">Quản lý nhóm</h2>
      </div>
      <Team />
    </div>
  );
}

export default TeamView;
