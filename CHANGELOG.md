# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

## 3.1.1 - 2025-08-12
### Fixed
- Fix main file reference
- Fix deprecated url.parse and url.format usage

## 3.1.0 - 2025-08-06
### Removed
- Remove bagoftext locale support
- Remove commander and proxyquire deps

### Fixed
- Fix nestor bin command

## 3.0.0 - 2025-08-03
### Changed
- Change module type to ESM
- Replace lint type from jshint to eslint
- Replace coverage from buster-istanbul to c8
- Replace doc type from dox-foundation to jsdoc
- Replace test type from buster to mocha
- Switch CHANGELOG to use keep-a-changelog
- Replace Travis CI with GH Actions
- Failure test scenario now includes EAI_AGAIN for DNS lookup error
- Replace feed-read with rss-parser for feed handling

### Fixed
- Fix discovery host arg handling
- Fix console streaming check callback call

## 2.2.2 - 2022-06-27
### Changed
- Upgrade dependencies

## 2.2.1 - 2022-06-21
### Fixed
- Fix Jenkins crumb retrieval when URL path is not on the root context

## 2.2.0 - 2022-06-21
### Changed
- Upgrade swaggy-jenkins to 1.0.0

## 2.0.0 - 2019-02-14
### Changed
- Replace request and bagofrequest modules with swaggy-jenkins

