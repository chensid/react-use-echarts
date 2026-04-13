import React from "react";
import styles from "./DemoSection.module.css";

interface DemoSectionProps {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly children: React.ReactNode;
}

const DemoSection: React.FC<DemoSectionProps> = ({ id, title, description, children }) => {
  return (
    <section id={id} className={styles.section}>
      <div className={styles.head}>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.desc}>{description}</p>
      </div>
      <div className={styles.demos}>{children}</div>
    </section>
  );
};

export default DemoSection;
