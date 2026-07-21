import { Suspense, useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Splash } from "./pages/Splash";
import { Onboarding } from "./pages/Onboarding";
import { Home } from "./pages/Home";
import { Scan } from "./pages/Scan";
import { Results } from "./pages/Results";
import { Recommendations } from "./pages/Recommendations";
import { Measurements } from "./pages/Measurements";
import { Settings } from "./pages/Settings";
import { Integrations } from "./pages/Integrations";
import { ProductDetail } from "./pages/ProductDetail";
import { FitProfile } from "./pages/FitProfile";
import { Privacy } from "./pages/Privacy";
import { Loading } from "./components/Loading";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { EmbedApp } from "./embed/EmbedApp";
import { bootstrapApp, trackRoute } from "./lib/appBootstrap";

/**
 * Top-level router. Each route is wrapped in a motion shell so transitions
 * between screens feel native-app-like (slide + fade).
 *
 * When `?embed=1` is present on the URL the entire host app is replaced
 * by the lightweight {@link EmbedApp} — that's what the iframe injected by
 * the partner-facing `embed.js` SDK renders.
 */
export function App() {
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    if (params.get("embed") === "1") {
      return <EmbedApp />;
    }
  }
  return (
    <ErrorBoundary>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <AppBootstrap />
        <Suspense fallback={<Loading />}>
          <AnimatedRoutes />
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

function AppBootstrap() {
  const location = useLocation();
  useEffect(() => {
    void bootstrapApp();
  }, []);
  useEffect(() => {
    trackRoute(location.pathname);
  }, [location.pathname]);
  return null;
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Navigate to="/splash" replace />} />
        <Route
          path="/splash"
          element={
            <RouteShell>
              <Splash />
            </RouteShell>
          }
        />
        <Route
          path="/onboarding"
          element={
            <RouteShell>
              <Onboarding />
            </RouteShell>
          }
        />
        <Route
          path="/home"
          element={
            <RouteShell>
              <Home />
            </RouteShell>
          }
        />
        <Route
          path="/scan"
          element={
            <RouteShell>
              <Scan />
            </RouteShell>
          }
        />
        <Route
          path="/results/:scanId"
          element={
            <RouteShell>
              <Results />
            </RouteShell>
          }
        />
        <Route
          path="/recommendations/:scanId"
          element={
            <RouteShell>
              <Recommendations />
            </RouteShell>
          }
        />
        <Route
          path="/measurements"
          element={
            <RouteShell>
              <Measurements />
            </RouteShell>
          }
        />
        <Route
          path="/settings"
          element={
            <RouteShell>
              <Settings />
            </RouteShell>
          }
        />
        <Route
          path="/integrations"
          element={
            <RouteShell>
              <Integrations />
            </RouteShell>
          }
        />
        <Route
          path="/products/:productId"
          element={
            <RouteShell>
              <ProductDetail />
            </RouteShell>
          }
        />
        <Route
          path="/fit-profile"
          element={
            <RouteShell>
              <FitProfile />
            </RouteShell>
          }
        />
        <Route
          path="/privacy"
          element={
            <RouteShell>
              <Privacy />
            </RouteShell>
          }
        />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

function RouteShell({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="min-h-[100dvh] min-h-screen w-full overflow-x-hidden"
    >
      {children}
    </motion.div>
  );
}
