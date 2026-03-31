import React from "react";
import LazyCharts from "./LazyCharts";

const LazyExamples: React.FC = () => {
  return (
    <div style={{ padding: "16px" }}>
      <h1>Lazy Initialization Examples</h1>
      <div>
        <h2>Scroll to Initialize</h2>
        <LazyCharts />
      </div>
    </div>
  );
};

export default LazyExamples;
