# syntax=docker/dockerfile:1

FROM node:16
EXPOSE 3000 3001 3002 3003 3004
ENV NODE_ENV=production
ENV HOSTNAME=server
RUN apt-get update \
    && apt-get install -y openssh-server openssl netcat
WORKDIR /app
COPY ../.. .
RUN chmod +x /app/docker/scripts/* && \
    mkdir /app/data && \
    /app/docker/scripts/generate_environment_vars.sh
CMD [ "/app/docker/scripts/load_env_vars.sh", "/app/dist/squirt-server.js", "--headless" ]
#ENTRYPOINT ["tail", "-f", "/dev/null"]
