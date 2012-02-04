Nestor [![http://travis-ci.org/cliffano/nestor](https://secure.travis-ci.org/cliffano/nestor.png?branch=master)](http://travis-ci.org/cliffano/nestor)
------

Nestor is Node.js [Jenkins](http://jenkins-ci.org) command-line interface.

Installation
------------

    npm install -g nestor

Configuration
-------------

Set Jenkins URL as an environment variable:

    export JENKINS_URL=http://user:pass@host:port/path

By default, Nestor uses http://localhost:8080 as the Jenkins URL.

Usage
-----

View status of all jobs:

    nestor dashboard

View job status:

    nestor job jobname

Trigger a build:

    nestor build jobname

Trigger a parameterised build:

    nestor build jobname "param1=value1&param2=value2"

View the build queue:

    nestor queue

View the executors' activity (running builds):

    nestor executor
    
Discover Jenkins instance running on a host:

    nestor discover hostname

View Jenkins version number:

    nestor version
    
Colophon
--------

Follow [@cliffano](http://twitter.com/cliffano) on Twitter. 
