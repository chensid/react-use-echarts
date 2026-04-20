import React from "react";
import { Navigate, useParams } from "react-router-dom";
import PageHeader from "./PageHeader";
import DemoTabs from "../components/DemoTabs";
import { findGalleryItem } from "../data/gallery";
import { findFeatureItem } from "../data/features";
import styles from "./DemoDetail.module.css";

interface DemoDetailProps {
  readonly kind: "gallery" | "features";
}

const CRUMBS = {
  gallery: { label: "Gallery", to: "/gallery" },
  features: { label: "Features", to: "/features" },
} as const;

const DemoDetail: React.FC<DemoDetailProps> = ({ kind }) => {
  const { id } = useParams<{ id: string }>();
  const item = kind === "gallery" ? findGalleryItem(id) : findFeatureItem(id);
  const crumb = CRUMBS[kind];

  if (!item) return <Navigate to={crumb.to} replace />;

  const DemoComponent = item.component;

  return (
    <>
      <PageHeader
        eyebrow={kind === "gallery" ? "Chart" : "Feature"}
        title={item.title}
        description={item.description}
        crumb={crumb}
        meta={
          <>
            <span className={styles.metaTag}>id: {item.id}</span>
            <span className={styles.metaTag}>{item.sourcePath.split("/").pop()}</span>
          </>
        }
      />
      <DemoTabs sourcePath={item.sourcePath} loadSource={item.source}>
        <React.Suspense fallback={<div className={styles.fallback} />}>
          <DemoComponent />
        </React.Suspense>
      </DemoTabs>
    </>
  );
};

export default DemoDetail;
