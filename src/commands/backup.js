const Command = require('../base')
const {flags, args} = require('@oclif/command')
const intro = require('../partials/intro')
const fs = require('fs-extra')
const path = require('path')
const chalk = require('chalk')
const shell = require('shelljs')
const axios = require('axios')
const inquirer = require('inquirer')
const Progress = require('cli-progress')

class BackupCommand extends Command {
  async run() {
    const currentdir = process.cwd()
    const {args, flags} = this.parse(BackupCommand)

    let database, filename
    let date = + new Date()
    if(await fs.exists(path.join(currentdir, 'wp-config.php'))) {
      let config = await fs.readFile(path.join(currentdir, 'wp-config.php'), 'utf8')
      database = config.match(/\'DB_NAME\'\s*,\s*\'([a-z0-9\-\_]+)\'/)[1]
      filename = flags.filename ? `${flags.filename}.sql` : `bowtie-${database}-${date}.sql`

    } else if(await fs.exists(path.join(currentdir, 'www/wp-config.php'))) {
      let config = await fs.readFile(path.join(currentdir, 'www/wp-config.php'), 'utf8')
      database = config.match(/\'DB_NAME\'\s*,\s*\'([a-z0-9\-\_]+)\'/)[1]
      filename = flags.filename ? `${flags.filename}.sql` : `bowtie-${database}-${date}.sql`

    } else if(await fs.exists(path.join(currentdir, 'www'))) {
      this.log(chalk.grey('Getting list of sites from www'))

      const isDirectory = source => {
        return fs.lstatSync(source).isDirectory() && fs.existsSync(path.join(source, 'wp-config.php'))
      }
      const getDirectories = async source => {
        let d = await fs.readdir(source)
        return d.filter(name => {
          return isDirectory(path.join(source, name))
        })
      }

      // Get directories in www
      let dirs = await getDirectories(path.join(currentdir, 'www'))
      
      let site = await inquirer.prompt([
        {
          type: 'list',
          name: 'directory',
          choices: dirs,
          message: 'Choose a site to backup'
        }
      ])

      let config = await fs.readFile(path.join(currentdir, `www/${site.directory}/wp-config.php`), 'utf8')
      database = config.match(/\'DB_NAME\'\s*,\s*\'([a-z0-9\-\_]+)\'/)[1]
      filename = flags.filename ? `${site.directory}/${flags.filename}.sql` : `${site.directory}/bowtie-${database}-${date}.sql`
    }

    // Execute backup command
    this.log(chalk.grey('Backing up to:', filename))
    shell.exec(`vagrant up > /dev/null 2>&1 && vagrant ssh -c "mysqldump --login-path=local ${database} > /var/www/${filename}"`)

    if(await fs.exists(path.join(currentdir, `www/${filename}`))) {
      this.log(chalk.green('Backup complete!'), chalk.grey(filename))
    } else {
      this.error(`Could not create backup of ${database}`)
    }
  }
}

BackupCommand.description = `backup database of Wordpress site`

BackupCommand.args = [
  { name: 'database', description: '[default: defined in wp-config.php] database name to export' }
]

BackupCommand.flags = {
  filename: flags.string({char: 'n', description: '[default: bowtie-{database}-{timestamp}.sql ] filename of sql export'}),
}

module.exports = BackupCommand
