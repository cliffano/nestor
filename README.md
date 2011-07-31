Nestor
------

Jenkins NodeJS CLI

Overview
--------

Nestor is a Jenkins command-line interface written in NodeJS.

Installation
------------

    npm install -g nestor

Config
------

You can set Jenkins URL as an environment variable.

    export JENKINS_URL=http://user:pass@host:port/path

By default, Nestor uses http://localhost:8080 as the Jenkins URL.

Usage
-----

View status of all jobs.

    nestor dashboard

View job status.

    nestor job jobname

Trigger a build.

    nestor build jobname

Trigger a parameterised build.

    nestor build jobname "param1=value1&param2=value2"

View the build queue.

    nestor queue

View the executors' activity (running builds) .

    nestor executor
    
Discover Jenkins instance running on a host

    nestor discover hostname

View Jenkins version number.

    nestor version
    