import React, { useState } from "react";
import PageHeader from "../components/PageHeader";
import ThumbCard from "../components/ThumbCard";
import { CHART_COUNT, GALLERY_CATEGORIES, galleryItems } from "../data/gallery";
import { thumbOptions } from "../data/thumbs";
import styles from "./GalleryIndex.module.css";

const FILTERS = ["All", ...GALLERY_CATEGORIES] as const;
type Filter = (typeof FILTERS)[number];

const itemsFor = (filter: Filter) =>
  filter === "All" ? galleryItems : galleryItems.filter((i) => i.category === filter);

const GalleryIndex: React.FC = () => {
  const [filter, setFilter] = useState<Filter>("All");
  const items = itemsFor(filter);

  return (
    <>
      <PageHeader
        eyebrow="Gallery"
        title={`${CHART_COUNT} chart types`}
        description="Single-component examples for the most common ECharts series. Click any card for full source."
        meta={
          <>
            <span>{items.length}</span> shown
          </>
        }
      />
      <div className={styles.toolbar}>
        <div className={styles.filters} role="tablist">
          {FILTERS.map((g) => (
            <button
              key={g}
              type="button"
              role="tab"
              aria-selected={filter === g}
              onClick={() => setFilter(g)}
              className={`${styles.filter} ${filter === g ? styles.filterActive : ""}`}
            >
              {g}
              <span className={styles.filterCount}>{itemsFor(g).length}</span>
            </button>
          ))}
        </div>
        <span className={styles.help}>↳ click a card for full source &amp; preview</span>
      </div>
      <div className={styles.grid}>
        {items.map((item) => (
          <ThumbCard
            key={item.id}
            to={`/gallery/${item.id}`}
            title={item.title}
            description={item.description}
            sourcePath={item.sourcePath}
            option={thumbOptions[item.id]!}
            tag={item.id}
          />
        ))}
      </div>
    </>
  );
};

export default GalleryIndex;
