const {Command, flags, args} = require('@oclif/command')
const intro = require('../partials/intro')
const fs = require('fs-extra')
const path = require('path')
const chalk = require('chalk')
const shell = require('shelljs')
const axios = require('axios')
const inquirer = require('inquirer')

class NewCommand extends Command {
  async run() {
    const currentdir = process.cwd()
    const {args, flags} = this.parse(NewCommand)

    let hostname = args.hostname
    let domain = args.hostname + '.test'
    let name = flags.name

    this.log(intro)

    // Check if current directory is a valid Vagrant project
    let vagrant_directory = fs.existsSync(path.join(currentdir, 'Vagrantfile'))
    if(vagrant_directory) this.error('A Vagrant project already exists in this directory.')

    let directory_exists = fs.existsSync(path.join(currentdir, hostname))
    if(directory_exists && flags.force) await fs.remove(path.join(currentdir, hostname))
    if(directory_exists && !flags.force) return this.error(`A box already exists named ${hostname}`)

    this.log(chalk.green('✨  Generating new box:'), `${domain}`)

    this.log(chalk.gray('Connecting to Github'))
    shell.exec('ssh -T git@github.com')

    this.log(chalk.gray('Pulling latest master of', 'bowtie-vagrant'))
    shell.exec(`git clone -b new git@github.com:theinfiniteagency/bowtie-vagrant ${hostname}`)

    // Clone bowtie wordpress to www/domain.test    
    this.log(chalk.gray('Pulling latest master of', 'bowtie-wordpress'))
    shell.exec(`git clone git@github.com:theinfiniteagency/bowtie-wordpress ${hostname}/www/${domain}`)

    this.log(chalk.gray('Pulling latest master of', 'Bowtie wordpress theme'))
    shell.exec(`git clone git@github.com:theinfiniteagency/Bowtie ${hostname}/www/${domain}/wp-content/themes/bowtie`)

    this.log(chalk.gray('Copying site provision script to www'))
    await fs.copy(path.join(__dirname, '../conf/provision.sh'), path.join(currentdir, `${hostname}/www/${domain}/provision/provision.sh`))
    shell.sed('-i',/{{SITE_DOMAIN}}/g, domain, path.join(currentdir, `${hostname}/www/${domain}/provision/provision.sh`))
    shell.sed('-i',/{{SITE_DB}}/g, hostname, path.join(currentdir, `${hostname}/www/${domain}/provision/provision.sh`))

    this.log(chalk.gray('Copying site nginx conf to www'))
    await fs.copy(path.join(__dirname, '../conf/nginx.conf'), path.join(currentdir, `${hostname}/www/${domain}/provision/nginx.conf`))
    shell.sed('-i',/{{SITE_DOMAIN}}/g, domain, path.join(currentdir, `${hostname}/www/${domain}/provision/nginx.conf`))
    shell.sed('-i',/{{SITE_DB}}/g, hostname, path.join(currentdir, `${hostname}/www/${domain}/provision/nginx.conf`))

    // Update sql file with new domain and site name

    if(fs.existsSync(path.join(currentdir, `${hostname}/www/${domain}/wp-content/themes/bowtie/webpack.config.js`))) {
      this.log(chalk.gray('Updating Webpack configuration'))
      shell.sed('-i','bowtie-vagrant', hostname, `${hostname}/www/${domain}/wp-content/themes/bowtie/webpack.config.js`)
    }

    if(fs.existsSync(path.join(currentdir, `${hostname}/www/${domain}/wp-content/themes/bowtie/gulpfile.js`))) {
      this.log(chalk.gray('Updating Gulp configuration'))
      shell.sed('-i','bowtie-vagrant', hostname, `${hostname}/www/${domain}/wp-content/themes/bowtie/gulpfile.js`)
    }

    this.log(chalk.gray('Updating Wordpress configuration'))

    // Update wp-config with new db name
    shell.sed('-i', `'DB_NAME', 'wordpress'`, `'DB_NAME', '${hostname}'`, `${hostname}/www/${domain}/wp-config.php`)
    this.log('Updated site db:', hostname)

    shell.sed('-i',/bowtie-vagrant/g, hostname, `${hostname}/www/${domain}/bowtie-wordpress.sql`)
    shell.sed('-i',/bowtie-vagrant/g, hostname, `${hostname}/Vagrantfile`)
    this.log('Updated site domain:', `https://${domain}`)
    
    if(name) {
      shell.sed('-i','New Site', name, `www/${domain}/bowtie-wordpress.sql`)
      this.log('Updated site name:', name)
    }

    this.log(chalk.gray('Adding hostname to Vagrantfile'))
    shell.sed('-i', `"#{config.vm.hostname}.test"`, `"#{config.vm.hostname}.test","${domain}"`, `${hostname}/Vagrantfile`)

    // add db to box, and import sql
    this.log(chalk.green('Starting Vagrant box and provisioning'))
    shell.cd(hostname)
    shell.exec(`vagrant up --no-provision`)

    // add db to box, and import sql
    this.log(chalk.gray('Starting Wordpress provision'))
    shell.exec(`vagrant ssh -c "/var/www/${domain}/provision/provision.sh"`)

    this.log(chalk.gray('Cleaning up'))
    fs.removeSync(path.join(currentdir, `www/${domain}/provision`))
    fs.removeSync(path.join(currentdir, `www/${domain}/bowtie-wordress.sql`))
    

    this.log(chalk.green(`🎉  Now serving ${name || 'Wordpress'} on ${domain}`))
    this.log(chalk.green("🔒  HTTPS is available"))
    this.log(chalk.green(`🗄   Go to ${domain}:8080 to manage the DB`))
    
  }
}

NewCommand.description = `create a new Vagrant box`

NewCommand.args = [
  { name: 'action', required: true, default: 'new', description: 'action to perform', options: ['new'] },
  { name: 'hostname', required: true, default: 'bowtie-vagrant', description: 'hostname of site' }
]

NewCommand.flags = {
  name: flags.string({char: 'n', description: 'set Wordpress site name'}),
  force: flags.boolean({char: 'f', description: 'overwrite existing site with hostname'}),
}

module.exports = NewCommand
