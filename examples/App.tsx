import React from "react";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import GalleryIndex from "./pages/GalleryIndex";
import FeaturesIndex from "./pages/FeaturesIndex";
import DemoDetail from "./pages/DemoDetail";
import Playground from "./pages/Playground";
import Compare from "./pages/Compare";

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
