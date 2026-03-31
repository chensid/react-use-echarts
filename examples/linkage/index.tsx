import React from "react";
import LinkedCharts from "./LinkedCharts";

const LinkageExamples: React.FC = () => {
  return (
    <div style={{ padding: "16px" }}>
      <h1>Chart Linkage Examples</h1>
      <div>
        <h2>Linked Charts (hover one to sync the other)</h2>
        <LinkedCharts />
      </div>
    </div>
  );
};

export default LinkageExamples;
