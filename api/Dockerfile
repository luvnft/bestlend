ARG NODE_VERSION=21.6.2
FROM node:${NODE_VERSION}-slim as base

LABEL fly_launch_runtime="Node.js"
ENV NODE_ENV="production"

WORKDIR /app

COPY --link . .

EXPOSE 3000
CMD [ "yarn", "run", "start" ]
