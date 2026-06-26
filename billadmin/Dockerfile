FROM node:20-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy application source code
COPY . .

# Expose Vite dev server port
EXPOSE 5173

# Start Vite in host mode so it is accessible from the container network
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
