# bowtie-cli
A command-line interface to easily create and manage Bowtie Vagrant boxes.

## Installation
```
$ npm install -g bowtie-cli
```

## Usage

Pull latest Vagrant files into folder named `site-name`.
```
$ bowtie new site-name
```

Start the current Vagrant box with provision, this will import the DB from Wordpress dir.
```
$ bowtie up --provision
```

Stop the current Vagrant box.
```
$ bowtie halt
```
