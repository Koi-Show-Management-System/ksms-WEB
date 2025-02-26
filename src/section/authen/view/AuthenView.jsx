import Title from "antd/es/typography/Title";
import Typography from "antd/es/typography/Typography";
import Carousel from "../Carousel";
import Authen from "../Authen";

function AuthenView() {
  return (
    <div className="background w-full min-h-screen flex justify-center items-center">
      <div className="max-w-[900px] mx-5 w-full bg-[#fff] grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-5 rounded-2xl overflow-hidden">
        <div className="px-10 my-auto">
          <Typography className="text-center">
            <Title>Đăng nhập</Title>
          </Typography>
          <Authen />
        </div>
        <div className="hidden md:block">
          <Carousel />
        </div>
      </div>
    </div>
  );
}

export default AuthenView;
