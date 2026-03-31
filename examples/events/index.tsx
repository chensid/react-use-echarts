import React from "react";
import EventChart from "./EventChart";

const EventExamples: React.FC = () => {
  return (
    <div style={{ padding: "16px" }}>
      <h1>Event Handling Examples</h1>
      <div>
        <h2>Click and Hover Events</h2>
        <EventChart />
      </div>
    </div>
  );
};

export default EventExamples;
