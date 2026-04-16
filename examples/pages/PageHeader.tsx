import React from "react";
import { Link } from "react-router-dom";
import styles from "./PageHeader.module.css";

interface PageHeaderProps {
  readonly title: string;
  readonly description?: string;
  readonly crumb?: { readonly label: string; readonly to: string };
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, description, crumb }) => {
  return (
    <div className={styles.header}>
      {crumb ? (
        <div className={styles.crumb}>
          <Link to={crumb.to}>{crumb.label}</Link>
          <span>/</span>
          <span>{title}</span>
        </div>
      ) : null}
      <h1 className={styles.title}>{title}</h1>
      {description ? <p className={styles.desc}>{description}</p> : null}
    </div>
  );
};

export default PageHeader;
