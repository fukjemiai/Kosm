FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json tsconfig.json vite.config.ts ./
RUN npm install
COPY index.html ./
COPY src/ src/

ARG VITE_KEYCLOAK_URL=https://auth.localhost
ARG VITE_KEYCLOAK_REALM=kosm
ARG VITE_KEYCLOAK_CLIENT_ID=kosm-customer
ARG VITE_API_URL=http://localhost:3000
ENV VITE_KEYCLOAK_URL=$VITE_KEYCLOAK_URL
ENV VITE_KEYCLOAK_REALM=$VITE_KEYCLOAK_REALM
ENV VITE_KEYCLOAK_CLIENT_ID=$VITE_KEYCLOAK_CLIENT_ID
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

FROM nginx:1.27-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
