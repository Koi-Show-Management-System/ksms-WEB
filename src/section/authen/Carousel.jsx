import { Carousel } from "antd";

const Slider = () => (
  <Carousel autoplay className="box-border">
    <div>
      <h3>
        <img
          src="https://i.pinimg.com/736x/ac/ab/a5/acaba5fd8cc5b9a221fae612b4830804.jpg"
          alt=""
          className="h-[600px] w-full object-cover object-left"
        />
      </h3>
    </div>
    <div>
      <h3>
        <img
          src="https://i.pinimg.com/736x/6b/40/73/6b4073ed5db2230eec393cb3167df6c5.jpg"
          alt=""
          className="h-[600px] w-full object-cover"
        />
      </h3>
    </div>
    <div>
      <h3>
        <img
          src="https://i.pinimg.com/736x/c7/d6/3c/c7d63cdf0253c2f872519584e7baee59.jpg"
          alt=""
          className="h-[600px] w-full object-cover"
        />
      </h3>
    </div>
  </Carousel>
);
export default Slider;
