FROM oven/bun:1-slim AS nitro

WORKDIR /platform

# Copy package files
COPY . .

# Install only the core and selected database
RUN bun install --frozen-lockfile

# Build the application
RUN bun run build

CMD [ "bun", "run", "start" ]