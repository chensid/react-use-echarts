import React, { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import styles from "./Layout.module.css";

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <>
      <Header onSidebarToggle={() => setSidebarOpen((p) => !p)} />
      <div className={styles.layout}>
        <div className={styles.wrap}>
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <main className={styles.main}>
            <div className={styles.inner}>
              <Outlet />
              <Footer />
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default Layout;
