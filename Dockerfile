FROM node:22-alpine AS build

WORKDIR /app

ARG NODE_AUTH_TOKEN

COPY package*.json ./

RUN --mount=type=cache,target=/root/.npm \
	echo "@Fiandriananaprime:registry=https://npm.pkg.github.com" > .npmrc \
	&& echo "//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}" >> .npmrc \
	&& npm ci \
	&& rm -f .npmrc

COPY prisma ./prisma
COPY prisma7.config.ts ./

RUN npx prisma generate

COPY src ./src
COPY tsconfig.json ./

RUN npm run build


FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

ARG NODE_AUTH_TOKEN

COPY package*.json ./

RUN --mount=type=cache,target=/root/.npm \
	echo "@Fiandriananaprime:registry=https://npm.pkg.github.com" > .npmrc \
	&& echo "//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}" >> .npmrc \
	&& npm ci --omit=dev \
	&& rm -f .npmrc

COPY --from=build /app/dist ./dist
COPY --from=build /app/src/generated/prisma ./dist/generated/prisma
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma7.config.ts ./prisma7.config.ts

EXPOSE 3001

ENTRYPOINT ["sh", "-c", ": \"${DATABASE_URL:?DATABASE_URL is required}\" && npx prisma migrate deploy --schema=prisma/schema.prisma && exec node dist/server.js"]