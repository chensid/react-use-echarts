import React from "react";
import BasicExamples from "./basic";
import ThemeExamples from "./themes";
import LinkageExamples from "./linkage";
import LazyExamples from "./lazy";
import EventExamples from "./events";
import LoadingExamples from "./loading";
import ComponentExamples from "./component";

const App: React.FC = () => {
  return (
    <div>
      <BasicExamples />
      <hr />
      <ThemeExamples />
      <hr />
      <LinkageExamples />
      <hr />
      <EventExamples />
      <hr />
      <LoadingExamples />
      <hr />
      <ComponentExamples />
      <hr />
      <LazyExamples />
    </div>
  );
};

export default App;
