import Title from "antd/es/typography/Title";
import Typography from "antd/es/typography/Typography";
import Carousel from "../Carousel";
import Authen from "../Authen";

function AuthenView() {
  return (
    <div className="background w-full  min-h-screen flex justify-center items-center  ">
      <div className="max-w-[900px] h-[600px] mx-5 bg-[#fff] grid grid-cols-1 md:grid md:grid-cols-2 rounded-2xl overflow-hidden ">
        <div className="px-10 my-auto">
          <Typography className="text-center">
            <Title>Login</Title>
          </Typography>
          <Authen/>
        </div>
        <div className="hidden md:block">
          <Carousel />
        </div>
      </div>
    </div>
  );
}

export default AuthenView;
