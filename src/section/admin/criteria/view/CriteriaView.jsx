import React from "react";
import Criteria from "../Criteria";

function CriteriaView() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center  mt-5">
        <h2 className="text-3xl font-semibold">Danh Sách Tiêu Chí</h2>
      </div>
      <Criteria />
    </div>
  );
}

export default CriteriaView;
