Nestor [![http://travis-ci.org/cliffano/nestor](https://secure.travis-ci.org/cliffano/nestor.png?branch=master)](http://travis-ci.org/cliffano/nestor)
------

[Jenkins](http://jenkins-ci.org) command-line interface in Node.js .

This is handy for those who prefer to touch type on the command line over GUI and mouse clicks on the browser. It also serves as an alternative to Jenkins Java CLI where Nestor has shorter commands and executes faster.

Installation
------------

    npm install -g nestor

Usage
-----

Trigger a build:

    nestor build <jobname>

Trigger a parameterised build:

    nestor build <jobname> ["param1=value1&param2=value2"]

View status of all jobs:

    nestor dashboard

View job status reports:

    nestor job <jobname>

View queued jobs:

    nestor queue

View executors' status (running builds):

    nestor executor
    
Discover Jenkins instance running on a specified host:

    nestor discover <hostname>

View Jenkins version number:

    nestor ver

Configuration
-------------

Set Jenkins URL in JENKINS_URL environment variable (defaults to http://localhost:8080):

(*nix)

    export JENKINS_URL=http://user:pass@host:port/path

(Windows)

    set JENKINS_URL=http://user:pass@host:port/path
