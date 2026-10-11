# AGENTS.md

This repository contains a Node.js project following a unified standard for tooling, build automation, and coding conventions. All projects share the same tooling stack and conventions to ensure consistency and maintainability.

The key components of the standard include:

- Build automation (Suntory)
- Project definition and dependency management (npm)
- Code formatting (Prettier)
- Static analysis (ESLint)
- Testing (Mocha + Sinon)

This document outlines the common conventions that apply across the Node.js projects.

## Node.js Version & Dependencies

- **Node.js Version**: 22+
- **Dependency Manager**: npm
- **Lock File**: `package-lock.json` (checked in)
- **Dependency Specification**: `package.json`

### Adding Dependencies

```bash
npm install package_name          # Add to runtime deps
npm install --save-dev pkg_name   # Add to dev deps
make deps                         # Install all deps
```

## Project Structure

```text
project/
├── bin/                      # CLI entry points
│   └── <project>.js
├── conf/                     # Configuration files (commands.json, etc.)
├── examples/                 # Example configs and usage
│   └── *.sh
├── lib/                      # Main module source files
│   ├── <module>.js
│   └── ...
├── test/                     # Unit tests
│   ├── <module>.js
│   └── ...
├── test-integration/         # Integration tests
├── stage/                    # Temporary stage files
├── .bob/                     # Bob build output directory
├── .bob.json                 # Bob build tool configuration
├── .github/                  # GitHub workflows
├── .gitignore                # Git ignore rules
├── .rtk.json                 # RTK configuration
├── avatar.jpg                # Project avatar (80x80 pixels)
├── AGENTS.md                 # Agent instructions (this file)
├── CHANGELOG.md              # Changelog file following Keep a Changelog format
├── eslint.config.js          # ESLint configuration
├── LICENSE                   # License file
├── Makefile                  # Build automation (Suntory)
├── Makefile-extras           # Additional Makefile targets specific to the project
├── package.json              # npm package definition
├── package-lock.json         # Locked dependencies
├── README.md                 # Project README
└── suntory.yml               # Suntory configuration
```

## Build Automation (Suntory)

This Node.js project uses **Suntory** as a standard build automation tool that unifies the build pipeline across all projects. The Makefile is sourced from the Suntory project and managed via `make update-to-latest` / `make update-to-version`.

Build tasks are delegated to **Bob** (`bob` CLI), which is the underlying build executor called by the Makefile targets.

### Common Commands

```bash
make ci                # Run full CI pipeline
make all               # Alias for ci
make clean             # Remove temporary files using bob clean
make stage             # Create stage directory using mkdir
make deps              # Install bob globally and run bob dep
make deps-upgrade      # Upgrade dependencies using bob updep
make rmdeps            # Remove node_modules and package-lock.json using bob rmdep
make style             # Check/format code using Prettier (bob style)
make lint              # Run static analysis using ESLint (bob lint)
make test              # Run unit tests using Mocha (bob test)
make test-examples     # Run example shell scripts using bash
make coverage          # Generate coverage reports using c8 (bob coverage)
make complexity        # Run complexity analysis (bob complexity)
make doc               # Generate documentation using JSDoc (bob doc)
make package           # Build package (bob package)
make install           # Link package locally using npm link
make uninstall         # Unlink package using npm unlink
make reinstall         # Uninstall then install
make test-integration  # Run integration tests (bob test-integration)
```

### Release Targets

```bash
make release-major     # Create major release using RTK
make release-minor     # Create minor release using RTK
make release-patch     # Create patch release using RTK
```

### Update Targets

```bash
make update-to-latest  # Update Makefile to latest Suntory tag using curl + GitHub API + jq
make update-to-main    # Update Makefile to Suntory main branch using curl
make update-to-version # Update Makefile to specific Suntory version using curl
make update-dotfiles   # Refresh project dotfiles using generator-node (git clone + plop + cp)
```

## Development Environment

This project is designed to be developed in a consistent environment via Docker image `cliffano/studio`.

