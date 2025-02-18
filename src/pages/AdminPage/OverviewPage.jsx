import React from "react";
import { Helmet } from "react-helmet";
import { OverviewView } from "../../section/admin/overview/view";

function OverviewPage() {
  return (
    <>
      <Helmet>
        <title>KSMS | Overview</title>
      </Helmet>
      <OverviewView />
    </>
  );
}

export default OverviewPage;
