const {Command, flags, args} = require('@oclif/command')
const intro = require('../partials/intro')
const fs = require('fs-extra')
const path = require('path')
const chalk = require('chalk')
const shell = require('shelljs')
const axios = require('axios')
const inquirer = require('inquirer')

class ExpressCommand extends Command {
  async run() {
    const currentdir = process.cwd()
    const {args, flags} = this.parse(ExpressCommand)

    let name = args.name

    this.log(intro)

    let directory_exists = fs.existsSync(path.join(currentdir, name))
    if(directory_exists && flags.force) await fs.remove(path.join(currentdir, name))
    if(directory_exists && !flags.force) return this.error(`A project already exists named ${name}`)

    this.log(chalk.green('✨ Generating new Express app:'), `${name}`)

    this.log(chalk.gray('Connecting to Github'))
    shell.exec('ssh -T git@github.com')

    this.log(chalk.gray('Pulling latest master of', 'bowtie-express'))
    shell.exec(`git clone git@github.com:theinfiniteagency/bowtie-express ${name}`)

    if(flags.install) {
      this.log(chalk.gray('Installing package dependencies'))
      shell.exec(`npm install --prefix ./${name}`)
    }
    

    this.log(chalk.green(`🎉 Project generated!`))
    this.log(chalk.green(`🛠  Run 'npm start' to start the app`), chalk.grey('(localhost:5000)'))
    this.log(chalk.green(`🛠  Run 'npm watch' to start Webpack and Browsersync`), chalk.grey('(localhost:3000)'))
    
  }
}

ExpressCommand.description = `create a new bowtie-express project`

ExpressCommand.args = [
  { name: 'action', required: true, default: 'new', description: 'action to perform', options: ['new'] },
  { name: 'name', required: true, default: 'bowtie-express', description: 'hyphenated name of project' }
]

ExpressCommand.flags = {
  force: flags.boolean({char: 'f', description: 'overwrite existing site'}),
  install: flags.boolean({char: 'i', description: 'install packages'}),
}

module.exports = ExpressCommand
