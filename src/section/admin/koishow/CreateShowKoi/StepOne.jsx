import React from "react";
import { Input, DatePicker, Checkbox, Select } from "antd";
const { Option } = Select;

function StepOne() {
  return (
    <div className="space-y-4">
      {/* Show Information */}
      <div className="mb-4 ">
        <h2 className="text-2xl font-semibold mb-6">
          Step 1: Show Information & Details
        </h2>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Show Name
        </label>
        <Input placeholder="Enter show name" />
      </div>

      {/* Show Description */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Show Description
        </label>
        <Input.TextArea rows={3} placeholder="Enter show description" />
      </div>

      {/* Registration Period */}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Registration Start Date
          </label>
          <DatePicker className="w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Registration End Date
          </label>
          <DatePicker className="w-full" />
        </div>
      </div>

      {/* Show Duration */}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Show Start Date
          </label>
          <DatePicker className="w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Show End Date
          </label>
          <DatePicker className="w-full" />
        </div>
      </div>

      {/* Exhibition Time */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Exhibition Time
        </label>
        <Input placeholder="Daily 9:00 AM - 5:00 PM" />
      </div>

      {/* Minimum and Maximum Quantity */}
      <div className="mb-4 grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Minimum Quantity
          </label>
          <Input type="number" placeholder="e.g. 10" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Maximum Quantity
          </label>
          <Input type="number" placeholder="e.g. 200" />
        </div>
      </div>

      {/* Location */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Location
        </label>
        <Input placeholder="Enter location" />
      </div>

      {/* Image Show */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Image Show
        </label>
        <Input type="file" />
      </div>

      {/* Major Awards */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Major Awards
        </label>
        <Checkbox.Group>
          <div className="space-y-2">
            <Checkbox value="grandChampion">
              Include Grand Champion Award
            </Checkbox>
            <Checkbox value="bestInShow">Include Best in Show Award</Checkbox>
          </div>
        </Checkbox.Group>
      </div>

      {/* Competition Registration */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Competition Registration
        </label>
        <div className="grid grid-cols-3 gap-4">
          <Input placeholder="Enter Participant Fee" />
          <Input placeholder="Prize" />
          <Input placeholder="Total Number of Tickets" />
        </div>
      </div>

      {/* Sponsor Management */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Sponsor Management
        </label>
        <div className="grid grid-cols-3 gap-4">
          <Input placeholder="Primary Sponsor" />
          <Input placeholder="Logo Sponsor" />
          <Input placeholder="Prize" />
        </div>
      </div>

      {/* Assign Managers */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Assign Managers
        </label>
        <Select
          mode="multiple"
          placeholder="Select Managers"
          className="w-full"
        >
          <Option value="manager1">Alice Johnson</Option>
          <Option value="manager2">John Doe</Option>
        </Select>
      </div>

      {/* Ticket Management */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Ticket Management</h3>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Viewing Ticket
          </label>
          <div className="grid grid-cols-3 gap-4">
            <Input placeholder="Price" />
            <Input placeholder="Prize" />
            <Input placeholder="Total Number of Tickets" />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Competition Ticket
          </label>
          <div className="grid grid-cols-3 gap-4">
            <Input placeholder="Price" />
            <Input placeholder="Prize" />
            <Input placeholder="Total Number of Tickets" />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Exhibition Ticket
          </label>
          <div className="grid grid-cols-3 gap-4">
            <Input placeholder="Price" />
            <Input placeholder="Prize" />
            <Input placeholder="Total Number of Tickets" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default StepOne;
