FROM node:20-slim

# Set working directory
WORKDIR /app

# Install system deps needed for some npm packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy all source files
COPY . .

# Expose API port
EXPOSE 4000

# Default command (overridden by docker-compose for api vs worker)
CMD ["npm", "run", "dev"]
