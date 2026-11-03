import React, { useState } from "react";
import { Outlet, useLocation } from "react-router";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import styles from "./Layout.module.css";

const Layout: React.FC = () => {
  const { pathname } = useLocation();
  // The mobile drawer belongs to the page it was opened on, so any navigation
  // (a link, the back button) closes it — derived during render instead of
  // reset from an effect.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const sidebarOpen = openOn === pathname;

  return (
    <>
      <Header onSidebarToggle={() => setOpenOn(sidebarOpen ? null : pathname)} />
      <div className={styles.layout}>
        <div className={styles.wrap}>
          <Sidebar isOpen={sidebarOpen} onClose={() => setOpenOn(null)} />
          <main className={styles.main}>
            <div className={styles.inner}>
              {/* Pages are lazy (App.tsx). React Router runs navigations in a
                  transition, so the current page stays up until the next one
                  loads; this fallback can only cover the first page of a visit. */}
              <React.Suspense fallback={<div className={styles.pageFallback} />}>
                <Outlet />
              </React.Suspense>
              <Footer />
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default Layout;
