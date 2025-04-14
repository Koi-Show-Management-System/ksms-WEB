import axiosClient from "../config/axiosClient";

// API cho danh mục blog
const getBlogCategory = () => {
  return axiosClient.get("/blog-category/get-all");
};
const createBlogCategory = (data) => {
  return axiosClient.post("/blog-category/create", data);
};
const updateBlogCategory = (id, data) => {
  return axiosClient.put(`/blog-category/${id}`, data);
};

// API cho blog
const createBlog = (data) => {
  return axiosClient.post("/blog/create", data);
};

const updateBlog = (id, data) => {
  return axiosClient.put(`/blog/${id}`, data);
};

const getBlogDetail = (id) => {
  return axiosClient.get(`/blog/${id}`);
};

const deleteBlog = (id) => {
  return axiosClient.delete(`/blog/${id}`);
};

const getBlogPage = (page = 1, size = 10, blogCategoryId = null) => {
  let url = `/blog/get-page?page=${page}&size=${size}`;
  if (blogCategoryId) {
    url += `&blogCategoryId=${blogCategoryId}`;
  }
  return axiosClient.get(url);
};

export {
  getBlogCategory,
  createBlogCategory,
  updateBlogCategory,
  createBlog,
  updateBlog,
  getBlogDetail,
  deleteBlog,
  getBlogPage,
};
