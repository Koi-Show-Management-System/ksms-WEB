import React, { useState, useEffect } from "react";
import { Button, Form, message } from "antd";
import StepOne from "./StepOne";
import StepTwo from "./StepTwo";
import StepThree from "./StepThree";
import { useNavigate } from "react-router-dom";

function CreateShow() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startDate: null,
    endDate: null,
    startExhibitionDate: null,
    endExhibitionDate: null,
    minParticipants: "",
    maxParticipants: "",
    location: "",
    images: [],
    hasGrandChampion: false,
    hasBestInShow: false,
    createSponsorRequests: [],
    createTicketTypeRequests: [],
    createCategorieShowRequests: [], // ✅ Thêm danh sách thể loại từ StepTwo
  });

  // Cập nhật dữ liệu từ các bước
  const updateFormData = (newData) => {
    setFormData((prev) => ({ ...prev, ...newData }));
  };

  // Kiểm tra trước khi chuyển bước
  const handleNext = () => {
    if (currentStep === 1) {
      if (!formData.name || !formData.description) {
        message.error("Vui lòng điền đầy đủ tên và mô tả chương trình.");
        return;
      }
    }

    if (currentStep === 2) {
      if (formData.createCategorieShowRequests.length === 0) {
        message.error("Vui lòng nhập ít nhất một thể loại.");
        return;
      }
    }

    setCurrentStep((prevStep) => Math.min(prevStep + 1, 3));
  };

  const handlePrevious = () => {
    setCurrentStep((prevStep) => Math.max(prevStep - 1, 1));
  };

  const handleSubmit = async () => {
    console.log("Final formData before API call:", formData); // DEBUG

    try {
      setIsSubmitting(true);

      if (!formData.name || !formData.description || !formData.location) {
        message.error("Vui lòng điền đầy đủ thông tin.");
        setIsSubmitting(false);
        return;
      }

      const response = await fetch(
        "https://your-api-endpoint.com/create-show",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const result = await response.json();

      if (response.ok) {
        message.success("Tạo chương trình thành công!");
        navigate("/admin/showlist");
      } else {
        message.error(`Lỗi: ${result.message}`);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      message.error("Có lỗi xảy ra khi gửi dữ liệu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      {/* Progress Bar */}
      <div className="flex justify-between mb-8">
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className={`w-8 h-8 flex items-center justify-center rounded-full ${
                currentStep === step
                  ? "bg-blue-500 text-white"
                  : "bg-gray-300 text-gray-600"
              }`}
            >
              {step}
            </div>
          ))}
        </div>
        <div className="ml-4 text-gray-500">{`Bước ${currentStep} của 3`}</div>
      </div>

      <Form layout="vertical" form={form}>
        {currentStep === 1 && (
          <StepOne updateFormData={updateFormData} initialData={formData} />
        )}
        {currentStep === 2 && (
          <StepTwo updateFormData={updateFormData} initialData={formData} />
        )}
        {currentStep === 3 && (
          <StepThree updateFormData={updateFormData} initialData={formData} />
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          {currentStep > 1 && (
            <Button
              onClick={handlePrevious}
              className="bg-gray-300 hover:bg-gray-400"
            >
              Quay lại
            </Button>
          )}
          {currentStep < 3 ? (
            <Button
              type="primary"
              onClick={handleNext}
              className="bg-blue-500 hover:bg-blue-600"
            >
              Tiếp theo
            </Button>
          ) : (
            <Button
              type="primary"
              onClick={handleSubmit}
              loading={isSubmitting}
              className="bg-green-500 hover:bg-green-600"
            >
              Gửi
            </Button>
          )}
        </div>
      </Form>

      {/* Debug Panel */}
      <div className="mt-6 p-4 bg-gray-100 rounded-md">
        <h3 className="text-lg font-semibold">Dữ liệu hiện tại:</h3>
        <pre className="overflow-auto max-h-96">
          {JSON.stringify(formData, null, 2)}
        </pre>
      </div>
    </div>
  );
}

export default CreateShow;
