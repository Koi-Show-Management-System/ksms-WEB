import React from "react";
import { Helmet } from "react-helmet";
import { TeamView } from "../../section/manager/team/view";

function TeamPage() {
  return (
    <>
      <Helmet>
        <title>KSMS | Quản Lý</title>
      </Helmet>
      <TeamView />
    </>
  );
}

export default TeamPage;
