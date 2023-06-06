FROM node:16-alpine

# Curl is needed for container health checks
# Dumb init is used so node properly receives SIGINT
RUN apk add --no-cache openssl git curl dumb-init

WORKDIR /usr/src/app

# Uncomment to authenticate with ghcr.io
# Note that the standard GITHUB_TOKEN in Github Actions
# is not priviledged enough to install packages from the 
# entire organization. To overcome this we usually inject 
# a dedicated personal access token that can access all packages.

# ARG NPM_TOKEN
# RUN echo "registry=https://npm.pkg.github.com/" > ~/.npmrc; \
#     echo "//npm.pkg.github.com/:_authToken=${NPM_TOKEN}" >> ~/.npmrc

COPY package.json yarn.lock ./
RUN yarn install --ignore-optional --frozen-lockfile

COPY . .
RUN npx prisma generate
RUN yarn build

ENTRYPOINT ["/usr/bin/dumb-init", "--"]

CMD [ "yarn", "start" ]
