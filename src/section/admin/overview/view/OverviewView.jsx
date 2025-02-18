import { Typography } from "antd";
import React from "react";
import Overview from "../Overview";

function OverviewView() {
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
       <h1 className="text-2xl font-bold mb-6 text-gray-800">
        Dashboard Overview
      </h1>
      <Overview />
    </div>
  );
}

export default OverviewView;
