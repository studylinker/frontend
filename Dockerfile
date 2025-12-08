# 1. Build 단계 (Node.js 이미지 사용)
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
# (참고: 빌드 결과물은 보통 /app/build 또는 /app/dist에 생김)

# 2. Run 단계 (Nginx 이미지 사용 - 가볍고 빠름)
FROM nginx:alpine
# 빌드된 결과물을 Nginx가 서빙할 폴더로 복사
COPY --from=builder /app/build /usr/share/nginx/html
# (Vue나 Vite라면 /app/dist 일 수 있음. 확인 필요!)

# Nginx 기본 설정 (SPA 라우팅 문제 해결을 위해 필요할 수 있음)
COPY default.conf /etc/nginx/conf.d/default.conf 

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
