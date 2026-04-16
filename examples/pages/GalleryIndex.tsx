import React from "react";
import PageHeader from "./PageHeader";
import ThumbCard from "../components/ThumbCard";
import { galleryItems } from "../data/gallery";
import { thumbOptions } from "../data/thumbs";
import styles from "./GalleryIndex.module.css";

const GalleryIndex: React.FC = () => {
  return (
    <>
      <PageHeader
        title="Gallery"
        description="Eight common chart types powered by ECharts. Click any card to see full code."
      />
      <div className={styles.grid}>
        {galleryItems.map((item) => (
          <ThumbCard
            key={item.id}
            to={`/gallery/${item.id}`}
            title={item.title}
            description={item.description}
            option={thumbOptions[item.id]}
          />
        ))}
      </div>
    </>
  );
};

export default GalleryIndex;
