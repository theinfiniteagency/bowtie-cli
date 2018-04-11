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

class RestoreCommand extends Command {
  async run() {
    const currentdir = process.cwd()
    const {args, flags} = this.parse(RestoreCommand)

    const isSQL = source => {
      return !fs.lstatSync(source).isDirectory() && (path.extname(source).indexOf('.sql') > -1)
    }
    const getSQLFiles = async source => {
      let d = await fs.readdir(source)
      return d.filter(name => {
        return isSQL(path.join(source, name))
      })
    }
    const isDirectory = source => {
      return fs.lstatSync(source).isDirectory() && fs.existsSync(path.join(source, 'wp-config.php'))
    }
    const getDirectories = async source => {
      let d = await fs.readdir(source)
      return d.filter(name => {
        return isDirectory(path.join(source, name))
      })
    }

    let database, filename, directory = ''
    let date = + new Date()
    if(await fs.exists(path.join(currentdir, 'wp-config.php'))) {
      let config = await fs.readFile(path.join(currentdir, 'wp-config.php'), 'utf8')
      database = config.match(/\'DB_NAME\'\s*,\s*\'([a-z]+)\'/)[1]

    } else if(await fs.exists(path.join(currentdir, 'www/wp-config.php'))) {
      let config = await fs.readFile(path.join(currentdir, 'www/wp-config.php'), 'utf8')
      database = config.match(/\'DB_NAME\'\s*,\s*\'([a-z]+)\'/)[1]
      directory = 'www/'

    } else if(await fs.exists(path.join(currentdir, 'www'))) {
      this.log(chalk.grey('Getting list of sites from www'))

      // Get directories in www
      let dirs = await getDirectories(path.join(currentdir, 'www'))
      
      let site = await inquirer.prompt([
        {
          type: 'list',
          name: 'directory',
          choices: dirs,
          message: 'Choose a site to restore'
        }
      ])

      let config = await fs.readFile(path.join(currentdir, `www/${site.directory}/wp-config.php`), 'utf8')
      database = config.match(/\'DB_NAME\'\s*,\s*\'([a-z]+)\'/)[1]
      directory = `www/${site.directory}/`
    } else {
      return this.error('Could not find a site to restore to. Execute from a vagrant project root, or directory of site with wp-config.php')
    }


    this.log(chalk.grey('Restoring to db:', database))

    // Search for sql files in directory, if source not provided
    if(flags.source) {
      directory = flags.source
      this.log(chalk.grey('Getting list of files in ', directory))
    }

    let sql_files = await getSQLFiles(path.join(currentdir, directory))
    if(sql_files.length == 0) return this.error(`No SQL files found in ${path.join(currentdir, directory)}`)
    let choose_sql = await inquirer.prompt([
      {
        type: 'list',
        name: 'filename',
        choices: sql_files,
        message: 'Choose a SQL file to restore'
      }
    ])

    filename = choose_sql.filename
    this.log(chalk.grey('Restoring from:', directory + filename))
    // Adding www for server path if command was executed within www
    if(!directory) directory = 'www/'

    // Execute backup command
    shell.exec(`vagrant up > /dev/null 2>&1 && vagrant ssh -c "mysql --login-path=local ${database} < /var/${directory}${filename}" && echo 'Done'`)
    this.log(chalk.green('Restore complete!'), chalk.grey(filename))
  }
}

RestoreCommand.description = `restore database of Wordpress site`

RestoreCommand.args = [
  { name: 'database', description: '[default: defined in site wp-config.php] database name to restore to' }
]

RestoreCommand.flags = {
  source: flags.string({char: 's', description: 'relative path to sql file directory'}),
}

module.exports = RestoreCommand
