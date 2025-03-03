import React, { useState } from "react";
import { Button, Form, message, Modal, notification } from "antd";
import StepOne from "./StepOne";
import StepTwo from "./StepTwo";
import StepThree from "./StepThree";
import { useNavigate } from "react-router-dom";
import useCreateKoi from "../../../../hooks/useCreateKoi";

function CreateShow() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(1);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const { fetchCreateKoi, isLoading } = useCreateKoi();
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
    imgUrl: "",
    registrationFee: "",
    status: "pending",
    hasGrandChampion: false,
    hasBestInShow: false,
    assignStaffRequests: [],
    assignManagerRequests: [],
    createSponsorRequests: [],
    createTicketTypeRequests: [],
    createCategorieShowRequests: [],
    createShowRuleRequests: [],
  });

  const updateFormData = (newData) => {
    setFormData((prev) => ({ ...prev, ...newData }));
  };

  const validateStep = () => {
    if (currentStep === 1 && (!formData.name || !formData.description)) {
      message.error("Vui lòng điền đầy đủ tên và mô tả chương trình.");
      return false;
    }
    if (
      currentStep === 2 &&
      formData.createCategorieShowRequests.length === 0
    ) {
      message.error("Vui lòng nhập ít nhất một thể loại.");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      if (currentStep === 3) {
        setIsConfirmModalOpen(true);
      } else {
        setCurrentStep((prev) => prev + 1);
      }
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    setIsConfirmModalOpen(false);
    try {
      const response = await fetchCreateKoi(formData);

      if (response?.statusCode === 201) {
        console.log("response", response);

        setTimeout(() => {
          navigate("/admin/showList");
        }, 2000);
      }
    } catch (error) {
      console.error("Lỗi tạo chương trình:", error);
    }
  };

  return (
    <div className="p-6">
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
      </Form>

      <div className="flex justify-between mt-8">
        {currentStep > 1 && (
          <Button
            onClick={handlePrevious}
            className="bg-gray-300 hover:bg-gray-400"
          >
            Quay lại
          </Button>
        )}
        <Button
          type="primary"
          onClick={handleNext}
          className="bg-blue-500 hover:bg-blue-600"
          loading={isLoading}
        >
          {currentStep === 3 ? "Xác nhận & Gửi" : "Tiếp theo"}
        </Button>
      </div>

      <Modal
        title="Xác nhận gửi chương trình"
        open={isConfirmModalOpen}
        onOk={handleSubmit}
        onCancel={() => setIsConfirmModalOpen(false)}
        okText="Gửi"
        cancelText="Hủy"
        confirmLoading={isLoading}
      >
        <p>Bạn có chắc chắn muốn gửi chương trình này không?</p>
      </Modal>
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
