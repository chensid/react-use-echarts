import React from "react";
import LoadingChart from "./LoadingChart";

const LoadingExamples: React.FC = () => {
  return (
    <div style={{ padding: "16px" }}>
      <h1>Loading State Examples</h1>
      <div>
        <h2>Toggle Loading</h2>
        <LoadingChart />
      </div>
    </div>
  );
};

export default LoadingExamples;
