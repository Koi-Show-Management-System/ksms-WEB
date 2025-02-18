import React from "react";
import { Helmet } from "react-helmet";
import UserView from "../../section/admin/user/view/UserView";

function UserPage() {
  return (
    <>
      <Helmet>
        <title> KSMS | User </title>
      </Helmet>
      <UserView />
    </>
  );
}

export default UserPage;
