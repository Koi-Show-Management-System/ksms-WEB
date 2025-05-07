import { create } from "zustand";
import { notification } from "antd";
import {
  createBlogCategory,
  getBlogCategory,
  updateBlogCategory,
  createBlog,
  updateBlog,
  getBlogDetail,
  deleteBlog,
  getBlogPage,
} from "../api/blogApi";

const useBlog = create((set, get) => ({
  // State cho danh mục blog
  blogCategory: [],

  // State cho blog
  blogs: [],
  totalBlogs: 0,
  totalPages: 0,
  currentPage: 1,
  pageSize: 10,
  currentBlog: null,
  isLoadingBlogs: false,

  // Functions cho danh mục blog
  getBlogCategory: async () => {
    try {
      const response = await getBlogCategory();
      if (response.status === 200) {
        const blogData = response.data.data || [];
        set({ blogCategory: blogData });
      }
    } catch (error) {
      console.log("Error loading blog categories:", error);
      set({ blogCategory: [] });
      notification.error({
        message: "Lỗi",
        description: "Đã xảy ra lỗi khi tải danh mục bài viết",
      });
    }
  },

  createBlogCategory: async (data) => {
    try {
      const response = await createBlogCategory(data);
      if (
        response.status === 200 ||
        response.status === 201 ||
        response.data?.statusCode === 201
      ) {
        const getResponse = await getBlogCategory();
        if (getResponse.status === 200) {
          const blogData = getResponse.data.data || [];
          set({ blogCategory: blogData });
        }
        notification.success({
          message: "Thành công",
          description: response.data.message || "Tạo danh mục blog thành công",
        });
        return { success: true, data: response.data };
      }
      return { success: false, message: "Không thể tạo danh mục blog" };
    } catch (error) {
      console.log("Error creating blog category:", error);
      notification.error({
        message: "Lỗi",
        description:
          error?.response?.data?.Error || "Đã xảy ra lỗi khi tạo danh mục blog",
      });
      return { success: false, error: error.message };
    }
  },

  updateBlogCategory: async (id, data) => {
    try {
      const response = await updateBlogCategory(id, data);
      if (
        response.status === 200 ||
        response.status === 201 ||
        response.data?.statusCode === 201
      ) {
        const getResponse = await getBlogCategory();
        if (getResponse.status === 200) {
          const blogData = getResponse.data.data || [];
          set({ blogCategory: blogData });
        }
        notification.success({
          message: "Thành công",
          description:
            response.data.message || "Cập nhật danh mục blog thành công",
        });
        return { success: true, data: response.data };
      }
      return { success: false, message: "Không thể cập nhật danh mục blog" };
    } catch (error) {
      console.log("Error updating blog category:", error);
      notification.error({
        message: "Lỗi",
        description:
          error?.response?.data?.Error ||
          "Đã xảy ra lỗi khi cập nhật danh mục blog",
      });
      return { success: false, error: error.message };
    }
  },

  // Functions cho blog
  getBlogs: async (page = 1, size = 10, categoryId = null) => {
    try {
      set({ isLoadingBlogs: true });
      const response = await getBlogPage(page, size, categoryId);
      if (response.status === 200) {
        const { items, total, totalPages } = response.data.data;
        set({
          blogs: items || [],
          totalBlogs: total || 0,
          totalPages: totalPages || 0,
          currentPage: page,
          pageSize: size,
          isLoadingBlogs: false,
        });
        return { success: true, data: response.data };
      }
    } catch (error) {
      console.log("Error loading blogs:", error);
      set({ blogs: [], isLoadingBlogs: false });
      notification.error({
        message: "Lỗi",
        description: error.message || "Đã xảy ra lỗi khi tải danh sách tin tức",
      });
      return { success: false, error: error.message };
    }
  },

  getBlogDetail: async (id) => {
    try {
      const response = await getBlogDetail(id);
      if (response.status === 200) {
        const blogData = response.data.data;
        set({ currentBlog: blogData });
        return { success: true, data: blogData };
      }
    } catch (error) {
      console.log("Error loading blog detail:", error);
      notification.error({
        message: "Lỗi",
        description: error.message || "Đã xảy ra lỗi khi tải chi tiết tin tức",
      });
      return { success: false, error: error.message };
    }
  },

  createBlog: async (data) => {
    try {
      const response = await createBlog(data);
      if (
        response.status === 200 ||
        response.status === 201 ||
        response.data?.statusCode === 201
      ) {
        // Làm mới danh sách blog
        await get().getBlogs(get().currentPage, get().pageSize);
        notification.success({
          message: "Thành công",
          description: response.data.message || "Thêm tin tức thành công",
        });
        return { success: true, data: response.data.data };
      }
      return { success: false, message: "Không thể tạo tin tức" };
    } catch (error) {
      console.log("Error creating blog:", error);
      notification.error({
        message: "Lỗi",
        description:
          error?.response?.data?.Error || "Đã xảy ra lỗi khi tạo tin tức",
      });
      return { success: false, error: error.message };
    }
  },

  updateBlog: async (id, data) => {
    try {
      const response = await updateBlog(id, data);
      if (
        response.status === 200 ||
        response.status === 201 ||
        response.data?.statusCode === 201
      ) {
        // Làm mới danh sách blog
        await get().getBlogs(get().currentPage, get().pageSize);
        notification.success({
          message: "Thành công",
          description: response.data.message || "Cập nhật tin tức thành công",
        });
        return { success: true, data: response.data.data };
      }
      return { success: false, message: "Không thể cập nhật tin tức" };
    } catch (error) {
      console.log("Error updating blog:", error);
      notification.error({
        message: "Lỗi",
        description:
          error?.response?.data?.Error || "Đã xảy ra lỗi khi cập nhật tin tức",
      });
      return { success: false, error: error.message };
    }
  },

  deleteBlog: async (id) => {
    try {
      const response = await deleteBlog(id);
      if (
        response.status === 200 ||
        response.status === 201 ||
        response.data?.statusCode === 201
      ) {
        // Làm mới danh sách blog
        await get().getBlogs(get().currentPage, get().pageSize);
        notification.success({
          message: "Thành công",
          description: response.data.message || "Xóa tin tức thành công",
        });
        return { success: true };
      }
      return { success: false, message: "Không thể xóa tin tức" };
    } catch (error) {
      console.log("Error deleting blog:", error);
      notification.error({
        message: "Lỗi",
        description:
          error?.response?.data?.Error || "Đã xảy ra lỗi khi xóa tin tức",
      });
      return { success: false, error: error.message };
    }
  },
}));

export default useBlog;
