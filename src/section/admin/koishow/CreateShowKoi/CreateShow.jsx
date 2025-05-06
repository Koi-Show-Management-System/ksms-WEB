import React, { useState, useRef } from "react";
import { Button, Form, message, Modal, notification } from "antd";
import StepOne from "./StepOne";
import StepTwo from "./StepTwo";
import StepThree from "./StepThree";
import { useNavigate } from "react-router-dom";
import useCreateKoi from "../../../../hooks/useCreateKoi";
import dayjs from "dayjs";

function CreateShow() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(1);
  const [showErrors, setShowErrors] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const { fetchCreateKoi, isLoading } = useCreateKoi();
  const stepThreeRef = useRef(null);
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
      } else if (formData.name.length > 100) {
        errorDetails.push("tên chương trình không được vượt quá 100 ký tự");
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

        // Check for maximum participant values
        if (min > 10000 || max > 10000) {
          errorDetails.push(
            "số lượng người tham gia không được vượt quá 10.000"
          );
          stepOneHasError = true;
        }
      }

      // Kiểm tra nhà tài trợ
      if (formData.createSponsorRequests.length === 0) {
        errorDetails.push("cần có ít nhất một nhà tài trợ");
        stepOneHasError = true;
      } else {
        // Check for duplicate sponsor names
        const sponsorNames = formData.createSponsorRequests
          .map((sponsor) => sponsor.name?.trim())
          .filter(Boolean);
        const hasDuplicateNames =
          sponsorNames.length !== new Set(sponsorNames).size;

        if (hasDuplicateNames) {
          errorDetails.push("tên các nhà tài trợ không được trùng nhau");
          stepOneHasError = true;
        }

        const invalidSponsors = formData.createSponsorRequests.filter(
          (sponsor) =>
            !sponsor.name?.trim() ||
            !sponsor.logoUrl ||
            !sponsor.investMoney ||
            sponsor.investMoney <= 0 ||
            sponsor.investMoney > 100000000000 // 100 billion VND
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
            ticket.price > 10000000 || // 10 million VND
            !ticket.availableQuantity ||
            ticket.availableQuantity <= 0 ||
            ticket.availableQuantity > 1000000 // 1 million tickets
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
          duration: 5,
        });
      }
    }

    if (currentStep === 2) {
      // Kiểm tra hạng mục
      if (formData.createCategorieShowRequests.length > 0) {
        // Check for duplicate category names
        const categoryNames = formData.createCategorieShowRequests
          .map((cat) => cat.name?.trim())
          .filter(Boolean);
        const hasDuplicateNames =
          categoryNames.length !== new Set(categoryNames).size;

        if (hasDuplicateNames) {
          notification.error({
            message: "Trùng tên hạng mục",
            description: "Các hạng mục không được có tên trùng nhau",
            placement: "topRight",
            duration: 5,
          });
          hasError = true;
        }

        formData.createCategorieShowRequests.forEach(
          (category, categoryIndex) => {
            let categoryHasError = false;
            let errorMessage = `Hạng mục "${category.name || `#${categoryIndex + 1}`}" thiếu thông tin: `;
            let errorDetails = [];

            if (!category.name?.trim()) {
              errorDetails.push("tên hạng mục");
              categoryHasError = true;
            } else if (category.name.length > 100) {
              errorDetails.push("tên hạng mục không được vượt quá 100 ký tự");
              categoryHasError = true;
            }

            if (!category.sizeMin) {
              errorDetails.push("kích thước tối thiểu");
              categoryHasError = true;
            } else if (Number(category.sizeMin) > 100) {
              errorDetails.push(
                "kích thước tối thiểu không được vượt quá 100cm"
              );
              categoryHasError = true;
            }

            if (!category.sizeMax) {
              errorDetails.push("kích thước tối đa");
              categoryHasError = true;
            } else if (Number(category.sizeMax) > 100) {
              errorDetails.push("kích thước tối đa không được vượt quá 100cm");
              categoryHasError = true;
            }

            if (!category.description?.trim()) {
              errorDetails.push("mô tả");
              categoryHasError = true;
            }

            if (!category.registrationFee) {
              errorDetails.push("phí đăng ký");
              categoryHasError = true;
            } else if (Number(category.registrationFee) > 10000000) {
              errorDetails.push("phí đăng ký không được vượt quá 10 triệu VND");
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

              if (Number(category.minEntries) > 1000) {
                errorDetails.push(
                  "số lượng tham gia tối thiểu không được vượt quá 1.000"
                );
                categoryHasError = true;
              }

              if (Number(category.maxEntries) > 1000) {
                errorDetails.push(
                  "số lượng tham gia tối đa không được vượt quá 1.000"
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

              // Kiểm tra số cá qua vòng 2 phải nhỏ hơn số cá qua vòng 1
              const preliminaryRound = category.createRoundRequests.find(
                (round) => round.roundType === "Preliminary"
              );
              const evaluationRound = category.createRoundRequests.find(
                (round) =>
                  round.roundType === "Evaluation" && round.roundOrder === 1
              );

              if (
                preliminaryRound &&
                evaluationRound &&
                preliminaryRound.numberOfRegistrationToAdvance &&
                evaluationRound.numberOfRegistrationToAdvance &&
                evaluationRound.numberOfRegistrationToAdvance >=
                  preliminaryRound.numberOfRegistrationToAdvance
              ) {
                errorDetails.push(
                  `số cá qua vòng ở vòng 2 (${evaluationRound.numberOfRegistrationToAdvance}) phải nhỏ hơn số cá qua vòng ở vòng 1 (${preliminaryRound.numberOfRegistrationToAdvance})`
                );
                categoryHasError = true;
              }

              // Kiểm tra lại cho mọi cặp vòng liên tiếp (vòng sau phải ít cá hơn vòng trước)
              const sortedRounds = [...category.createRoundRequests]
                .filter(
                  (round) => round.numberOfRegistrationToAdvance !== undefined
                )
                .sort((a, b) => {
                  // Sắp xếp theo thứ tự vòng (Preliminary -> Evaluation -> Final)
                  const typeOrder = { Preliminary: 1, Evaluation: 2, Final: 3 };
                  if (typeOrder[a.roundType] !== typeOrder[b.roundType]) {
                    return typeOrder[a.roundType] - typeOrder[b.roundType];
                  }
                  // Nếu cùng loại vòng thì sắp xếp theo roundOrder
                  return a.roundOrder - b.roundOrder;
                });

              for (let i = 0; i < sortedRounds.length - 1; i++) {
                const currentRound = sortedRounds[i];
                const nextRound = sortedRounds[i + 1];

                if (
                  currentRound.numberOfRegistrationToAdvance &&
                  nextRound.numberOfRegistrationToAdvance &&
                  nextRound.numberOfRegistrationToAdvance >=
                    currentRound.numberOfRegistrationToAdvance
                ) {
                  const currentRoundName = `${
                    currentRound.roundType === "Preliminary"
                      ? "Sơ loại"
                      : currentRound.roundType === "Evaluation"
                        ? "Đánh giá"
                        : "Chung kết"
                  } ${
                    currentRound.roundOrder > 1 ? currentRound.roundOrder : ""
                  }`;
                  const nextRoundName = `${
                    nextRound.roundType === "Preliminary"
                      ? "Sơ loại"
                      : nextRound.roundType === "Evaluation"
                        ? "Đánh giá"
                        : "Chung kết"
                  } ${nextRound.roundOrder > 1 ? nextRound.roundOrder : ""}`;

                  errorDetails.push(
                    `số cá qua vòng ở vòng ${nextRoundName} (${nextRound.numberOfRegistrationToAdvance}) phải nhỏ hơn số cá qua vòng ở vòng ${currentRoundName} (${currentRound.numberOfRegistrationToAdvance})`
                  );
                  categoryHasError = true;
                  break; // Chỉ hiện một lỗi để tránh quá nhiều thông báo
                }
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
                  award.prizeValue <= 0 ||
                  award.prizeValue > 100000000000 || // 100 billion VND
                  !award.description?.trim() ||
                  !award.awardType
              );

              if (invalidAwards.length > 0) {
                errorDetails.push(
                  `${invalidAwards.length} giải thưởng thiếu thông tin hoặc có thông tin không hợp lệ`
                );
                categoryHasError = true;
              }

              // Check if any award has prize value exceeding 100 billion
              const oversizedAwards =
                category.createAwardCateShowRequests.filter(
                  (award) => award.prizeValue > 100000000000
                );

              if (oversizedAwards.length > 0) {
                errorDetails.push(
                  `${oversizedAwards.length} giải thưởng có giá trị vượt quá 100 tỷ VND`
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

              // Skip validation for Preliminary round since it only uses pass/fail
              if (roundType === "Preliminary") {
                return;
              }

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
      // Lấy trạng thái từ formData (sẽ có trong StepThree component)
      const { availableStatuses } = formData;

      // Kiểm tra số lượng trạng thái
      // if (formData.createShowStatusRequests.length < 10) {
      //   notification.error({
      //     message: "Thiếu trạng thái",
      //     description: "Cần có ít nhất 10 trạng thái cho chương trình",
      //     placement: "topRight",
      //     duration: 6,
      //   });
      //   hasError = true;
      // }

      // Kiểm tra xem có trạng thái nào chưa được chọn không
      const unselectedStatuses = availableStatuses?.filter(
        (status) => !status.selected
      );
      if (formData.createShowRuleRequests.length < 3) {
        notification.error({
          message: "Lỗi quy tắc",
          description: "Cần có ít nhất 3 quy tắc cho chương trình",
          placement: "topRight",
          duration: 6,
        });
        hasError = true;
      }
      if (unselectedStatuses && unselectedStatuses.length > 0) {
        notification.error({
          message: "Thiếu trạng thái",
          description: `Bạn cần chọn thêm ${unselectedStatuses.length} trạng thái nữa: ${unselectedStatuses
            .map((s) => s.description)
            .join(", ")}`,
          placement: "topRight",
          duration: 10,
        });
        hasError = true;
      } else {
        // Nếu đã chọn tất cả, kiểm tra xem có trạng thái nào thiếu thông tin không
        const incompleteStatuses = availableStatuses?.filter(
          (status) =>
            status.selected &&
            (!status.startDate ||
              ((status.statusName === "RegistrationOpen" ||
                status.statusName !== "Finished") &&
                !status.endDate))
        );

        if (incompleteStatuses && incompleteStatuses.length > 0) {
          notification.error({
            message: "Thiếu thông tin trạng thái",
            description: `${incompleteStatuses.length} trạng thái đã chọn chưa có đầy đủ ngày bắt đầu và kết thúc`,
            placement: "topRight",
            duration: 6,
          });
          hasError = true;
        }
      }

      // Kiểm tra thứ tự các trạng thái có nằm trong khoảng thời gian triển lãm
      if (formData.startDate && formData.endDate) {
        const exhibitionStartDate = new Date(formData.startDate);
        const exhibitionEndDate = new Date(formData.endDate);

        const statusesOutsideExhibition = availableStatuses?.filter(
          (status) => {
            // Bỏ qua RegistrationOpen vì có thể diễn ra trước triển lãm
            if (status.statusName === "RegistrationOpen") return false;

            // Bỏ qua các trạng thái không được chọn hoặc không có ngày
            if (!status.selected || !status.startDate) return false;

            const startDate = new Date(status.startDate);
            const endDate = status.endDate ? new Date(status.endDate) : null;

            // Kiểm tra thời gian bắt đầu có nằm trong khoảng thời gian triển lãm
            const startOutside =
              startDate < exhibitionStartDate || startDate > exhibitionEndDate;

            // Kiểm tra thời gian kết thúc có nằm trong khoảng thời gian triển lãm (nếu có)
            const endOutside =
              endDate &&
              (endDate < exhibitionStartDate || endDate > exhibitionEndDate);

            return startOutside || endOutside;
          }
        );

        if (statusesOutsideExhibition && statusesOutsideExhibition.length > 0) {
          notification.error({
            message: "Thời gian trạng thái không hợp lệ",
            description: `${statusesOutsideExhibition.length} trạng thái có thời gian nằm ngoài khoảng thời gian triển lãm. Thời gian phải nằm trong khoảng thời gian của triển lãm.`,
            placement: "topRight",
            duration: 10,
          });
          hasError = true;
        }
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

    // Lưu rõ trạng thái của dữ liệu hiện tại
    console.log("Đang lưu dữ liệu trước khi chuyển bước", formData);

    // Cần lưu lại dữ liệu hiện tại trước khi chuyển bước
    if (currentStep === 3) {
      // Lưu trữ dữ liệu từ StepThree
      setIsConfirmModalOpen(true);
    } else {
      // Lưu trữ dữ liệu và chuyển đến bước tiếp theo
      setCurrentStep((prev) => prev + 1);
      setShowErrors(false);
    }
  };

  const handleQuickNext = () => {
    // Lưu dữ liệu trước khi chuyển bước tiếp theo
    console.log("QuickNext: Đang lưu dữ liệu", formData);

    if (currentStep === 3) {
      setIsConfirmModalOpen(true);
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    // Lưu trạng thái hiện tại trước khi quay lại
    console.log("Đang lưu dữ liệu trước khi quay lại bước trước", formData);

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

      if (response?.statusCode === 201) {
        console.log("Success! Status code 201 received");

        // Xóa dữ liệu khỏi localStorage khi đã hoàn tất form
        if (stepThreeRef.current) {
          stepThreeRef.current.clearLocalStorage();
        }

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
            ref={stepThreeRef}
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
        <div className="flex gap-2">
          {/* <Button
            onClick={handleQuickNext}
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            Test Nhanh
          </Button> */}
          <Button
            type="primary"
            onClick={handleNext}
            className="bg-blue-500 hover:bg-blue-600"
            loading={isLoading}
          >
            {currentStep === 3 ? "Xác nhận" : "Tiếp theo"}
          </Button>
        </div>
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
