import React from "react";
import { Input, DatePicker, Checkbox, Select } from "antd";
const { Option } = Select;

function StepOne() {
  return (
    <div className="space-y-4">
      {/* Thông tin chương trình */}
      <div className="mb-4 ">
        <h2 className="text-2xl font-semibold mb-6">
          Bước 1: Thông tin và Chi tiết
        </h2>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tên chương trình
        </label>
        <Input placeholder="Nhập tên chương trình" />
      </div>

      {/* Mô tả chương trình */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Mô tả chương trình
        </label>
        <Input.TextArea rows={3} placeholder="Nhập mô tả chương trình" />
      </div>

      {/* Thời gian đăng ký */}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ngày bắt đầu đăng ký
          </label>
          <DatePicker className="w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ngày kết thúc đăng ký
          </label>
          <DatePicker className="w-full" />
        </div>
      </div>

      {/* Thời gian diễn ra chương trình */}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ngày bắt đầu chương trình
          </label>
          <DatePicker className="w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ngày kết thúc chương trình
          </label>
          <DatePicker className="w-full" />
        </div>
      </div>

      {/* Giờ triển lãm */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Giờ triển lãm
        </label>
        <Input placeholder="Hàng ngày từ 9:00 sáng đến 5:00 chiều" />
      </div>

      {/* Số lượng tối thiểu và tối đa */}
      <div className="mb-4 grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Số lượng tối thiểu
          </label>
          <Input type="number" placeholder="ví dụ: 10" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Số lượng tối đa
          </label>
          <Input type="number" placeholder="ví dụ: 200" />
        </div>
      </div>

      {/* Địa điểm */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Địa điểm
        </label>
        <Input placeholder="Nhập địa điểm" />
      </div>

      {/* Hình ảnh chương trình */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Hình ảnh chương trình
        </label>
        <Input type="file" />
      </div>

      {/* Giải thưởng lớn */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Giải thưởng lớn
        </label>
        <Checkbox.Group>
          <div className="space-y-2">
            <Checkbox value="grandChampion">
              Bao gồm giải thưởng Grand Champion
            </Checkbox>
            <Checkbox value="bestInShow">
              Bao gồm giải thưởng Best in Show
            </Checkbox>
          </div>
        </Checkbox.Group>
      </div>

      {/* Quản lý nhà tài trợ */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Quản lý nhà tài trợ
        </label>
        <div className="grid grid-cols-2 gap-4">
          <Input placeholder="Nhà tài trợ chính" />
          <Input placeholder="Giải thưởng" />
          <div className="mb-4">
            <label className="">Hình ảnh nhà tài trợ</label>
            <Input type="file" />
          </div>
        </div>
      </div>

      {/* Quản lý vé */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Quản lý vé</h3>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Vé Đăng Kí
          </label>
          <div className="grid grid-cols-3 gap-4">
            <Input placeholder="Nhập tên vé" />
            <Input placeholder="Giá vé" />
            <Input placeholder="Tổng số vé" />
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Vé tham dự
          </label>
          <div className="grid grid-cols-3 gap-4">
            <Input placeholder="Nhập tên vé" />
            <Input placeholder="Giá vé" />
            <Input placeholder="Tổng số vé" />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Vé thi đấu
          </label>
          <div className="grid grid-cols-3 gap-4">
            <Input placeholder="Nhập tên vé" />
            <Input placeholder="Giá vé" />
            <Input placeholder="Tổng số vé" />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Vé triển lãm
          </label>
          <div className="grid grid-cols-3 gap-4">
            <Input placeholder="Nhập tên vé" />
            <Input placeholder="Giá vé" />
            <Input placeholder="Tổng số vé" />
          </div>
        </div>
      </div>

      {/* Phân công quản lý */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Phân công quản lý
        </label>
        <Select mode="multiple" placeholder="Chọn quản lý" className="w-full">
          <Option value="manager1">Alice Johnson</Option>
          <Option value="manager2">John Doe</Option>
        </Select>
      </div>
    </div>
  );
}

export default StepOne;
