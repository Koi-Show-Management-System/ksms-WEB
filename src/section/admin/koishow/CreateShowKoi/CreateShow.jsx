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
  const [showErrors, setShowErrors] = useState(false);
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
    createShowStatusRequests: [],
  });

  const updateFormData = (newData) => {
    setFormData((prev) => ({ ...prev, ...newData }));
  };

  const validateStep = () => {
    let hasError = false; // Biến để kiểm tra xem có lỗi không

    if (currentStep === 1) {
      if (
        !formData.name ||
        !formData.description ||
        !formData.startDate ||
        !formData.endDate ||
        !formData.startExhibitionDate ||
        !formData.endExhibitionDate ||
        !formData.minParticipants ||
        !formData.maxParticipants ||
        !formData.location ||
        !formData.imgUrl
      ) {
        hasError = true;
      }

      // Kiểm tra danh sách nhà tài trợ
      formData.createSponsorRequests.forEach((sponsor) => {
        if (!sponsor.name || !sponsor.logoUrl || !sponsor.investMoney) {
          hasError = true;
        }
      });

      // Kiểm tra danh sách loại vé
      formData.createTicketTypeRequests.forEach((ticket) => {
        if (!ticket.name || !ticket.price || !ticket.availableQuantity) {
          hasError = true;
        }
      });
    }

    if (currentStep === 2) {
      if (formData.createCategorieShowRequests.length === 0) {
        hasError = true;
      } else {
        formData.createCategorieShowRequests.forEach((category) => {
          if (
            !category.name ||
            !category.sizeMin ||
            !category.sizeMax ||
            !category.description ||
            // !category.startTime ||
            // !category.endTime ||
            !category.registrationFee ||
            !category.maxEntries ||
            category.createCompetionCategoryVarieties.length === 0
          ) {
            hasError = true;
          }
        });
      }
    }

    if (currentStep === 3) {
      let hasError = false;

      if (formData.createShowRuleRequests.length < 3) {
        hasError = true;
      }

      if (formData.createShowStatusRequests.length < 3) {
        hasError = true;
      }

      const invalidStatuses = formData.createShowStatusRequests.some(
        (status) => !status.startDate || !status.endDate
      );

      if (invalidStatuses) {
        hasError = true;
      }

      return !hasError;
    }

    if (hasError) {
      notification.error({
        message: "Lỗi nhập liệu",
        description: "Vui lòng điền đầy đủ thông tin trước khi tiếp tục.",
        placement: "topRight",
      });
      return false;
    }

    return true;
  };

  // const handleNext = () => {
  //   setShowErrors(false); // Reset lỗi trước khi kiểm tra

  //   if (validateStep()) {
  //     setShowErrors(false);

  //     if (currentStep === 3) {
  //       setIsConfirmModalOpen(true); // Mở modal xác nhận
  //     } else {
  //       setCurrentStep((prev) => prev + 1);
  //     }
  //   } else {
  //     setShowErrors(true);
  //   }
  // };

  const handleNext = () => {
    setShowErrors(true);

    if (currentStep === 3) {
      setIsConfirmModalOpen(true);
    } else {
      setCurrentStep((prev) => prev + 1);
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
          <StepOne
            updateFormData={updateFormData}
            initialData={formData}
            showErrors={showErrors}
          />
        )}
        {currentStep === 2 && (
          <StepTwo
            updateFormData={updateFormData}
            initialData={formData}
            showErrors={showErrors}
          />
        )}
        {currentStep === 3 && (
          <StepThree
            updateFormData={updateFormData}
            initialData={formData}
            showErrors={showErrors}
          />
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
      {/* <div className="mt-6 p-4 bg-gray-100 rounded-md">
        <h3 className="text-lg font-semibold">Dữ liệu hiện tại:</h3>
        <pre className="overflow-auto max-h-96">
          {JSON.stringify(formData, null, 2)}
        </pre>
      </div> */}
    </div>
  );
}

export default CreateShow;
