# BP Garmin

[![Build Status](https://travis-ci.com/jjoonnaasss/BP2019Garmin.svg?branch=develop)](https://travis-ci.com/jjoonnaasss/BP2019Garmin)

## Setup

Install Node.js 10 and npm.

Install the modules and JSHint:

    npm install
    npm install -g jshint

Copy files from git_hooks/ to .git/hooks, mark them as executable.

Install and configure AWS CLI.

Create deployment packages with `make all` and deploy to Lambda with `make deploy`.