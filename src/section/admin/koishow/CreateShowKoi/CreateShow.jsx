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
    let hasError = false;

    if (currentStep === 1) {
      // Kiểm tra thông tin cơ bản
      if (!formData.name?.trim()) {
        notification.error({
          message: "Lỗi nhập liệu",
          description: "Tên chương trình là bắt buộc",
          placement: "topRight",
        });
        hasError = true;
      }
      if (!formData.description?.trim()) {
        notification.error({
          message: "Lỗi nhập liệu",
          description: "Mô tả chương trình là bắt buộc",
          placement: "topRight",
        });
        hasError = true;
      }
      if (!formData.startDate || !formData.endDate) {
        notification.error({
          message: "Lỗi nhập liệu",
          description: "Ngày bắt đầu và kết thúc đăng ký là bắt buộc",
          placement: "topRight",
        });
        hasError = true;
      }
      if (!formData.startExhibitionDate || !formData.endExhibitionDate) {
        notification.error({
          message: "Lỗi nhập liệu",
          description: "Ngày bắt đầu và kết thúc sự kiện là bắt buộc",
          placement: "topRight",
        });
        hasError = true;
      }
      if (!formData.minParticipants || !formData.maxParticipants) {
        notification.error({
          message: "Lỗi nhập liệu",
          description:
            "Số lượng người tham gia tối thiểu và tối đa là bắt buộc",
          placement: "topRight",
        });
        hasError = true;
      }
      if (!formData.location?.trim()) {
        notification.error({
          message: "Lỗi nhập liệu",
          description: "Địa điểm tổ chức là bắt buộc",
          placement: "topRight",
        });
        hasError = true;
      }
      if (!formData.imgUrl) {
        notification.error({
          message: "Lỗi nhập liệu",
          description: "Hình ảnh chương trình là bắt buộc",
          placement: "topRight",
        });
        hasError = true;
      }

      // Kiểm tra nhà tài trợ
      if (formData.createSponsorRequests.length === 0) {
        notification.error({
          message: "Lỗi nhập liệu",
          description: "Cần có ít nhất một nhà tài trợ",
          placement: "topRight",
        });
        hasError = true;
      } else {
        formData.createSponsorRequests.forEach((sponsor, index) => {
          if (
            !sponsor.name?.trim() ||
            !sponsor.logoUrl ||
            !sponsor.investMoney
          ) {
            notification.error({
              message: "Lỗi nhập liệu",
              description: `Nhà tài trợ ${index + 1} thiếu thông tin bắt buộc`,
              placement: "topRight",
            });
            hasError = true;
          }
        });
      }

      // Kiểm tra loại vé
      if (formData.createTicketTypeRequests.length === 0) {
        notification.error({
          message: "Lỗi nhập liệu",
          description: "Cần có ít nhất một loại vé",
          placement: "topRight",
        });
        hasError = true;
      } else {
        formData.createTicketTypeRequests.forEach((ticket, index) => {
          if (
            !ticket.name?.trim() ||
            !ticket.price ||
            !ticket.availableQuantity
          ) {
            notification.error({
              message: "Lỗi nhập liệu",
              description: `Loại vé ${index + 1} thiếu thông tin bắt buộc`,
              placement: "topRight",
            });
            hasError = true;
          }
        });
      }
    }

    if (currentStep === 2) {
      // Kiểm tra hạng mục
      if (formData.createCategorieShowRequests.length === 0) {
        notification.error({
          message: "Lỗi nhập liệu",
          description: "Cần có ít nhất một hạng mục",
          placement: "topRight",
        });
        hasError = true;
      } else {
        formData.createCategorieShowRequests.forEach(
          (category, categoryIndex) => {
            let categoryHasError = false;
            let errorMessage = `Hạng mục "${category.name || `#${categoryIndex + 1}`}" thiếu thông tin: `;
            let errorDetails = [];

            if (!category.name?.trim()) {
              errorDetails.push("tên hạng mục");
              categoryHasError = true;
            }
            if (!category.sizeMin) {
              errorDetails.push("kích thước tối thiểu");
              categoryHasError = true;
            }
            if (!category.sizeMax) {
              errorDetails.push("kích thước tối đa");
              categoryHasError = true;
            }
            if (!category.description?.trim()) {
              errorDetails.push("mô tả");
              categoryHasError = true;
            }
            if (!category.registrationFee) {
              errorDetails.push("phí đăng ký");
              categoryHasError = true;
            }
            if (category.hasTank === undefined) {
              errorDetails.push("thông tin bể trưng bày");
              categoryHasError = true;
            }
            if (
              !category.createCompetionCategoryVarieties ||
              category.createCompetionCategoryVarieties.length === 0
            ) {
              errorDetails.push("giống cá Koi");
              categoryHasError = true;
            }

            // Kiểm tra vòng thi
            const roundTypes = ["Preliminary", "Evaluation", "Final"];
            const missingRoundTypes = roundTypes.filter(
              (type) =>
                !category.createRoundRequests?.some(
                  (round) => round.roundType === type
                )
            );

            if (missingRoundTypes.length > 0) {
              errorDetails.push(
                `các vòng thi (${missingRoundTypes.join(", ")})`
              );
              categoryHasError = true;
            }

            // Kiểm tra trọng tài
            if (
              !category.createRefereeAssignmentRequests ||
              category.createRefereeAssignmentRequests.length === 0
            ) {
              errorDetails.push("trọng tài");
              categoryHasError = true;
            }

            // Kiểm tra giải thưởng
            if (
              !category.createAwardCateShowRequests ||
              category.createAwardCateShowRequests.length < 4
            ) {
              errorDetails.push("đủ 4 loại giải thưởng");
              categoryHasError = true;
            }

            // Kiểm tra tiêu chí cho mỗi vòng
            roundTypes.forEach((roundType) => {
              const criteriaForRound =
                category.createCriteriaCompetitionCategoryRequests?.filter(
                  (c) => c.roundType === roundType
                ) || [];

              if (criteriaForRound.length < 3) {
                errorDetails.push(`ít nhất 3 tiêu chí cho ${roundType}`);
                categoryHasError = true;
              }
            });

            if (categoryHasError) {
              hasError = true;
              notification.error({
                message: `Lỗi ở hạng mục ${categoryIndex + 1}`,
                description: errorMessage + errorDetails.join(", "),
                placement: "topRight",
                duration: 10,
              });
            }
          }
        );
      }
    }

    if (currentStep === 3) {
      // Kiểm tra quy tắc
      if (formData.createShowRuleRequests.length < 3) {
        notification.error({
          message: "Lỗi quy tắc",
          description: "Cần có ít nhất 3 quy tắc cho chương trình",
          placement: "topRight",
          duration: 6,
        });
        hasError = true;
      }

      // Kiểm tra trạng thái
      if (formData.createShowStatusRequests.length < 3) {
        notification.error({
          message: "Lỗi trạng thái",
          description: "Cần có ít nhất 3 trạng thái cho chương trình",
          placement: "topRight",
          duration: 6,
        });
        hasError = true;
      }

      // Kiểm tra trạng thái không hợp lệ
      const invalidStatuses = formData.createShowStatusRequests.filter(
        (status) => !status.startDate || !status.endDate
      );

      if (invalidStatuses.length > 0) {
        notification.error({
          message: "Lỗi trạng thái",
          description: `${invalidStatuses.length} trạng thái chưa có đầy đủ ngày bắt đầu và kết thúc`,
          placement: "topRight",
          duration: 6,
        });
        hasError = true;
      }
    }

    return !hasError;
  };

  // const handleNext = () => {
  //   setShowErrors(true);

  //   if (!validateStep()) {
  //     return;
  //   }

  //   if (currentStep === 3) {
  //     setIsConfirmModalOpen(true);
  //   } else {
  //     setCurrentStep((prev) => prev + 1);
  //     setShowErrors(false);
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
    setShowErrors(false);
  };

  const handleSubmit = async () => {
    if (!validateStep()) {
      setIsConfirmModalOpen(false);
      return;
    }

    setIsConfirmModalOpen(false);
    console.log("Submit button clicked - Form data:", formData);

    try {
      console.log("Calling fetchCreateKoi API...");
      const response = await fetchCreateKoi(formData);
      console.log("API Response:", response);

      if (response?.statusCode === 201) {
        console.log("Success! Status code 201 received");

        setTimeout(() => {
          navigate("/admin/showList");
        }, 2000);
      } else {
        console.error("API returned unexpected status:", response?.statusCode);
        message.error("Có lỗi xảy ra khi tạo chương trình");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      console.error("Error details:", error.response?.data || error.message);
      message.error("Có lỗi xảy ra khi tạo chương trình");
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
          {currentStep === 3 ? "Xác nhận" : "Tiếp theo"}
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
