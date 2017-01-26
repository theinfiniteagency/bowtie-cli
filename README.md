# bowtie-cli
A command-line interface to easily create and manage Bowtie Vagrant boxes.

## Installation
```
$ npm install -g bowtie-cli
```

## Usage

```
$ bowtie new site-name
```
Pull latest Vagrant files into folder named `site-name`.

```
$ bowtie up --provision
```
Start the current Vagrant box with provision, this will import the DB from Wordpress dir.

```
$ bowtie halt
```
Stop the current Vagrant box.
