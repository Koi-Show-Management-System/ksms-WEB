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
      // Kiểm tra thông tin cuộc thi theo nhóm
      let stepOneHasError = false;
      let errorDetails = [];

      // Kiểm tra thông tin cơ bản
      if (!formData.name?.trim()) {
        errorDetails.push("tên chương trình");
        stepOneHasError = true;
      }
      if (!formData.description?.trim()) {
        errorDetails.push("mô tả chương trình");
        stepOneHasError = true;
      }
      if (!formData.startDate || !formData.endDate) {
        errorDetails.push("ngày bắt đầu và kết thúc");
        stepOneHasError = true;
      }
      if (!formData.minParticipants || !formData.maxParticipants) {
        errorDetails.push("số lượng người tham gia tối thiểu và tối đa");
        stepOneHasError = true;
      }
      if (!formData.location?.trim()) {
        errorDetails.push("địa điểm tổ chức");
        stepOneHasError = true;
      }
      if (!formData.imgUrl) {
        errorDetails.push("hình ảnh chương trình");
        stepOneHasError = true;
      }

      // Kiểm tra số lượng tham gia
      if (formData.minParticipants && formData.maxParticipants) {
        const min = parseInt(formData.minParticipants);
        const max = parseInt(formData.maxParticipants);
        if (min >= max) {
          errorDetails.push("số lượng tối thiểu phải nhỏ hơn số lượng tối đa");
          stepOneHasError = true;
        }
      }

      // Kiểm tra nhà tài trợ
      if (formData.createSponsorRequests.length === 0) {
        errorDetails.push("cần có ít nhất một nhà tài trợ");
        stepOneHasError = true;
      } else {
        const invalidSponsors = formData.createSponsorRequests.filter(
          (sponsor) =>
            !sponsor.name?.trim() ||
            !sponsor.logoUrl ||
            !sponsor.investMoney ||
            sponsor.investMoney <= 0
        );

        if (invalidSponsors.length > 0) {
          errorDetails.push(
            `${invalidSponsors.length} nhà tài trợ thiếu thông tin hoặc có thông tin không hợp lệ`
          );
          stepOneHasError = true;
        }
      }

      // Kiểm tra loại vé
      if (formData.createTicketTypeRequests.length === 0) {
        errorDetails.push("cần có ít nhất một loại vé");
        stepOneHasError = true;
      } else {
        const invalidTickets = formData.createTicketTypeRequests.filter(
          (ticket) =>
            !ticket.name?.trim() ||
            !ticket.price ||
            ticket.price <= 0 ||
            !ticket.availableQuantity ||
            ticket.availableQuantity <= 0
        );

        if (invalidTickets.length > 0) {
          errorDetails.push(
            `${invalidTickets.length} loại vé thiếu thông tin hoặc có thông tin không hợp lệ`
          );
          stepOneHasError = true;
        }
      }

      // Kiểm tra quản lý và nhân viên
      if (
        !formData.assignManagerRequests ||
        formData.assignManagerRequests.length === 0
      ) {
        errorDetails.push("cần chọn ít nhất một quản lý");
        stepOneHasError = true;
      }

      if (
        !formData.assignStaffRequests ||
        formData.assignStaffRequests.length === 0
      ) {
        errorDetails.push("cần chọn ít nhất một nhân viên");
        stepOneHasError = true;
      }

      // Hiển thị thông báo lỗi nếu có
      if (stepOneHasError) {
        hasError = true;
        notification.error({
          message: "Thông tin cuộc thi không hợp lệ",
          description: (
            <div>
              <p>Thông tin cần bổ sung hoặc chỉnh sửa:</p>
              <ul className="list-disc pl-4 mt-2">
                {errorDetails.map((detail, idx) => (
                  <li key={idx}>{detail}</li>
                ))}
              </ul>
            </div>
          ),
          placement: "topRight",
          duration: 15,
        });
      }
    }

    if (currentStep === 2) {
      // Kiểm tra hạng mục
      if (formData.createCategorieShowRequests.length > 0) {
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

            // Kiểm tra kích thước tối thiểu/tối đa
            if (category.sizeMin && category.sizeMax) {
              if (Number(category.sizeMin) >= Number(category.sizeMax)) {
                errorDetails.push(
                  "kích thước tối thiểu phải nhỏ hơn kích thước tối đa"
                );
                categoryHasError = true;
              }
            }

            // Kiểm tra số lượng tham gia tối thiểu/tối đa
            if (category.minEntries && category.maxEntries) {
              if (Number(category.minEntries) > Number(category.maxEntries)) {
                errorDetails.push(
                  "số lượng tham gia tối thiểu phải nhỏ hơn số lượng tối đa"
                );
                categoryHasError = true;
              }
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

            // Kiểm tra số cá qua vòng
            if (category.createRoundRequests?.length > 0) {
              const invalidRounds = category.createRoundRequests.filter(
                (round) =>
                  // Chỉ kiểm tra với vòng có hiển thị trường số cá qua vòng
                  !(
                    round.roundType === "Preliminary" ||
                    (round.roundType === "Final" &&
                      (category.createRoundRequests.filter(
                        (r) => r.roundType === "Final"
                      ).length < 2 ||
                        round.roundOrder !== 1))
                  ) &&
                  (!round.numberOfRegistrationToAdvance ||
                    round.numberOfRegistrationToAdvance < 1)
              );

              if (invalidRounds.length > 0) {
                const invalidRoundNames = invalidRounds
                  .map((round) => round.name)
                  .join(", ");
                errorDetails.push(
                  `số cá qua vòng phải từ 1 trở lên cho: ${invalidRoundNames}`
                );
                categoryHasError = true;
              }
            }

            // Kiểm tra trọng tài
            if (
              !category.createRefereeAssignmentRequests ||
              category.createRefereeAssignmentRequests.length === 0
            ) {
              errorDetails.push("trọng tài");
              categoryHasError = true;
            }

            // Kiểm tra các trọng tài đã được chọn vòng chấm điểm chưa
            if (category.createRefereeAssignmentRequests?.length > 0) {
              const refereesWithoutRounds =
                category.createRefereeAssignmentRequests.filter(
                  (ref) => !ref.roundTypes || ref.roundTypes.length === 0
                );

              if (refereesWithoutRounds.length > 0) {
                errorDetails.push(
                  `${refereesWithoutRounds.length} trọng tài chưa được chọn vòng chấm điểm`
                );
                categoryHasError = true;
              }
            }

            // Kiểm tra giải thưởng
            if (
              !category.createAwardCateShowRequests ||
              category.createAwardCateShowRequests.length < 1
            ) {
              errorDetails.push("đủ 1 loại giải thưởng");
              categoryHasError = true;
            }

            // Kiểm tra chi tiết giải thưởng
            if (category.createAwardCateShowRequests?.length > 0) {
              // Kiểm tra thông tin của các giải thưởng
              const invalidAwards = category.createAwardCateShowRequests.filter(
                (award) =>
                  !award.name?.trim() ||
                  !award.prizeValue ||
                  !award.description?.trim() ||
                  !award.awardType
              );

              if (invalidAwards.length > 0) {
                errorDetails.push(
                  `${invalidAwards.length} giải thưởng thiếu thông tin`
                );
                categoryHasError = true;
              }
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

              // Kiểm tra tổng trọng số phải bằng 100%
              const totalWeight = Math.round(
                criteriaForRound.reduce(
                  (total, c) => total + (c.weight * 100 || 0),
                  0
                )
              );

              if (criteriaForRound.length > 0 && totalWeight !== 100) {
                errorDetails.push(
                  `tổng trọng số của ${roundType} phải bằng 100% (hiện tại: ${totalWeight}%)`
                );
                categoryHasError = true;
              }

              // Kiểm tra không có tiêu chí nào có trọng số = 0%
              const zeroCriteria = criteriaForRound.filter(
                (c) => c.weight === 0
              );
              if (zeroCriteria.length > 0) {
                errorDetails.push(
                  `${zeroCriteria.length} tiêu chí của ${roundType} có trọng số bằng 0%`
                );
                categoryHasError = true;
              }
            });

            if (categoryHasError) {
              hasError = true;
              notification.error({
                message: `Lỗi ở hạng mục ${categoryIndex + 1}${category.name ? `: ${category.name}` : ""}`,
                description: (
                  <div>
                    <p>Hạng mục thiếu thông tin hoặc có lỗi:</p>
                    <ul className="list-disc pl-4 mt-2">
                      {errorDetails.map((detail, idx) => (
                        <li key={idx}>{detail}</li>
                      ))}
                    </ul>
                  </div>
                ),
                placement: "topRight",
                duration: 15,
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

  const handleNext = () => {
    setShowErrors(true);

    if (!validateStep()) {
      return;
    }

    // Kiểm tra và hiển thị cảnh báo về số lượng người tham gia, nhưng vẫn cho phép chuyển bước
    if (currentStep === 1) {
      const min = parseInt(formData.minParticipants);
      const max = parseInt(formData.maxParticipants);

      if (min >= max) {
        notification.warning({
          message: "Cảnh báo nhập liệu",
          description:
            "Số lượng tối thiểu đang lớn hơn hoặc bằng số lượng tối đa. Vui lòng kiểm tra lại.",
          placement: "topRight",
        });
        // Không return ở đây để vẫn cho phép chuyển bước
      }
    }

    if (currentStep === 3) {
      setIsConfirmModalOpen(true);
    } else {
      setCurrentStep((prev) => prev + 1);
      setShowErrors(false);
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
