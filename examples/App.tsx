import React from "react";
import { HashRouter, Navigate, Route, Routes } from "react-router";
import Layout from "./components/Layout";

// Each page loads on demand. Besides keeping the entry chunk small, this keeps
// a demo route close to a real app: opening /gallery/bar runs only that demo's
// echarts.use() (plus main.tsx's), not the hero's, the thumbnails' or the
// playground's, which would otherwise hide a missing registration.
const Home = React.lazy(() => import("./pages/Home"));
const GalleryIndex = React.lazy(() => import("./pages/GalleryIndex"));
const FeaturesIndex = React.lazy(() => import("./pages/FeaturesIndex"));
const DemoDetail = React.lazy(() => import("./pages/DemoDetail"));
const Playground = React.lazy(() => import("./pages/Playground"));
const Compare = React.lazy(() => import("./pages/Compare"));

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="gallery" element={<GalleryIndex />} />
          <Route path="gallery/:id" element={<DemoDetail kind="gallery" />} />
          <Route path="features" element={<FeaturesIndex />} />
          <Route path="features/:id" element={<DemoDetail kind="features" />} />
          <Route path="playground" element={<Playground />} />
          <Route path="compare" element={<Compare />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
};

export default App;
