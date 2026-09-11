# AutomateSmall — static site. Nothing to build; nginx just serves the files.
FROM nginx:1.27-alpine

RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/automatesmall.conf

WORKDIR /usr/share/nginx/html
COPY assets ./assets
COPY *.html robots.txt ./

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1
