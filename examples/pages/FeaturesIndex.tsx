import React from "react";
import PageHeader from "./PageHeader";
import FeatureCard from "../components/FeatureCard";
import { featureItems } from "../data/features";
import styles from "./FeaturesIndex.module.css";

const FeaturesIndex: React.FC = () => {
  return (
    <>
      <PageHeader
        title="Features"
        description="Library capabilities: reactivity, themes, renderer, linkage, events, loading, ref API, and lazy init."
      />
      <div className={styles.grid}>
        {featureItems.map((item) => (
          <FeatureCard key={item.id} item={item} />
        ))}
      </div>
    </>
  );
};

export default FeaturesIndex;
