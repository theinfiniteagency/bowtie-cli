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

class ConfigCommand extends Command {
  async run() {
    const currentdir = process.cwd()
    const {args, flags} = this.parse(ConfigCommand)

    let user_config = await this.getUserConfig()
    
    let data = {}
    switch(args.action) {
      case 'get':
        if(args.property) return this.log(user_config[args.property])
        return this.log(user_config)
        break
      case 'set':
        data = {}
        if(args.property && args.value) {
          data[args.property] = args.value
          await this.updateUserConfig(data)
          this.log(chalk.green('Updated',args.property))
        }
        break
      case 'clear':
        data = {}
        if(args.property) {
          data[args.property] = ''
          await this.updateUserConfig(data)
          this.log(chalk.green('Cleared', args.property))
        }
        break
    }

  }
}

ConfigCommand.description = `bowtie configuration`

ConfigCommand.args = [
  { name: 'action', required: true, default: 'get', description: 'action to perform', options: ['get', 'set', 'clear'] },
  { name: 'property', description: 'config property to perform action' },
  { name: 'value', description: 'value of property if setting' },
]

ConfigCommand.flags = {
  // name: flags.string({char: 'n', description: 'site name'}),
  // force: flags.boolean({char: 'f', description: 'overwrite existing site'}),
}

module.exports = ConfigCommand
