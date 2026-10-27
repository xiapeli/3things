import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { SyncBadge } from "./AccountPanel";
import {
  BarChart3,
  Calendar,
  ChevronLeft,
  Lightbulb,
  LineChart,
  Menu,
  Target,
  TrendingUp,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";

const NAV_ITEMS: { title: string; url: string; icon: LucideIcon }[] = [
  { title: "SEMANA", url: "/", icon: Target },
  { title: "BACKLOG", url: "/backlog", icon: Lightbulb },
  { title: "HISTÓRICO", url: "/history", icon: Calendar },
  { title: "ESTATÍSTICAS", url: "/stats", icon: BarChart3 },
  { title: "INSIGHTS", url: "/insights", icon: LineChart },
  { title: "OKRS", url: "/okrs", icon: TrendingUp },
  { title: "PERFIL", url: "/profile", icon: Users },
];

function Logo() {
  return (
    <div className="bg-yellow-400 text-black px-4 py-2 neo-brutal-border transform -rotate-2">
      <h1 className="text-xl font-black">3THINGS</h1>
    </div>
  );
}

function ExpandedNav({ onLinkClick }: { onLinkClick?: () => void }) {
  return (
    <nav className="flex-1 p-4 space-y-2">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.title}
          to={item.url}
          end={item.url === "/"}
          onClick={onLinkClick}
          className={({ isActive }) =>
            `flex items-center gap-4 p-3 font-black text-black neo-brutal-border text-sm transition-colors ${
              isActive ? "bg-yellow-400" : "bg-gray-100 hover:bg-gray-200"
            }`
          }
        >
          <item.icon className="w-5 h-5 flex-shrink-0" />
          <span>{item.title}</span>
        </NavLink>
      ))}
    </nav>
  );
}

function CollapsedNav() {
  return (
    <nav className="p-2 space-y-2">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.title}
          to={item.url}
          end={item.url === "/"}
          className={({ isActive }) =>
            `collapsed-nav-item flex justify-center p-3 neo-brutal-border transition-colors ${
              isActive ? "bg-yellow-400" : "bg-gray-100 hover:bg-gray-200"
            }`
          }
        >
          <item.icon className="w-6 h-6" />
          <span className="nav-tooltip">{item.title}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      <div className="flex h-screen">
        <aside
          className={`hidden md:flex flex-col bg-white border-r-2 border-black transition-all duration-300 ${
            collapsed ? "w-20" : "w-64"
          }`}
        >
          <div className="flex items-center justify-between p-4 border-b-2 border-black h-20">
            <div className={collapsed ? "opacity-0 hidden" : "opacity-100"}>
              <Logo />
            </div>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="neo-brutal-button bg-gray-100 p-2"
              aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
            >
              <ChevronLeft
                className={`w-5 h-5 transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`}
              />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {collapsed ? <CollapsedNav /> : <ExpandedNav />}
          </div>
          <NavLink to="/profile" className={`p-4 border-t-2 border-black ${collapsed ? "hidden" : ""}`}>
            <SyncBadge />
          </NavLink>
        </aside>

        {mobileOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/60 z-30 md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="fixed top-0 left-0 h-full w-64 bg-white border-r-2 border-black z-40 flex flex-col md:hidden">
              <div className="flex items-center justify-between p-4 border-b-2 border-black h-20">
                <Logo />
                <button
                  onClick={() => setMobileOpen(false)}
                  className="neo-brutal-button bg-gray-100 p-2"
                  aria-label="Fechar menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <ExpandedNav onLinkClick={() => setMobileOpen(false)} />
            </aside>
          </>
        )}

        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="md:hidden flex items-center justify-between bg-white border-b-2 border-black p-4 h-20">
            <Logo />
            <button
              onClick={() => setMobileOpen(true)}
              className="neo-brutal-button bg-gray-100 p-2"
              aria-label="Abrir menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </header>
          <main className="flex-1 overflow-y-auto bg-gray-50">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
