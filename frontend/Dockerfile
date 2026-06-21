FROM nginx:1.25-alpine

# Копирај ги статичките фајлови
COPY index.html /usr/share/nginx/html/

# Копирај ја nginx конфигурацијата
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
