import { Helmet } from "react-helmet";
import AuthenView from "../../section/authen/view/AuthenView";

function Authentication() {
  return (
    <>
      <Helmet>
        <title> KSMS | Login </title>
      </Helmet>
      <AuthenView/>
    </>
  );
}

export default Authentication;
