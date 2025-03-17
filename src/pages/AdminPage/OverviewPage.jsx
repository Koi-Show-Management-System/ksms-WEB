import React from "react";
import { Helmet } from "react-helmet-async";
import { OverviewView } from "../../section/admin/overview/view";

function OverviewPage() {
  return (
    <>
      <Helmet>
        <title>KSMS | Tổng Quan</title>
      </Helmet>
      <OverviewView />
    </>
  );
}

export default OverviewPage;
