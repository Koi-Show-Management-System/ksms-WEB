import { Helmet, HelmetProvider } from "react-helmet-async";
import AuthenView from "../../section/authen/view/AuthenView";

function Authentication() {
  return (
    <HelmetProvider>
      <Helmet>
        <title> KSMS | Đăng Nhập </title>
      </Helmet>
      <AuthenView />
    </HelmetProvider>
  );
}

export default Authentication;
