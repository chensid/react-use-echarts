import React, { useMemo, useState } from "react";
import PageHeader from "./PageHeader";
import ThumbCard from "../components/ThumbCard";
import { galleryItems } from "../data/gallery";
import { thumbOptions } from "../data/thumbs";
import styles from "./GalleryIndex.module.css";

const GROUPS: Record<string, readonly string[]> = {
  All: galleryItems.map((i) => i.id),
  Common: ["bar", "line"],
  Composite: ["radar", "gauge", "candlestick"],
  Spatial: ["heatmap", "funnel", "treemap"],
};

const GalleryIndex: React.FC = () => {
  const [filter, setFilter] = useState<string>("All");

  const items = useMemo(() => {
    const allowed = new Set(GROUPS[filter]);
    return galleryItems.filter((i) => allowed.has(i.id));
  }, [filter]);

  return (
    <>
      <PageHeader
        eyebrow="Gallery"
        title="8 chart types"
        description="Single-component examples for the most common ECharts series. Click any card for full source."
        meta={
          <>
            <span>{items.length}</span> shown
          </>
        }
      />
      <div className={styles.toolbar}>
        <div className={styles.filters} role="tablist">
          {Object.keys(GROUPS).map((g) => (
            <button
              key={g}
              type="button"
              role="tab"
              aria-selected={filter === g}
              onClick={() => setFilter(g)}
              className={`${styles.filter} ${filter === g ? styles.filterActive : ""}`}
            >
              {g}
              <span className={styles.filterCount}>{GROUPS[g].length}</span>
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
            option={thumbOptions[item.id]}
            tag={item.id}
          />
        ))}
      </div>
    </>
  );
};

export default GalleryIndex;
