# Base image
FROM node:18

# Create app directory
WORKDIR /usr/src/app

# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

RUN apt update

RUN npm install -g nodemon

# Install app dependencies
RUN npm install
