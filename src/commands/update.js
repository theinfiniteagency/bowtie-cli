const Command = require('../base')
const {flags, args} = require('@oclif/command')
const intro = require('../partials/intro')
const fs = require('fs-extra')
const path = require('path')
const chalk = require('chalk')
const shell = require('shelljs')
const axios = require('axios')
const inquirer = require('inquirer')
const keychain = require('keychain')

class UpdateCommand extends Command {
  async run() {
    const currentdir = process.cwd()
    const {args, flags} = this.parse(UpdateCommand)

    this.log(chalk.grey('Updating Vagrant box'))
    shell.exec('vagrant box update --box=theinfiniteagency/bowtie')
    
    this.log(chalk.grey('Updating Bowtie CLI'))
    shell.exec('npm install -g bowtie-cli')

    this.log(chalk.grey('Checking for WP CLI'))
    if(shell.test('-e', '/usr/local/bin/wp')) {
      this.log(chalk.grey('Updating for WP CLI'))
      shell.exec('wp cli update')
    }

    this.log('🎉 Bowtie updated!')

  }
}

UpdateCommand.description = `update cli and Vagrant box`

UpdateCommand.args = [
//   { name: 'action', required: true, default: 'get', description: 'action to perform', options: ['get', 'set', 'clear'] },
]

UpdateCommand.flags = {
  // name: flags.string({char: 'n', description: 'site name'}),
  // force: flags.boolean({char: 'f', description: 'overwrite existing site'}),
}

module.exports = UpdateCommand
