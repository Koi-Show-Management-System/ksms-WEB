import React, { useState } from "react";
import { Button, Form } from "antd";
import StepOne from "./StepOne";
import StepTwo from "./StepTwo";
import StepThree from "./StepThree";
import { Link } from "react-router-dom";

function CreateShow() {
  const [currentStep, setCurrentStep] = useState(1);

  const handleNext = () => {
    setCurrentStep((prevStep) => Math.min(prevStep + 1, 3));
  };

  const handlePrevious = () => {
    setCurrentStep((prevStep) => Math.max(prevStep - 1, 1));
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
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
        <div className="ml-4 text-gray-500">{`Step ${currentStep} of 3`}</div>
      </div>

      <Form layout="vertical">
        {currentStep === 1 && <StepOne />}
        {currentStep === 2 && <StepTwo />}
        {currentStep === 3 && <StepThree />}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          {currentStep > 1 && (
            <Button
              onClick={handlePrevious}
              className="bg-gray-300 hover:bg-gray-400"
            >
              Back
            </Button>
          )}
          {currentStep < 3 ? (
            <Button
              type="primary"
              onClick={handleNext}
              className="bg-blue-500 hover:bg-blue-600"
            >
              Next
            </Button>
          ) : (
            <Link to="/admin/koishow">
              <Button
                type="primary"
                htmlType="submit"
                className="bg-green-500 hover:bg-green-600"
              >
                Submit
              </Button>
            </Link>
          )}
        </div>
      </Form>
    </div>
  );
}

export default CreateShow;
