FROM oven/bun
WORKDIR /app
COPY . .
RUN bun install
 
ARG PORT
EXPOSE ${PORT:-3000}
 
CMD ["bun", "index.tsx"]