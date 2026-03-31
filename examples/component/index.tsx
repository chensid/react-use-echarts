import React from "react";
import ComponentRef from "./ComponentRef";

const ComponentExamples: React.FC = () => {
  return (
    <div style={{ padding: "16px" }}>
      <h1>EChart Component Examples</h1>
      <div>
        <h2>Component with Ref</h2>
        <ComponentRef />
      </div>
    </div>
  );
};

export default ComponentExamples;
