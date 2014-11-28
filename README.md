<img align="right" src="https://raw.github.com/cliffano/nestor/master/avatar.jpg" alt="Avatar"/>

[![Build Status](https://secure.travis-ci.org/cliffano/nestor.png?branch=master)](http://travis-ci.org/cliffano/nestor)
[![Dependencies Status](https://david-dm.org/cliffano/nestor.png)](http://david-dm.org/cliffano/nestor)
[![Coverage Status](https://coveralls.io/repos/cliffano/nestor/badge.png?branch=master)](https://coveralls.io/r/cliffano/nestor?branch=master)
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

Enable a job:

    nestor enable <job>

Disable a job:

    nestor disable <job>

Create a new job with a specified config.xml:

    nestor create <job> <path/to/config.xml>

Update an existing job with a specified config.xml:

    nestor update <job> <path/to/config.xml>

Copy an existing job1 to a new job2:

    nestor copy <job1> <job2>

Delete an existing job:

    nestor delete <job>

Fetch the config.xml of an existing job: (experimental)

    nestor config <job>

Create a new view with a specified config.xml: (experimental)

    nestor create-view <view> <path/to/config.xml>

Update an existing view with a specified config.xml: (experimental)

    nestor update-view <view> <path/to/config.xml>

Fetch the config.xml of an existing view: (experimental)

    nestor fetch-view-config <view>

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
3. Test by executing a command with LANG environment variable, e.g. `LANG=<code> nestor dashboard`

Colophon
--------

[Developer's Guide](http://cliffano.github.io/developers_guide.html#nodejs)

Articles:

* [Nestor – A Faster And Simpler CLI For Jenkins](http://blog.cliffano.com/2011/10/22/nestor-a-faster-and-simpler-cli-for-jenkins/)
* [Monitor Jenkins From The Terminal](http://blog.cliffano.com/2013/09/13/monitor-jenkins-from-the-terminal/)
* [Using Node.js To Discover Jenkins On The Network](http://blog.cliffano.com/2011/08/04/using-nodejs-to-discover-jenkins-on-the-network/)

Related Projects:

* [nestor-buildlight](http://github.com/cliffano/nestor-buildlight) - CLI for Jenkins build light notifier
* [nestor-ninjablocks](http://github.com/cliffano/nestor-ninjablocks) - CLI for Jenkins Ninja Blocks notifier