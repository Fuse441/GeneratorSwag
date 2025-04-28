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

# copy built js files (สมมติ build output อยู่ใน dist/)
COPY --from=build /app/dist ./dist

# copy package.json (ถ้าต้องใช้)
COPY --from=build /app/package.json .

# ลบไฟล์ไม่จำเป็น? (ไม่ต้อง copy src เพราะ build แล้ว)
# และลบไฟล์ TypeScript ต่างๆ ที่ไม่จำเป็นใน final image
# วิธีนี้คือไม่ต้อง copy src/ มาด้วยเลย

EXPOSE 25565

# รันไฟล์ js ที่ build แล้ว (เช่น dist/app.js)
ENTRYPOINT ["bun", "run", "dist/app.js"]
