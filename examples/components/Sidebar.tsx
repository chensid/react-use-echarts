import React, { useEffect, useMemo, useState } from "react";
import styles from "./Sidebar.module.css";

export interface NavSection {
  readonly id: string;
  readonly title: string;
}

interface SidebarProps {
  readonly sections: readonly NavSection[];
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ sections, isOpen, onClose }) => {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");
  const sectionIds = useMemo(() => sections.map((s) => s.id), [sections]);

  useEffect(() => {
    if (sectionIds.length === 0) return;

    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0 },
    );

    for (const el of elements) observer.observe(el);
    return () => observer.disconnect();
  }, [sectionIds]);

  return (
    <>
      {isOpen ? <div className={styles.backdrop} onClick={onClose} role="presentation" /> : null}
      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ""}`}>
        <nav className={styles.nav}>
          <p className={styles.heading}>Examples</p>
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className={`${styles.link} ${activeId === s.id ? styles.active : ""}`}
              onClick={onClose}
            >
              {s.title}
            </a>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
