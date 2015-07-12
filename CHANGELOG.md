### 0.3.2-pre
* Add build reports to readme
* Fix broken build command when no parameter is specified
* Fix broken auth username and password prompt with interactive flag

### 0.3.1
* Monitor Jenkins instance and view checks all jobs instead of just the first job

### 0.3.0
* Modify Jenkins module to pass Jenkins REST API as-is, update method names (NOTE: backward incompatible with <= 0.2.x)
* Reorganise code structure
* Move buildlight support to http://github.com/cliffano/nestor-buildlight
* Move ninjablocks support to http://github.com/cliffano/nestor-ninjablocks
* Display job status in lowercase
* Remove build-all, build-fail, and irc commands
* Modify monitor to accept job, view, and schedule args, and return status in lowercase

### 0.2.4
* Add create-view, update-view, and fetch-view-config commands
* Add create-job command, create command is now an alias of create-job
* Add update-job command, update command is now an alias of update-job
* Add enable-job command, enable command is now an alias of enable-job
* Add disable-job command, disable command is now an alias of disable-job
* Add copy-job command, copy command is now an alias of copy-job
* Add delete-job command, delete command is now an alias of delete-job
* Add fetch-job-config command, config command is now an alias of fetch-job-config
* Add last command [Alistair Dutton](https://github.com/kelveden)

### 0.2.3
* Add enable and disable commands
* Add update and config commands

### 0.2.2
* Change test lib to buster-node + referee
* Set min node engine to >= v0.8.0
* Add blink on failure flag to buildlight command #23
* Add create, copy, and delete commands #25

### 0.2.1
* BuildLight notifier blinks red on build failure
* Fix buildlight command memory leak

### 0.2.0
* Add l10n support, with en and id locales
* Executor command collapses idle executors list into a summary

### 0.1.10
* Add discover command timeout after 5 seconds
* Add view dashboard support

### 0.1.9
* Add build-all and build-fail commands

### 0.1.8
* Fix command with optional flag, no longer displays help menu

### 0.1.7
* Fix unhandled response 201 on Jenkins v1.5xx when creating a job
* Fix IllegalAccessException 500 error on Jenkins v1.5xx when stopping a job
* Nick argument is now mandatory for irc command

### 0.1.6
* Add url flag
* Add interactive flag
* Change default timeout from 2secs to 30secs

### 0.1.5
* Change buildlight status colour mapping, unknown displays blue, warn displays all colours to simulate yellow
* Add view monitoring support
* Change feed jobName and viewName passing to use flags instead of args
* Change feed status handling to check for latest status of all jobs in the feed

### 0.1.4
* Add buildlight command
* Ninja command's job and schedule are now flags since they are optional

### 0.1.3
* Fix build trigger error on Jenkins v1.5xx when job requires auth 

### 0.1.2
* Move proxy environment variable handling to bag.http.request and bag.http.proxy
* Add feed command
* Add jenkins#monitor and ninja command
* Add jenkins#consoleStream [Whyme Lyu](https://github.com/5long)
* Add -p/--pending flag to build command

### 0.1.1
* Move status colouring to cli so that when lib/jenkins is used programatically then it gets plain uncoloured text
* JENKINS_URL is now handled by lib/jenkins

### 0.1.0
* Move commands setup to conf/commands.json, cli handling to bag.cli.command
* Move request handling to bag.http.request
* Change unit tests from Mocha to Buster
* Add irc command
* Modify Jenkins constructor, proxy is now part of opts

### 0.0.10
* Add stop command
* Colourise build status display
* Add -c/--console flag to build command

### 0.0.9
* Add proxy support
* Add console command

### 0.0.8
* Fix unexpected status code 405 on parameterised build
* Display error message when parameterised build is triggered without parameters

### 0.0.7
* Set max node engine to < 0.9.0

### 0.0.6
* Fix error message for status code 401 (authentication failed, instead of authentication required)
* Add sample usage commands to help info nestor -h

### 0.0.5
* Another rewrite lib (move to bagofholding, mocha, request)
* Fix undefined job status display
* Replace version command with ver (version is reserved by visionmedia/commander.js)

### 0.0.4
* Display usage on arg-less comamand
* Add support for Jenkins URL containing path e.g. http://host:port/path

### 0.0.3
* Rewrite lib

### 0.0.2
* Add Jenkins discovery feature
* Upgrade nomnom to 1.0.0
* Fix commands-flags association
* Add multiple job names support for job command

### 0.0.1
* Initial version
