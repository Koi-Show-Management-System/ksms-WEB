import React from "react";
import { Helmet } from "react-helmet-async";
import UserView from "../../section/admin/user/view/UserView";

function UserPage() {
  return (
    <>
      <Helmet>
        <title> KSMS | Thành Viên </title>
      </Helmet>
      <UserView />
    </>
  );
}

export default UserPage;
