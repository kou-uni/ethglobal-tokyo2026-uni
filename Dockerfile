FROM node:22-bookworm-slim
WORKDIR /app
# tsx and esbuild are needed at runtime by this repository's server and World bundle.
COPY package.json package-lock.json ./
RUN npm ci --include=dev
COPY --chown=node:node src ./src
COPY --chown=node:node setup ./setup
COPY --chown=node:node config ./config
COPY --chown=node:node tsconfig.json tsconfig.setup.json ./
# PR #27 stores request/attention state here. Mount persistent storage at this path.
RUN install -d -o node -g node /app/.yohaku
ENV NODE_ENV=production
ENV PORT=10000
USER node
EXPOSE 10000
CMD ["npm", "start"]
