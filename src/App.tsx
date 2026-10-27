import { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import { sync } from "./sync";
import { Layout } from "./components/Layout";
import { WeeklyBoard } from "./pages/WeeklyBoard";
import { Backlog } from "./pages/Backlog";
import { History } from "./pages/History";
import { Stats } from "./pages/Stats";
import { Insights } from "./pages/Insights";
import { OKRs } from "./pages/OKRs";
import { Profile } from "./pages/Profile";

export default function App() {
  useEffect(() => sync.initialize(), []);

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<WeeklyBoard />} />
        <Route path="/backlog" element={<Backlog />} />
        <Route path="/history" element={<History />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/insights" element={<Insights />} />
        <Route path="/okrs" element={<OKRs />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<WeeklyBoard />} />
      </Route>
    </Routes>
  );
}
