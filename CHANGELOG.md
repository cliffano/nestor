### 0.2.0
* Add l10n support, with en and id locales

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
* Add jenkins#consoleStream (Whyme Lyu)
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
