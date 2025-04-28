# 1. base image
FROM oven/bun:1 AS base
WORKDIR /app

# 2. install dependencies (dev)
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lock /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# 3. install dependencies (production)
RUN mkdir -p /temp/prod
COPY package.json bun.lock /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

# 4. copy source + dev dependencies + build
FROM base AS build
COPY --from=install /temp/dev/node_modules node_modules
COPY . .
RUN bun run build

# 5. final production image
FROM base AS release
WORKDIR /app

# copy production dependencies
COPY --from=install /temp/prod/node_modules node_modules


COPY --from=build /app/dist ./dist

# copy package.json (ถ้าต้องใช้)
COPY --from=build /app/package.json .


EXPOSE 25565


ENTRYPOINT ["bun", "run", "dist/app.js"]
