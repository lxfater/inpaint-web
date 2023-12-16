FROM node:18 as builder

WORKDIR /usr/src/app

# Copy the package.json and package-lock.json files over
# We do this FIRST so that we don't copy the huge node_modules folder over from our local machine
# The node_modules can contain machine-specific libraries, so it should be created by the machine that's actually running the code
COPY . ./

# Now we run NPM install, which includes dev dependencies
RUN npm install

FROM alpine:latest as production
RUN apk --no-cache add nodejs ca-certificates
WORKDIR /root/
COPY --from=builder /usr/src/app ./
CMD [ "node", "node_modules/vite/bin/vite.js", "--host" ]