You can run the container using: `docker run --rm --workdir /opt/workspace -v /var/run/docker.sock:/var/run/docker.sock -v $PWD:/opt/workspace -i -t cliffano/studio` and then run the build commands inside the container.

Alternatively you can run the Suntory Makefile targets via Docker container entrypoint, e.g. `docker run --rm --workdir /opt/workspace -v /var/run/docker.sock:/var/run/docker.sock -v $PWD:/opt/workspace -i -t cliffano/studio make ci`.

## Code Style and Linting

Applies to: `**/*.js`

- Formatting uses Prettier via `make style`
- Static analysis uses ESLint via `make lint`

### Style & Formatting

#### Prettier Formatter

All code must pass `prettier` formatting:

```bash
make style  # Via Suntory
```

**Guidelines**:

- Use double quotes for strings (Prettier default)
- Don't manually format — `prettier` is authoritative
- Line length: 80 characters max

#### ESLint Static Analysis

All code should have zero ESLint error and warning:

```bash
make lint
```

**Guidelines**:

- Disable rules only when justified: `/* eslint rule-name: 0 */`
- Use specific rule names, not blanket disables when the exemptions are only specific lines
- Attempt to fix warning root causes before disabling

### Node.js Conventions

#### Module System

Use ES modules (`"type": "module"` in `package.json`):

```js
"use strict";
import async from "async";
import p from "path";
import fs from "fs";
```

- Always include `"use strict";` at the top of every file
- Use named imports where possible
- Group imports: built-in Node.js modules first, then third-party, then local

```js
"use strict";
import fs from "fs";
import p from "path";

import async from "async";
import sinon from "sinon";

import config from "./config.js";
import runner from "./runner.js";
```

#### Classes

Use ES6 classes for object-oriented modules:

```js
class MyService {
  /**
   * Constructor for initialising MyService.
   *
   * @param {Object} opts: optional
   * - configFile: path to the configuration file
   * - timeout: request timeout in milliseconds
   */
  constructor(opts) {
    this.opts = opts;
  }

  /**
   * Execute the main operation.
   *
   * @param {Array} items: list of items to process
   * @param {Function} cb: standard cb(err, result) callback
   */
  execute(items, cb) {
    // implementation
  }
}

export default MyService;
```

#### Callbacks

Use the Node.js standard callback convention `cb(err, result)`:

```js
function doSomething(input, cb) {
  if (!input) {
    cb(new Error("Input is required"));
  } else {
    cb(null, result);
  }
}
```

- Always check for errors before using results
- Use `async` library for control flow (series, parallel, waterfall)

#### Naming Conventions

- **Classes**: `PascalCase` (e.g., `DataProcessor`, `ConfigManager`)
- **Functions/Methods**: `camelCase` (e.g., `processData`, `_formatOutput`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `MAX_BATCH_SIZE`, `DEFAULT_TIMEOUT`)
- **Private/Internal**: Prefix with `_` (e.g., `_internalHelper`, `_formatError`)
- **Variables**: `camelCase` (e.g., `resultData`, `itemCount`)
- **Files**: `kebab-case.js` or match the module name (e.g., `bagofcli.js`, `config.js`)

#### Logging

Use `bagofcli` or a dedicated logger — never use `console.log` directly in library code.

For CLI output, use the logger provided by `bagofcli`:

```js
import bag from "bagofcli";

bag.cli.exit(err, result);
```

**Guidelines**:

- Use `console.error` only for fatal/unexpected errors in CLI entry points
- Library modules must not call `console.log` or `process.exit` directly
- Pass errors back via callbacks or throw them

### File Organization

#### Module Structure

```js
// 1. Strict mode directive
"use strict";

// 2. Imports — built-ins, then third-party, then local
import fs from "fs";
import async from "async";
import config from "./config.js";

// 3. Constants
const DEFAULT_TIMEOUT = 30000;
const MAX_RETRIES = 3;

// 4. Class or function definitions
class MyModule {
  ...
}

// 5. Export
export default MyModule;
```

