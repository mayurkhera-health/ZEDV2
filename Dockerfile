# AutomateSmall — static site. Nothing to build; nginx just serves the files.
FROM nginx:1.27-alpine

RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/automatesmall.conf

WORKDIR /usr/share/nginx/html
COPY assets ./assets
COPY *.html robots.txt ./

# Stamp the build with the commit it came from, served at /version.txt.
# Without this there is no way to tell a current deploy from a stale one --
# which is exactly how an old build sat on staging while looking current.
# The deploy script passes this and then verifies the live site reports it.
ARG GIT_SHA=unknown
RUN printf '%s\n' "$GIT_SHA" > /usr/share/nginx/html/version.txt

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1
