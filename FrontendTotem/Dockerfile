FROM nginx:1.27-alpine
# No modo offline, copiamos a pasta 'dist' que foi gerada no Windows
COPY dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
