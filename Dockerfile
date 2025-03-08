# Bắt đầu từ hình ảnh Node.js base
FROM node:18-alpine AS build

# Thiết lập thư mục làm việc trong container
WORKDIR /app

# Sao chép package.json và package-lock.json vào container
COPY package*.json ./

# Cài đặt tất cả dependencies từ package-lock.json
RUN npm install

# Sao chép tất cả mã nguồn vào trong container
COPY . .

# Build ứng dụng (nếu cần build)
RUN npm run build

# Tạo một stage mới để chạy ứng dụng
FROM nginx:alpine AS production

# Sao chép các tệp cần thiết từ stage trước vào nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Cấu hình Nginx (nếu có)
COPY nginx.conf /etc/nginx/nginx.conf

# Mở cổng 80 và 443 cho Nginx
EXPOSE 80 443

# Lệnh khởi động Nginx
CMD ["nginx", "-g", "daemon off;"]
