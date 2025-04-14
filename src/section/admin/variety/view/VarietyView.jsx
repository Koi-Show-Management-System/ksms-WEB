import React from "react";
import Variety from "../Variety";

function VarietyView() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center  mt-5">
        <h2 className="text-3xl font-semibold">Danh Sách Giống Koi</h2>
      </div>
      <Variety/>
    </div>
  );
}

export default VarietyView;
