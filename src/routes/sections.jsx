import { Outlet, useRoutes, Navigate } from "react-router-dom";
import { Suspense, lazy, useEffect } from "react";
import { Error404, Loading } from "../components";
import Authentication from "../pages/AdminPage/Authentication";
import DashboardLayout from "../layout/DashboardLayout";
import Cookies from "js-cookie";
import { notification } from "antd";

export const KoiShowPage = lazy(() => import("../pages/AdminPage/KoiShowPage"));
export const KoiShowDetail = lazy(
  () => import("../pages/AdminPage/KoiShowDetailPage")
);
export const CreateShow = lazy(
  () => import("../pages/AdminPage/CreateShowPage")
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
export const NewsCategoryPage = lazy(
  () => import("../pages/AdminPage/NewsCategoryPage")
);
export const CriteriaPage = lazy(
  () => import("../pages/AdminPage/CriteriaPage")
);
export const VarietyPage = lazy(() => import("../pages/AdminPage/VarietyPage"));

export const NewManagerPage = lazy(
  () => import("../pages/ManagerPage/NewPage")
);
export const KoiShowStaffPage = lazy(
  () => import("../pages/StaffPage/KoiShowPage")
);
export const KoiShowDetailStaffPage = lazy(
  () => import("../pages/StaffPage/KoiShowDetailPage")
);

const ProtectedRoute = ({ children, allowedRole, userRole }) => {
  useEffect(() => {
    // Nếu vai trò là Member, hiển thị thông báo
    if (userRole?.toLowerCase() === "member") {
      notification.error({
        message: "Không có quyền truy cập",
        description: "Bạn không có quyền đăng nhập vào hệ thống quản trị.",
        placement: "topRight",
        duration: 5,
      });

      // Đăng xuất
      Cookies.remove("__token");
      Cookies.remove("__role");
      Cookies.remove("__id");
      sessionStorage.removeItem("keys");
    }
  }, [userRole]);

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
          <DashboardLayout>
            <Suspense fallback={<Loading />}>
              <Outlet />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      ),
      path: "/admin",
      children: [
        { element: <OverviewAdmin />, path: "overview" },
        { element: <KoiShowPage />, path: "showList" },
        { element: <CreateShow />, path: "create-Show" },
        { element: <UserPage />, path: "users" },
        { element: <TeamPage />, path: "teams" },
        { element: <NewsPage />, path: "news/overview" },
        { element: <NewsCategoryPage />, path: "news/category" },
        { element: <CriteriaPage />, path: "criteria" },
        { element: <VarietyPage />, path: "variety" },
        { element: <KoiShowDetail />, path: "koiShow/detail/:id" },
        { element: <Navigate to="/admin/overview" replace />, index: true },
        { element: <Error404 />, path: "*" },
      ],
    },
    {
      element: (
        <ProtectedRoute allowedRole="Manager" userRole={userRole}>
          <DashboardLayout>
            <Suspense fallback={<Loading />}>
              <Outlet />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      ),
      path: "/manager",
      children: [
        { element: <KoiShowPage />, path: "showList" },
        { element: <TeamPage />, path: "teams" },
        { element: <NewManagerPage />, path: "news" },
        { element: <KoiShowDetail />, path: "koiShow/detail/:id" },
        { element: <Navigate to="/manager/showList" replace />, index: true },
        { element: <Error404 />, path: "*" },
      ],
    },
    {
      element: (
        <ProtectedRoute allowedRole="Staff" userRole={userRole}>
          <DashboardLayout>
            <Suspense fallback={<Loading />}>
              <Outlet />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      ),
      path: "/staff",
      children: [
        { element: <KoiShowStaffPage />, path: "showList" },
        { element: <KoiShowDetailStaffPage />, path: "koiShow/detail/:id" },
        { element: <NewManagerPage />, path: "news" },
        { element: <Navigate to="/staff/showList" replace />, index: true },
        { element: <Error404 />, path: "*" },
      ],
    },
    {
      element: (
        <ProtectedRoute allowedRole="Referee" userRole={userRole}>
          <DashboardLayout>
            <Suspense fallback={<Loading />}>
              <Outlet />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      ),
      path: "/referee",
      children: [
        { element: <KoiShowStaffPage />, path: "showList" },
        { element: <KoiShowDetailReferee />, path: "koiShow/detail/:id" },
        { element: <NewManagerPage />, path: "news" },
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
