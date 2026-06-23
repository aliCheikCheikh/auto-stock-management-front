# --- Étape 1 : build Angular ---
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- Étape 2 : runtime nginx ---
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/auto-stock-management-front/browser /usr/share/nginx/html
EXPOSE 80