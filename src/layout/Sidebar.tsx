import { NavLink } from "react-router-dom";

const navigationItems = [
  {
    label: "Dashboard",
    path: "/admin",
  },
  {
    label: "Fleet",
    path: "/admin/fleet",
  },
  {
    label: "Staff",
    path: "/admin/staff",
  },
  {
    label: "Routes",
    path: "/admin/routes",
  },
  {
    label: "Schedule",
    path: "/admin/schedule",
  },
  {
    label: "Requisitions",
    path: "/admin/requisitions",
  },
  {
    label: "Allocation",
    path: "/admin/allocation",
  },
  {
    label: "Conflicts",
    path: "/admin/conflicts",
  },
  {
    label: "Notifications",
    path: "/admin/notifications",
  },
  {
    label: "Mileage",
    path: "/admin/mileage",
  },
];

function Sidebar() {
  return (
    <aside className="hidden w-64 border-r border-[#E2E8F0] bg-white p-4 md:block">
      <nav className="space-y-1">
        {navigationItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/admin"}
            className={({ isActive }) =>
              isActive
                ? "block rounded-md bg-[#0F2747] px-3 py-2 text-sm font-medium text-white"
                : "block rounded-md px-3 py-2 text-sm font-medium text-[#334E68] hover:bg-[#F8FAFC]"
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
