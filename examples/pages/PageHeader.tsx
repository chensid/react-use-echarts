import React from "react";
import { Link } from "react-router-dom";
import styles from "./PageHeader.module.css";

interface PageHeaderProps {
  readonly title: string;
  readonly description?: string;
  readonly crumb?: { readonly label: string; readonly to: string };
  readonly meta?: React.ReactNode;
  readonly eyebrow?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, description, crumb, meta, eyebrow }) => {
  return (
    <div className={styles.header}>
      {crumb ? (
        <div className={styles.crumb}>
          <Link to={crumb.to}>{crumb.label}</Link>
          <span className={styles.crumbSep}>/</span>
          <span className={styles.crumbCur}>{title}</span>
        </div>
      ) : null}
      {eyebrow ? <div className={styles.eyebrow}>{eyebrow}</div> : null}
      <div className={styles.row}>
        <h1 className={styles.title}>{title}</h1>
        {meta ? <div className={styles.meta}>{meta}</div> : null}
      </div>
      {description ? <p className={styles.desc}>{description}</p> : null}
    </div>
  );
};

export default PageHeader;
