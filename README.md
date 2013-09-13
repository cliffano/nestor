<img align="right" src="https://raw.github.com/cliffano/nestor/master/avatar.jpg" alt="Avatar"/>

[![Build Status](https://secure.travis-ci.org/cliffano/nestor.png?branch=master)](http://travis-ci.org/cliffano/nestor)
[![Dependencies Status](https://david-dm.org/cliffano/nestor.png)](http://david-dm.org/cliffano/nestor)
[![Published Version](https://badge.fury.io/js/nestor.png)](http://badge.fury.io/js/nestor)
<br/>
[![npm Badge](https://nodei.co/npm/nestor.png)](http://npmjs.org/package/nestor)

Nestor
------

Nestor is a [Jenkins](http://jenkins-ci.org) CLI and node.js client.

This is handy for Jenkins users who prefer to touch type on the command line over GUI and mouse clicks on the browser. It also serves as an alternative to Jenkins Java CLI where Nestor has shorter commands and executes faster.

Installation
------------

    npm install -g nestor

Usage
-----

Trigger a build:

    nestor build <job>

Trigger a parameterised build:

    nestor build <job> ["param1=value1&param2=value2"]

Trigger a build followed by console output:

    nestor build --console <job>

Trigger a build, wait for 5 seconds, then display console output:
(handy for builds that don't immediately display anything to console output)

    nestor build --pending 5000 --console <job>

Trigger all builds:

    nestor build-all

Trigger fail builds:

    nestor build-fail

Display latest build console output:

    nestor console <job>

Stop currently running build:

    nestor stop <job>

View status of all jobs:

    nestor dashboard

View job status reports:

    nestor job <job>

View queued jobs:

    nestor queue

View executors' status (running builds):

    nestor executor
    
Discover Jenkins instance running on a specified host:

    nestor discover <host>

View Jenkins version number:

    nestor ver

Start an IRC bot:

    nestor irc <host> <channel> [nick]

View builds feed of all jobs:

    nestor feed 

View builds feed of a job:

    nestor --job <job> feed

Monitor build status and notify Ninja Blocks RGB LED device:

    export NINJABLOCKS_TOKEN=<token_from_https://a.ninja.is/hacking>
    nestor ninja

Monitor build status and notify Delcom USB Visual Indicator build light device:

    nestor buildlight

Programmatically:

    var nestor = new (require('nestor'))(
      'http://user:pass@host:port/path'
    );

    // trigger a parameterised build
    nestor.build('job', 'param1=value1&param2=value2', function (err, result) {
    });

Check out [lib/jenkins](https://github.com/cliffano/nestor/blob/master/lib/jenkins.js) for other available methods.

Configuration
-------------

Set Jenkins URL in JENKINS_URL environment variable (defaults to http://localhost:8080):

(*nix)

    export JENKINS_URL=http://user:pass@host:port/path

(Windows)

    set JENKINS_URL=http://user:pass@host:port/path

As an alternative to password, you can use Jenkins API token instead. Jenkins API token can be found on Jenkins user configuration page.

If http_proxy or https_proxy environment variable is set, then Nestor will automatically use it.

If you want authentication details to be prompted interactively:

    JENKINS_URL=http://host:port/path nestor --interactive build job

Jenkins URL can also be specified as an arg:

    nestor --url http://user:pass@host:port/path dashboard

Translation
-----------

To add a new language translation:

1. Create a locale JSON file in conf/locales/ directory, with the locale's [ISO 639-1 code](http://en.wikipedia.org/wiki/List_of_ISO_639-1_codes) as file name.
2. Copy paste the content of the existing non-English locale file (anything other than en.json) and modify the translation values accordingly.

Colophon
--------

* [Monitor Jenkins From The Terminal](http://blog.cliffano.com/2013/09/13/monitor-jenkins-from-the-terminal/)
* [Jenkins Build Status On Ninja Blocks RGB LED](http://blog.cliffano.com/2013/04/08/jenkins-build-status-on-ninja-blocks-rgb-led/)
* [Nestor – A Faster And Simpler CLI For Jenkins](http://blog.cliffano.com/2011/10/22/nestor-a-faster-and-simpler-cli-for-jenkins/)
* [Using Node.js To Discover Jenkins On The Network](http://blog.cliffano.com/2011/08/04/using-nodejs-to-discover-jenkins-on-the-network/)
