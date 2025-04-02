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
      // Make categories optional - only validate if categories exist
      if (formData.createCategorieShowRequests.length > 0) {
        formData.createCategorieShowRequests.forEach(
          (category, categoryIndex) => {
            let categoryHasError = false;
            let errorMessage = `Hạng mục "${category.name || `#${categoryIndex + 1}`}" thiếu thông tin: `;
            let errorDetails = [];

            // Basic information validation
            if (!category.name) {
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
            if (!category.description) {
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

            // Check rounds (Preliminary, Evaluation, Final)
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

            // Check referees
            if (
              !category.createRefereeAssignmentRequests ||
              category.createRefereeAssignmentRequests.length === 0
            ) {
              errorDetails.push("trọng tài");
              categoryHasError = true;
            }

            // Check awards (must have all 4 types)
            if (
              !category.createAwardCateShowRequests ||
              category.createAwardCateShowRequests.length < 4
            ) {
              errorDetails.push("đủ 4 loại giải thưởng");
              categoryHasError = true;
            }

            // Criteria checks for each round
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
              // Show notification with specific category errors
              notification.error({
                message: `Lỗi ở hạng mục ${categoryIndex + 1}`,
                description: errorMessage + errorDetails.join(", "),
                placement: "topRight",
                duration: 10, // Longer duration so user can read all errors
              });
            }
          }
        );
      }
    }

    if (currentStep === 3) {
      // Stop showing the generic error notification
      // hasError = true;

      let step3HasErrors = false;

      // Check rules
      if (formData.createShowRuleRequests.length < 3) {
        step3HasErrors = true;
        notification.error({
          message: "Lỗi quy tắc",
          description: "Cần có ít nhất 3 quy tắc cho chương trình.",
          placement: "topRight",
          duration: 6,
        });
      }

      // Check status count
      if (formData.createShowStatusRequests.length < 3) {
        step3HasErrors = true;
        notification.error({
          message: "Lỗi trạng thái",
          description: "Cần có ít nhất 3 trạng thái cho chương trình.",
          placement: "topRight",
          duration: 6,
        });
      }

      // Check invalid statuses
      const invalidStatuses = formData.createShowStatusRequests.filter(
        (status) => !status.startDate || !status.endDate
      );

      if (invalidStatuses.length > 0) {
        step3HasErrors = true;
        notification.error({
          message: "Lỗi trạng thái",
          description: `${invalidStatuses.length} trạng thái chưa có đầy đủ ngày bắt đầu và kết thúc.`,
          placement: "topRight",
          duration: 6,
        });
      }

      hasError = step3HasErrors;
    }

    // Change the generic error message to only show if we don't have specific errors
    if (hasError && currentStep !== 2 && currentStep !== 3) {
      notification.error({
        message: "Lỗi nhập liệu",
        description: "Vui lòng điền đầy đủ thông tin trước khi tiếp tục.",
        placement: "topRight",
      });
      return false;
    }

    // If we've shown specific errors for steps 2 or 3, just return false
    if (hasError) {
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
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      console.error("Error details:", error.response?.data || error.message);
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