#### CLI Entry Points

CLI files live in `bin/` and delegate all logic to `lib/`:

```js
#!/usr/bin/env node
"use strict";
import cli from "../lib/cli.js";
cli.exec();
```

#### Command Configuration

CLI commands are defined in `conf/commands.json`:

```json
{
  "commands": {
    "mycommand": {
      "desc": "Description of the command",
      "options": [
        {
          "arg": "-f, --flag",
          "desc": "Flag description"
        }
      ]
    }
  }
}
```

### Error Handling

#### Use Callbacks with Errors, Not Exceptions

```js
// Good: pass errors via callback
function readConfig(file, cb) {
  fs.readFile(file, "utf8", function (err, data) {
    if (err) {
      cb(err);
    } else {
      cb(null, JSON.parse(data));
    }
  });
}
```

#### Propagate Errors Up

```js
function processAll(items, cb) {
  async.eachSeries(
    items,
    function (item, next) {
      processOne(item, function (err) {
        if (err) {
          next(err);
        } else {
          next();
        }
      });
    },
    cb
  );
}
```

### JSDoc Documentation

Add JSDoc comments to all public classes and methods:

```js
/**
 * Process a list of items in batches.
 *
 * @param {Array} items: list of items to process
 * @param {Number} batchSize: number of items per batch
 * @param {Function} cb: standard cb(err, result) callback
 */
function processBatch(items, batchSize, cb) {
  ...
}
```

**Guidelines**:

- Document all parameters with `@param {Type} name: description`
- Document return value with `@return {Type} description` for synchronous functions
- Use `@param {Function} cb: standard cb(err, result) callback` for async functions

## Testing

Applies to: `test/**/*.js`, `test-integration/**/*.js`

- Unit tests live in `test/`
- Integration tests live in `test-integration/`
- Run tests with `make test` and `make test-integration`

### Test Structure

#### Unit Tests

**Location**: `test/<module>.js`

**Purpose**: Test individual functions/methods in isolation

**Scope**:

- No filesystem and network calls (mock them)
- Faster execution
- High code coverage

#### Integration Tests

**Location**: `test-integration/<module>.js`

**Purpose**: Test end-to-end flows with real or semi-real external systems

**Scope**:

- May use filesystem and network calls (with test fixtures or mocks if needed)
- Slower execution
- Broader coverage (fewer, larger tests)

#### Test Files

```text
test/
  module1.js          # Tests for lib/module1.js
  module2.js          # Tests for lib/module2.js
  util.js             # Tests for lib/util.js

test-integration/
  cli.js               # Integration tests for CLI
  commands.yml         # Integration test command definitions
```

#### Test Suites

Use `describe` blocks to group tests by module and method:

```js
describe("modulename - methodname", function () {
  ...
});

describe("cli - exec", function () {
  ...
});

describe("config - load", function () {
  ...
});
```

**Pattern**: `<modulename> - <methodname>`

#### Test Cases

```js
it("should do something when condition", function (done) {
  ...
});

it("should pass error to callback when input is invalid", function (done) {
  ...
});

it("should construct commands and pass them to series", function (done) {
  ...
});
```

**Pattern**: `should <expected behaviour> when <condition>`

### Mocha Execution

#### Running Tests

```bash
# All tests
make test

# Specific file
node_modules/.bin/mocha test/config.js

# Test matching a keyword
node_modules/.bin/mocha --grep "load"
```

#### Configuration

- Framework: `mocha`
- Timeout: `5000ms` (set via `MOCHA_OPTIONS="--timeout 5000"`)
- Coverage: `c8` (via `make coverage`)

### Mocking Best Practices

#### Import Mocking

```js
import sinon from "sinon";
import referee from "@sinonjs/referee";
```

#### Sinon Mocks and Stubs

Use `sinon.mock()` for verifiable mock expectations and `sinon.stub()` for simple replacements:

