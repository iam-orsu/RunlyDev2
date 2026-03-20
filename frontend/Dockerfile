FROM node:20-slim

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy all source files
COPY . .

# Build the Next.js production bundle
# (requires src/app/page.tsx to exist — added in Phase 4)
# RUN npm run build

EXPOSE 3000

# Production: npm start | Development: npm run dev
CMD ["npm", "run", "dev"]
