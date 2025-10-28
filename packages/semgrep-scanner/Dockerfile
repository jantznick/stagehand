# Use an official Node.js runtime as a parent image
FROM node:18-slim

# Set the working directory in the container
WORKDIR /usr/src/app

# Install system dependencies required for Semgrep
# - python3 and pip3 to install semgrep
# - git to clone repositories
RUN apt-get update && apt-get install -y python3 python3-pip git

# Install Semgrep using pip
RUN pip3 install semgrep

# Copy package.json and package-lock.json
COPY package*.json ./

# Install any needed packages
RUN npm install

# Bundle app source
COPY . .

# Make port 8080 available to the world outside this container
EXPOSE 8080

# Define the command to run the app
CMD [ "npm", "run", "dev" ]