```js
describe("mymodule - process", function () {
  beforeEach(function () {
    this.mockFs = sinon.mock(fs);
  });

  afterEach(function () {
    this.mockFs.verify();
    this.mockFs.restore();
  });

  it("should read file and process contents", function (done) {
    this.mockFs
      .expects("readFile")
      .once()
      .withExactArgs("config.json", "utf8")
      .callsArgWith(2, null, '{"key":"value"}');
    mymodule.process("config.json", function (err, result) {
      referee.assert.isNull(err);
      referee.assert.equals(result.key, "value");
      done();
    });
  });
});
```

#### Stub Values

Use `sinon.stub().value()` to replace module-level imports or object properties:

```js
sinon.stub(bag, "command").value(function (base, actions) {
  actions.commands.release.action({ releaseIncrementType: "minor" });
});
```

#### Restore After Each Test

Always restore mocks and stubs in `afterEach` to avoid cross-test pollution:

```js
afterEach(function () {
  this.mockDependency.verify();
  this.mockDependency.restore();
  sinon.restore();
});
```

#### Mock Structure

```js
// Create mock
this.mockRunner = sinon.mock(runner);

// Set expectations
this.mockRunner
  .expects("execSeries")
  .withArgs(["command1", "command2"])
  .callsArgWith(2, null, "someresult");

// Verify and restore
this.mockRunner.verify();
this.mockRunner.restore();
```

#### Mocking Async Callbacks

Use `callsArgWith(index, err, result)` to simulate async callback invocations:

```js
this.mockRunner
  .expects("execSeries")
  .once()
  .callsArgWith(2, null, "someresult");
```

#### Mocking File I/O

```js
this.mockFs
  .expects("readFileSync")
  .once()
  .withExactArgs("/some/package.json")
  .returns(JSON.stringify({ version: "1.2.3" }));
```

### Test Assertion Patterns

Use `@sinonjs/referee` for assertions:

```js
import referee from "@sinonjs/referee";
const assert = referee.assert;
```

#### Basic Assertions

```js
// Null / undefined
referee.assert.isNull(err);
referee.assert.isUndefined(result);

// Equality
referee.assert.equals(result, "expectedvalue");
referee.assert.equals(err.message, "someerror");

// Type checking
referee.assert.isString(base);
referee.assert.isFunction(actions.commands.release.action);

// Truthiness
referee.assert.isTrue(flag);
referee.assert.isFalse(flag);
```

#### Mock Assertions

```js
// Expectation set via sinon mock — verified in afterEach
this.mockRunner.expects("execSeries").once();
this.mockRunner.verify(); // called in afterEach

// Manual assertion on stub call count
referee.assert.equals(stubFn.callCount, 2);
```

### Test File Structure

```js
"use strict";
import MyClass from "../lib/mymodule.js";
import dependency from "../lib/dependency.js";
import referee from "@sinonjs/referee";
import sinon from "sinon";

describe("mymodule - methodname", function () {
  beforeEach(function () {
    this.mockDependency = sinon.mock(dependency);
  });

  afterEach(function () {
    this.mockDependency.verify();
    this.mockDependency.restore();
  });

  it("should do expected thing when condition is met", function (done) {
    this.mockDependency
      .expects("someMethod")
      .once()
      .callsArgWith(1, null, "result");

    const instance = new MyClass({});
    instance.methodname("input", function (err, result) {
      referee.assert.isNull(err);
      referee.assert.equals(result, "result");
      done();
    });
  });

  it("should pass error to callback when dependency fails", function (done) {
    this.mockDependency
      .expects("someMethod")
      .once()
      .callsArgWith(1, new Error("someerror"));

    const instance = new MyClass({});
    instance.methodname("input", function (err, result) {
      referee.assert.equals(err.message, "someerror");
      referee.assert.isUndefined(result);
      done();
    });
  });
});
```

### Coverage

#### Generate Coverage Report

```bash
make coverage
```

#### Coverage Goals

- Aim for >= 90% code coverage
- Focus on critical paths (success flows, error handling)
- Be pedantic and don't ignore trivial getters/setters

