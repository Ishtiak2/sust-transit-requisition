import { createBrowserRouter } from "react-router-dom";

import AdminLayout from "./layout/AdminLayout";

import DashboardPage from "./pages/DashboardPage";
import VehiclePage from "./pages/VehiclePage";
import DriverPage from "./pages/DriverPage";
import RoutesPage from "./pages/RoutesPage";
import SchedulePage from "./pages/SchedulePage";
import AllocationPage from "./pages/AllocationPage";
import NotificationsPage from "./pages/NotificationsPage";
import VehicleDetailsPage from "./pages/VehicleDetailsPage";
import RequisitionsPage from "./pages/RequisitionsPage";
import ApplyRequisitionPage from "./pages/ApplyRequisitionPage";

const router = createBrowserRouter([
  {
    path: "/apply",
    element: <ApplyRequisitionPage />,
  },
  {
    path: "/admin",
    element: <AdminLayout />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: "vehicle",
        element: <VehiclePage />,
      },
      {
        path: "driver",
        element: <DriverPage />,
      },
      {
        path: "routes",
        element: <RoutesPage />,
      },
      {
        path: "schedule",
        element: <SchedulePage />,
      },
      {
        path: "requisitions",
        element: <RequisitionsPage />,
      },
      {
        path: "allocation",
        element: <AllocationPage />,
      },
      {
        path: "notifications",
        element: <NotificationsPage />,
      },
      {
        path: "vehicle/:vehicleId",
        element: <VehicleDetailsPage />,
      },
    ],
  },
]);

export default router;

// When URL is this
//        ↓
// render this component
