import { Outlet, useRoutes, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import { Error404, Loading } from "../components";
import Authentication from "../pages/AdminPage/Authentication";
import AdminDashboard from "../layout/admin";
import ManagerDashboard from "../layout/manager";
import RefereeDashboard from "../layout/referee";
import Cookies from "js-cookie";
import StaffDashboard from "../layout/staff";

export const KoiShowPageAdmin = lazy(
  () => import("../pages/AdminPage/KoiShowPage")
);
export const MyShowPage = lazy(() => import("../pages/AdminPage/MyShowPage"));
export const KoiShowDetailAdmin = lazy(
  () => import("../pages/AdminPage/KoiShowDetailPage")
);
export const CreateShow = lazy(
  () => import("../pages/AdminPage/CreateShowPage")
);
export const KoiShowPageManager = lazy(
  () => import("../pages/ManagerPage/KoiShowPage")
);
export const KoiShowDetailManager = lazy(
  () => import("../pages/ManagerPage/KoiShowDetailPage")
);
export const KoiShowPageReferee = lazy(
  () => import("../pages/RefereePage/KoiShowPage")
);
export const KoiShowDetailReferee = lazy(
  () => import("../pages/RefereePage/KoiShowDetailPage")
);
export const UserPage = lazy(() => import("../pages/AdminPage/UserPage"));
export const TeamPage = lazy(() => import("../pages/AdminPage/TeamPage"));
export const OverviewAdmin = lazy(
  () => import("../pages/AdminPage/OverviewPage")
);
export const NewsPage = lazy(() => import("../pages/AdminPage/NewsPage"));
export const CriteriaPage = lazy(
  () => import("../pages/AdminPage/CriteriaPage")
);
export const MyShowRefereePage = lazy(
  () => import("../pages/RefereePage/MyShowPage")
);

export const MyShowManagerPage = lazy(
  () => import("../pages/ManagerPage/MyShowPage")
);
export const TeamManagerPage = lazy(
  () => import("../pages/ManagerPage/TeamPage")
);

export const NewManagerPage = lazy(
  () => import("../pages/ManagerPage/NewPage")
);
export const KoiShowStaffPage = lazy(
  () => import("../pages/StaffPage/KoiShowPage")
);
export const KoiShowDetailStaffPage = lazy(
  () => import("../pages/StaffPage/KoiShowDetailPage")
);
export const MyShowStaffPage = lazy(
  () => import("../pages/StaffPage/MyShowPage")
);
export const NewStaffPage = lazy(() => import("../pages/StaffPage/NewPage"));

const ProtectedRoute = ({ children, allowedRole, userRole }) => {
  if (userRole?.toLowerCase() !== allowedRole?.toLowerCase()) {
    return <Navigate to="/" replace />;
  }
  return children;
};

export const Router = () => {
  const userRole = Cookies.get("__role") || "guest";

  const routes = useRoutes([
    {
      path: "/",
      element: <Authentication />,
    },
    {
      element: (
        <ProtectedRoute allowedRole="Admin" userRole={userRole}>
          <AdminDashboard>
            <Suspense fallback={<Loading />}>
              <Outlet />
            </Suspense>
          </AdminDashboard>
        </ProtectedRoute>
      ),
      path: "/admin",
      children: [
        { element: <OverviewAdmin />, path: "overview" },
        { element: <KoiShowPageAdmin />, path: "showList" },
        { element: <MyShowPage />, path: "myShow" },
        { element: <CreateShow />, path: "create-Show" },
        { element: <UserPage />, path: "users" },
        { element: <TeamPage />, path: "teams" },
        { element: <NewsPage />, path: "news" },
        { element: <CriteriaPage />, path: "criteria" },
        { element: <KoiShowDetailAdmin />, path: "koiShow/detail/:id" },
        { element: <Navigate to="/admin/overview" replace />, index: true },
        { element: <Error404 />, path: "*" },
      ],
    },
    {
      element: (
        <ProtectedRoute allowedRole="Manager" userRole={userRole}>
          <ManagerDashboard>
            <Suspense fallback={<Loading />}>
              <Outlet />
            </Suspense>
          </ManagerDashboard>
        </ProtectedRoute>
      ),
      path: "/manager",
      children: [
        { element: <KoiShowPageManager />, path: "showList" },
        { element: <MyShowManagerPage />, path: "myShow" },
        { element: <TeamManagerPage />, path: "teams" },
        { element: <NewManagerPage />, path: "news" },
        { element: <KoiShowDetailManager />, path: "koiShow/detail/:id" },
        { element: <Navigate to="/manager/showList" replace />, index: true },
        { element: <Error404 />, path: "*" },
      ],
    },
    {
      element: (
        <ProtectedRoute allowedRole="Staff" userRole={userRole}>
          <StaffDashboard>
            <Suspense fallback={<Loading />}>
              <Outlet />
            </Suspense>
          </StaffDashboard>
        </ProtectedRoute>
      ),
      path: "/staff",
      children: [
        { element: <KoiShowStaffPage />, path: "showList" },
        { element: <MyShowStaffPage />, path: "myShow" },
        { element: <NewStaffPage />, path: "news" },
        { element: <KoiShowDetailStaffPage />, path: "koiShow/detail/:id" },
        { element: <Navigate to="/staff/showList" replace />, index: true },
        { element: <Error404 />, path: "*" },
      ],
    },
    {
      element: (
        <ProtectedRoute allowedRole="Referee" userRole={userRole}>
          <RefereeDashboard>
            <Suspense fallback={<Loading />}>
              <Outlet />
            </Suspense>
          </RefereeDashboard>
        </ProtectedRoute>
      ),
      path: "/referee",
      children: [
        { element: <KoiShowPageReferee />, path: "showList" },
        { element: <MyShowRefereePage />, path: "myShow" },
        { element: <KoiShowDetailReferee />, path: "koiShow/detail/:id" },
        { element: <Navigate to="/referee/showList" replace />, index: true },
        { element: <Error404 />, path: "*" },
      ],
    },
    {
      path: "*",
      element: <Error404 />,
    },
  ]);

  return routes;
};