### Fixed
- Fix job build not streaming console output when --console flag is used with build command [#46]

## 1.0.2 - 2016-10-25
### Added
- Add optional build number argument to console command [#44]

## 1.0.1 - 2016-10-23
### Added
- Add crumb request header because new Jenkins >= 2.x installation enables CSRF protection by default [#40]

## 1.0.0 - 2016-10-19
### Removed
- Remove confusing reference to 'Jenkins URL' in authentication error message [#41]

### Fixed
- Fix semver spec of node engine for compatibility with Yarn [Andreas Köhler](https://github.com/andi5)

## 0.3.6 - 2016-09-21
### Changed
- Wait for build to start before streaming the console [#38] [Joe Littlejohn](https://github.com/joelittlejohn)

## 0.3.5 - 2016-08-19
### Added
- Add NO_PROXY support via bagofrequest v0.1.4 for issue [#36]

## 0.3.4 - 2016-08-14
### Changed
- Replace feedparser with feed-read due to feedparser's API change post v0.15.x
- Update doc with triggering parameterised build with console output
- Handle build param which includes '=' delimiter sign in the value
- Set min node engine to >= 4.0.0

### Fixed
- Fix missing colours on dashboard output

## 0.3.3 - 2015-11-05
### Added
- Add SSL certificate support [Benedikt Arnold](https://github.com/benediktarnold)

### Changed
- Handle job object without color property

## 0.3.2 - 2015-07-12
### Added
- Add build reports to readme

### Fixed
- Fix broken build command when no parameter is specified
- Fix broken auth username and password prompt with interactive flag

## 0.3.1 - 2015-02-09
### Changed
- Monitor Jenkins instance and view checks all jobs instead of just the first job

## 0.3.0 - 2015-02-02
### Changed
- Modify Jenkins module to pass Jenkins REST API as-is, update method names (NOTE: backward incompatible with <= 0.2.x)
- Reorganise code structure
- Move buildlight support to https://github.com/cliffano/nestor-buildlight
- Move ninjablocks support to https://github.com/cliffano/nestor-ninjablocks
- Display job status in lowercase
- Modify monitor to accept job, view, and schedule args, and return status in lowercase

### Removed
- Remove build-all, build-fail, and irc commands

## 0.2.4 - 2014-05-01
### Added
- Add create-view, update-view, and fetch-view-config commands
- Add create-job command, create command is now an alias of create-job
- Add update-job command, update command is now an alias of update-job
- Add enable-job command, enable command is now an alias of enable-job
- Add disable-job command, disable command is now an alias of disable-job
- Add copy-job command, copy command is now an alias of copy-job
- Add delete-job command, delete command is now an alias of delete-job
- Add fetch-job-config command, config command is now an alias of fetch-job-config
- Add last command [Alistair Dutton](https://github.com/kelveden)

## 0.2.3 - 2014-02-13
### Added
- Add enable and disable commands
- Add update and config commands

## 0.2.2 - 2014-02-12
### Added
- Add blink on failure flag to buildlight command [#23]
- Add create, copy, and delete commands [#25]

### Changed
- Change test lib to buster-node + referee
- Set min node engine to >= v0.8.0

## 0.2.1 - 2013-08-28
### Added
- BuildLight notifier blinks red on build failure

### Fixed
- Fix buildlight command memory leak

## 0.2.0 - 2013-08-24
### Added
- Add l10n support, with en and id locales
- Add discover command timeout after 5 seconds
- Add view dashboard support

### Changed
- Executor command collapses idle executors list into a summary

## 0.1.9 - 2013-07-17
### Added
- Add build-all and build-fail commands

## 0.1.8 - 2013-07-15
### Fixed
- Fix command with optional flag, no longer displays help menu

## 0.1.7 - 2013-07-14
### Changed
- Nick argument is now mandatory for irc command

### Fixed
- Fix unhandled response 201 on Jenkins v1.5xx when creating a job
- Fix IllegalAccessException 500 error on Jenkins v1.5xx when stopping a job

## 0.1.6 - 2013-06-17
### Added
- Add url flag
- Add interactive flag

### Changed
- Change default timeout from 2secs to 30secs

## 0.1.5 - 2013-05-09
### Added
- Add view monitoring support

### Changed
- Change buildlight status colour mapping, unknown displays blue, warn displays all colours to simulate yellow
- Change feed jobName and viewName passing to use flags instead of args
- Change feed status handling to check for latest status of all jobs in the feed

## 0.1.4 - 2013-04-17
### Added
- Add buildlight command

### Changed
- Ninja command's job and schedule are now flags since they are optional

## 0.1.3 - 2013-04-06
### Fixed
- Fix build trigger error on Jenkins v1.5xx when job requires auth

## 0.1.2 - 2013-04-04
### Added
- Add feed command
- Add jenkins#monitor and ninja command
- Add jenkins#consoleStream [Whyme Lyu](https://github.com/5long)
- Add -p/--pending flag to build command

### Changed
- Move proxy environment variable handling to bag.http.request and bag.http.proxy

## 0.1.1 - 2013-01-23
### Changed
- Move status colouring to cli so that when lib/jenkins is used programatically then it gets plain uncoloured text
- JENKINS_URL is now handled by lib/jenkins

## 0.1.0 - 2013-01-23
### Added
- Add irc command

### Changed
- Move commands setup to conf/commands.json, cli handling to bag.cli.command
- Move request handling to bag.http.request
- Change unit tests from Mocha to Buster
- Modify Jenkins constructor, proxy is now part of opts

## 0.0.10 - 2012-11-24
### Added
- Add stop command
- Colourise build status display
- Add -c/--console flag to build command

## 0.0.9 - 2012-11-21
### Added
- Add proxy support
- Add console command

## 0.0.8 - 2012-06-28
### Changed
- Display error message when parameterised build is triggered without parameters

### Fixed
- Fix unexpected status code 405 on parameterised build

## 0.0.7 - 2012-06-26
### Changed
- Set max node engine to < 0.9.0

## 0.0.6 - 2012-05-30
### Added
- Add sample usage commands to help info nestor -h

### Fixed
- Fix error message for status code 401 (authentication failed, instead of authentication required)

## 0.0.5 - 2012-05-27
### Added
- Add support for Jenkins URL containing path e.g. http://host:port/path

### Changed
- Another rewrite lib (move to bagofholding, mocha, request)
- Replace version command with ver (version is reserved by visionmedia/commander.js)
- Display usage on arg-less comamand

### Fixed
- Fix undefined job status display

## 0.0.3 - 2012-12-21
### Changed
- Rewrite lib

## 0.0.2 - 2011-12-12
### Added
- Add Jenkins discovery feature
- Add multiple job names support for job command

### Changed
- Upgrade nomnom to 1.0.0

### Fixed
- Fix commands-flags association

## 0.0.1 - 2011-07-18
### Added
- Initial version
