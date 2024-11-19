import React from 'react';
import BarChart from './BarChart';
import LineChart from './LineChart';

const BasicExamples: React.FC = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Basic Examples</h1>
      
      <div style={{ marginBottom: '40px' }}>
        <h2>Bar Chart</h2>
        <BarChart />
      </div>

      <div>
        <h2>Line Chart</h2>
        <LineChart />
      </div>
    </div>
  );
};

export default BasicExamples;
