# 1. Base Image 
FROM node:lts-alpine

# 2. Create app directory 
WORKDIR /app

# 3. Copy package files and install dependencies 
COPY package*.json ./
RUN npm install 

# 4. Copy all project files 
COPY . . 

# 5. Build Typescript to Javascript 
RUN npm run build 

# 6. Expose the port your app runs on 
EXPOSE 3000

# 7. Command to run the application 
CMD ["npm", "run", "start:dev"]