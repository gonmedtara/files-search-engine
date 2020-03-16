
FROM node:10

MAINTAINER Gontara Mohamed

RUN apt-get update

RUN apt-get install -y xpdf

RUN apt-get install -y antiword

WORKDIR /usr/src/files-search-engine

COPY ./ .

