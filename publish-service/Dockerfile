# tiktok-publish: owner "Post to TikTok" page (zero npm dependencies)
FROM node:22.11.0-alpine3.20
WORKDIR /app
COPY server.mjs ./
COPY public ./public
RUN mkdir -p /data && chown node:node /data
USER node
ENV NODE_ENV=production PORT=4010 DATA_DIR=/data
EXPOSE 4010
HEALTHCHECK --interval=60s --timeout=5s CMD wget -qO- http://127.0.0.1:4010/publish/healthz || exit 1
CMD ["node", "server.mjs"]
