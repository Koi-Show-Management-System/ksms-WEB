import { Button, DatePicker, Input } from "antd";
import React from "react";
import koiFishImage from "../../../../assets/koiFishImage.png";
import { Link } from "react-router-dom";

function MyShow() {
  const [showDetails, setShowDetails] = React.useState(false);

  const toggleDetails = () => {
    setShowDetails(!showDetails);
  };

  return (
    <div>
      <div className="mb-5">
        <div className="mb-2 text-sm">Select Date:</div>
        <div className="flex gap-2">
          <DatePicker className="w-96" format="DD/MM/YYYY" />
          <Button type="primary" className="bg-blue-500">
            Search
          </Button>
        </div>
      </div>
      <div className="min-h-screen bg-gray-100 ">
        <div className="flex justify-start">
          <div className="w-96 bg-white rounded-lg shadow-md overflow-hidden">
            {/* Show Image */}
            <img
              src={koiFishImage}
              alt="Koi Show"
              className="w-full h-40 object-cover"
            />

            {/* Basic Information */}
            <div className="p-4">
              <div className="flex justify-between items-start mb-3">
                <h2 className="text-lg font-bold text-gray-800">
                  Koi Fish Show 2025
                </h2>
                <span className="px-2 py-1 rounded-full text-xs text-[#1677ff] bg-[#e6f4ff] border border-[#91caff]">
                  Inprogress
                </span>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <p>
                  <strong>Event:</strong> 07/02/2024 - 09/02/2024
                </p>
                <p>
                  <strong>Registration:</strong> 01/01/2024 - 05/02/2024
                </p>
                <p>
                  <strong>Location:</strong> Int'l Exhibition Center
                </p>
                <p>
                  <strong>Price:</strong> 200,000 VND
                </p>
                <p>
                  <strong>Capacity:</strong> 1000 people
                </p>
              </div>
              <Link to="/admin/koiShow/detail/1">
                <Button className="mt-3 w-full bg-blue-500" type="primary">
                  View Details
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MyShow;
