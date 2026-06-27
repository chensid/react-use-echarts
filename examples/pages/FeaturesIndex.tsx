import React from "react";
import PageHeader from "./PageHeader";
import FeatureCard from "../components/FeatureCard";
import { featureItems } from "../data/features";
import styles from "./FeaturesIndex.module.css";

const FeaturesIndex: React.FC = () => {
  return (
    <>
      <PageHeader
        eyebrow="Features"
        title="Library capabilities"
        description={`${featureItems.length} capabilities for common ECharts work: reactivity, themes, renderer choice, chart linkage, events, loading, refs, export flows, lazy init, error handling, and selective registration.`}
        meta={
          <>
            <span>{featureItems.length}</span> features
          </>
        }
      />
      <div className={styles.grid}>
        {featureItems.map((item, i) => (
          <FeatureCard key={item.id} item={item} index={i} />
        ))}
      </div>
    </>
  );
};

export default FeaturesIndex;
