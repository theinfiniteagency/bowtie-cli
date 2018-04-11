const {Command, flags, args} = require('@oclif/command')
const intro = require('../partials/intro')
const fs = require('fs-extra')
const path = require('path')
const chalk = require('chalk')
const shell = require('shelljs')
const axios = require('axios')
const inquirer = require('inquirer')

class StaticCommand extends Command {
  async run() {
    const currentdir = process.cwd()
    const {args, flags} = this.parse(StaticCommand)

    let name = args.name

    this.log(intro)

    let directory_exists = fs.existsSync(path.join(currentdir, name))
    if(directory_exists && flags.force) await fs.remove(path.join(currentdir, name))
    if(directory_exists && !flags.force) return this.error(`A project already exists named ${name}`)

    this.log(chalk.green('✨ Generating new static site:'), `${name}`)

    this.log(chalk.gray('Connecting to Github'))
    shell.exec('ssh -T git@github.com')

    this.log(chalk.gray('Pulling latest master of', 'bowtie-static'))
    shell.exec(`git clone git@github.com:theinfiniteagency/bowtie-static ${name}`)

    if(flags.install) {
      this.log(chalk.gray('Installing package dependencies'))
      shell.exec(`npm install --prefix ./${name}`)
    }
    

    this.log(chalk.green(`🎉 Project generated!`))
    this.log(chalk.green(`🛠  Run 'npm start' to start Webpack and Browsersync`))
    
  }
}

StaticCommand.description = `create a new bowtie-static project`

StaticCommand.args = [
  { name: 'action', required: true, default: 'new', description: 'action to perform', options: ['new'] },
  { name: 'name', required: true, default: 'bowtie-static', description: 'hyphenated name of project' }
]

StaticCommand.flags = {
  force: flags.boolean({char: 'f', description: 'overwrite existing site'}),
  install: flags.boolean({char: 'i', description: 'install packages'}),
}

module.exports = StaticCommand