#### Coverage Tooling

- Coverage engine: `c8`
- Unit coverage output: `.bob/coverage/c8/`
- LCOV report: `.bob/coverage/c8/lcov.info`
- HTML report: `.bob/coverage/c8/index.html`

#### Coverage Guidelines

- Prioritise meaningful branch and error-path coverage, not just line coverage
- Add tests for callback error paths (`cb(err)`) and success paths (`cb(null, result)`)
- Include coverage for CLI command option parsing and command dispatch
- Keep unit tests deterministic and isolated from network/filesystem unless explicitly integration tests

### CI Integration

Tests are run as part of `make ci`:

```bash
make test              # Unit tests
make test-integration  # Integration tests
```

All tests must pass before merging.

## Documentation

- Documentation is generated with JSDoc via `make doc`
- Generated outputs live under `.bob/`

Common generated subdirectories under `.bob/`:

- `dep/` for dependency installation outputs
- `doc/` for generated API documentation
- `style/` for code formatting outputs
- `lint/` for lint reports
- `package/` for built package artifacts
- `coverage/` for coverage reports
- `complexity/` for complexity analysis reports
- `test/` for unit test reports
- `test-integration/` for integration test reports

## Continuous Integration Pipeline

The Makefile (Suntory) orchestrates standard build targets, with `make ci` running the following steps in sequence:

- deps              # 1. Install dependencies
- clean             # 2. Clean temp files
- style             # 3. Format & check code (prettier)
- lint              # 4. Static analysis (eslint)
- test              # 5. Unit tests (mocha)
- coverage          # 6. Coverage reports (c8)
- complexity        # 7. Complexity analysis
- doc               # 8. Generate documentation (jsdoc)
- package           # 9. Build distribution
- reinstall         # 10. Clean install from package
- test-integration  # 11. Integration tests

All steps must pass before code is merged. Developers should run `make ci` locally before pushing to ensure the CI pipeline will pass.

After the code is merged, the CI pipeline will run as GitHub CI workflow.

### Common Commit Message Patterns

Use clear, imperative commit messages:

- `Fix test patch paths by avoiding command/module name collisions`
- `Add unit tests for blur-plates module`
- `Update README and example script to use categorise-orientation`
- `Remove deprecated blur-plates module and related code`

## GitHub Workflows

This repository defines the following workflows under `.github/workflows/`:

- **CI** (`ci-workflow.yaml`): Trigger: `push`, `pull_request`, and manual `workflow_dispatch`. Purpose: Runs the full quality pipeline (`bob build`) across a Node.js version matrix (usually LTS versions), publishes coverage to Coveralls, and publishes generated docs to GitHub Pages.

- **CodeQL** (`codeql-analysis.yml`): Trigger: `push` to `main`, `pull_request` targeting `main`, and weekly scheduled run (`cron`). Purpose: Performs GitHub CodeQL static security analysis for JavaScript and uploads code scanning results.

- **Publish** (`publish-workflow.yaml`): Trigger: `push` of any Git tag. Purpose: Builds and installs the package, then publishes it using `bob publish` via npm's trusted publishing (no stored token required).

- **Release Major** (`release-major-workflow.yaml`): Trigger: Manual `workflow_dispatch`. Purpose: Creates a major release via `cliffano/release-action` (`release_type: major`).

- **Release Minor** (`release-minor-workflow.yaml`): Trigger: Manual `workflow_dispatch`. Purpose: Creates a minor release via `cliffano/release-action` (`release_type: minor`).

- **Release Patch** (`release-patch-workflow.yaml`): Trigger: Manual `workflow_dispatch`. Purpose: Creates a patch release via `cliffano/release-action` (`release_type: patch`).

- **Upgrade Deps** (`upgrade-deps-workflow.yaml`): Trigger: Manual `workflow_dispatch`. Purpose: Upgrades dependencies using `bob updep build`, commits dependency updates, and pushes changes back to the current branch.
