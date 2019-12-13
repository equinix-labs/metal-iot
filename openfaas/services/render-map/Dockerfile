FROM openfaas/of-watchdog:0.7.2 as watchdog

FROM node:12-alpine as build

WORKDIR /root/

# Turn down the verbosity to default level.
ENV NPM_CONFIG_LOGLEVEL warn

COPY package.json ./

RUN npm i --production

COPY src        ./src
COPY public     ./public

RUN NODE_ENV=production npm run build
RUN find build/

FROM alpine:3.10 AS runtime
WORKDIR /home/app/
RUN addgroup -S -g 998 app && adduser -S -u 998 -g app app

COPY --from=build /root/build /home/app/public
WORKDIR /home/app/public

COPY --from=watchdog /fwatchdog /usr/bin/fwatchdog
 
RUN chown app:app -R /home/app \
    && chmod 777 /tmp

USER app

ENV mode="static"
ENV static_path="/home/app/public"

ENV exec_timeout="10s"
ENV write_timeout="11s"
ENV read_timeout="11s"

HEALTHCHECK --interval=5s CMD [ -e /tmp/.lock ] || exit 1

CMD ["fwatchdog"]