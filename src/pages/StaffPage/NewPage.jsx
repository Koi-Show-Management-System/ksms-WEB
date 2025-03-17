import React from "react";
import { Helmet } from "react-helmet-async";
import { NewView } from "../../section/staff/new/view";

function NewPage() {
  return (
    <>
      <Helmet>
        <title>KSMS |Tin Tức</title>
      </Helmet>
      <NewView />
    </>
  );
}

export default NewPage;
