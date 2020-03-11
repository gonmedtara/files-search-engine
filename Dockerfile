# # Set node image
FROM node:lts-alpine

#################
## Run Watcher ###
# Set working directory
WORKDIR /usr/src/files-watcher

# Copy all project
COPY ./files-watcher .

# Install  app dependencies
RUN npm install 

# # Run project
RUN npm run start 
##################


##################
### Run Search ###
# Set working directory
WORKDIR /usr/src/file-search

# Copy all project
COPY ./files-search .

# Install  app dependencies
RUN npm install 

# # Run project
RUN npm run start 
##################