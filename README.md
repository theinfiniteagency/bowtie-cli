bowtie-cli
==========

a cli for The Infinite Agency project scaffolding


<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g bowtie-cli
$ bowtie COMMAND
running command...
$ bowtie (-v|--version|version)
bowtie-cli/3.0.1 darwin-x64 node-v8.9.1
$ bowtie --help [COMMAND]
USAGE
  $ bowtie COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [bowtie backup [DATABASE]](#bowtie-backup-database)
* [bowtie box ACTION HOSTNAME](#bowtie-box-action-hostname)
* [bowtie config ACTION [PROPERTY] [VALUE]](#bowtie-config-action-property-value)
* [bowtie dart](#bowtie-dart)
* [bowtie deploy ACTION](#bowtie-deploy-action)
* [bowtie express ACTION NAME](#bowtie-express-action-name)
* [bowtie geo [ADDRESS]](#bowtie-geo-address)
* [bowtie git ACTION](#bowtie-git-action)
* [bowtie help [COMMAND]](#bowtie-help-command)
* [bowtie restore [DATABASE]](#bowtie-restore-database)
* [bowtie site HOSTNAME](#bowtie-site-hostname)
* [bowtie static ACTION NAME](#bowtie-static-action-name)
* [bowtie update](#bowtie-update)

## bowtie backup [DATABASE]

backup database of Wordpress site

```
USAGE
  $ bowtie backup [DATABASE]

ARGUMENTS
  DATABASE  [default: defined in wp-config.php] database name to export

OPTIONS
  -n, --filename=filename  [default: bowtie-{database}-{timestamp}.sql ] filename of sql export
```

_See code: [src/commands/backup.js](https://github.com/theinfiniteagency/bowtie-cli/blob/v3.0.1/src/commands/backup.js)_

## bowtie box ACTION HOSTNAME

create a new Vagrant box

```
USAGE
  $ bowtie box ACTION HOSTNAME

ARGUMENTS
  ACTION    [default: new] action to perform
  HOSTNAME  [default: bowtie-vagrant] hostname of site

OPTIONS
  -f, --force      overwrite existing site with hostname
  -n, --name=name  set Wordpress site name
```

_See code: [src/commands/box.js](https://github.com/theinfiniteagency/bowtie-cli/blob/v3.0.1/src/commands/box.js)_

## bowtie config ACTION [PROPERTY] [VALUE]

bowtie configuration

```
USAGE
  $ bowtie config ACTION [PROPERTY] [VALUE]

ARGUMENTS
  ACTION    [default: get] action to perform
  PROPERTY  config property to perform action
  VALUE     value of property if setting
```

_See code: [src/commands/config.js](https://github.com/theinfiniteagency/bowtie-cli/blob/v3.0.1/src/commands/config.js)_

## bowtie dart

get Dart Rail schedules

```
USAGE
  $ bowtie dart
```

_See code: [src/commands/dart.js](https://github.com/theinfiniteagency/bowtie-cli/blob/v3.0.1/src/commands/dart.js)_

## bowtie deploy ACTION

manage Buddy projects and trigger pipelines

```
USAGE
  $ bowtie deploy ACTION

ARGUMENTS
  ACTION  [default: pipeline]
          [status] get status of current project pipelines,
          [pipeline] execute a pipeline, use the -p flag to skip selection,
          [add] create a project from current repository

OPTIONS
  -p, --pipeline=pipeline  [default: select from list] pipeline name or id to execute
  -r, --revision=revision  [default: HEAD] revision id to deploy
```

_See code: [src/commands/deploy.js](https://github.com/theinfiniteagency/bowtie-cli/blob/v3.0.1/src/commands/deploy.js)_

## bowtie express ACTION NAME

create a new bowtie-express project

```
USAGE
  $ bowtie express ACTION NAME

ARGUMENTS
  ACTION  [default: new] action to perform
  NAME    [default: bowtie-express] hyphenated name of project

OPTIONS
  -f, --force    overwrite existing site
  -i, --install  install packages
```

_See code: [src/commands/express.js](https://github.com/theinfiniteagency/bowtie-cli/blob/v3.0.1/src/commands/express.js)_

## bowtie geo [ADDRESS]

geocode an address or csv to get coordinates

```
USAGE
  $ bowtie geo [ADDRESS]

ARGUMENTS
  ADDRESS  address to retrieve coordinates for

OPTIONS
  -s, --source=source  relative path to csv to geocode, must have headings: [address, city, state, zip_code]
```

_See code: [src/commands/geo.js](https://github.com/theinfiniteagency/bowtie-cli/blob/v3.0.1/src/commands/geo.js)_

## bowtie git ACTION

manage this project on Github

```
USAGE
  $ bowtie git ACTION

ARGUMENTS
  ACTION  [default: info] action to perform
```

_See code: [src/commands/git.js](https://github.com/theinfiniteagency/bowtie-cli/blob/v3.0.1/src/commands/git.js)_

## bowtie help [COMMAND]

display help for bowtie

```
USAGE
  $ bowtie help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v1.2.3/src/commands/help.ts)_

## bowtie restore [DATABASE]

restore database of Wordpress site

```
USAGE
  $ bowtie restore [DATABASE]

ARGUMENTS
  DATABASE  [default: defined in site wp-config.php] database name to restore to

OPTIONS
  -s, --source=source  relative path to sql file directory
```

_See code: [src/commands/restore.js](https://github.com/theinfiniteagency/bowtie-cli/blob/v3.0.1/src/commands/restore.js)_

## bowtie site HOSTNAME

create a new site in current Vagrant box

```
USAGE
  $ bowtie site HOSTNAME

ARGUMENTS
  HOSTNAME  [default: bowtie-vagrant] hostname of site, will add .test

OPTIONS
  -f, --force      overwrite existing site with domain
  -n, --name=name  set Wordpress site name
```

_See code: [src/commands/site.js](https://github.com/theinfiniteagency/bowtie-cli/blob/v3.0.1/src/commands/site.js)_

## bowtie static ACTION NAME

create a new bowtie-static project

```
USAGE
  $ bowtie static ACTION NAME

ARGUMENTS
  ACTION  [default: new] action to perform
  NAME    [default: bowtie-static] hyphenated name of project

OPTIONS
  -f, --force    overwrite existing site
  -i, --install  install packages
```

_See code: [src/commands/static.js](https://github.com/theinfiniteagency/bowtie-cli/blob/v3.0.1/src/commands/static.js)_

## bowtie update

update cli and Vagrant box

```
USAGE
  $ bowtie update
```

_See code: [src/commands/update.js](https://github.com/theinfiniteagency/bowtie-cli/blob/v3.0.1/src/commands/update.js)_
<!-- commandsstop -->
