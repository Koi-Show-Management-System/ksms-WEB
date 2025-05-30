import { Flex, Spin } from "antd";
const Loading = () => (
  <Flex gap="small" vertical className="select-none">
    <Flex gap="small" align="center" justify="center">
      <Spin tip="Đang tải..." size="large">
        <div className="p-[50px]" />
      </Spin>
    </Flex>
  </Flex>
);
export default Loading;
