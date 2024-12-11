# Base image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package.json và package-lock.json
COPY package*.json ./

# Cài đặt dependencies
RUN npm install

# Copy toàn bộ mã nguồn
COPY . .

# Expose cổng
EXPOSE 5000

# Chạy ứng dụng
CMD ["npm", "start"]
