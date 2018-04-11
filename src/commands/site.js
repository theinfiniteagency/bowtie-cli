const {Command, flags, args} = require('@oclif/command')
const intro = require('../partials/intro')
const fs = require('fs-extra')
const path = require('path')
const chalk = require('chalk')
const shell = require('shelljs')
const axios = require('axios')
const inquirer = require('inquirer')

class SiteCommand extends Command {
  async run() {
    const currentdir = process.cwd()
    const {args, flags} = this.parse(SiteCommand)

    let hostname = args.hostname
    let domain = args.hostname + '.test'
    let name = flags.name

    this.log(intro)

    // Check if current directory is a valid Vagrant project
    let valid_directory = fs.existsSync(path.join(currentdir, 'Vagrantfile'))
    if(!valid_directory) this.error('Could not find a valid Vagrantfile')
   
    // Get IP of Vagrant Box
    let vfile = fs.readFileSync(path.join(currentdir, 'Vagrantfile'), 'utf8')
    let ip = vfile.match(/ip: \'([\d.]{10,14})\'/)[1]
    let box_hostname = vfile.match(/hostname\s=\s\'(.+)\'/)[1]
    let box_domain = box_hostname + '.test'

    // Output dir of vagrant box
    this.log(chalk.gray('Current project:'), currentdir)

    this.log(chalk.green('✨  Generating new site:'), `${domain}`)

    let www_exists = await fs.exists(path.join(currentdir, `www`))
    let site_www_exists = await fs.exists(path.join(currentdir, `www/${domain}`))

    // If wordpress is in www, create a new domain folder for it and update nginx
    let wordpress_in_root = await fs.exists(path.join(currentdir, `www/wp-admin`))
    if(wordpress_in_root) {
      this.log(chalk.yellow('Vagrant Multisite preparation required'))
      let prompt_to_move = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'continue',
          message: `A wordpress installation is currently in www, would you like to move it into www/${box_domain} to continue?`
        }
      ])
      
      if(!prompt_to_move) return this.exit()

      // Move www contents in domain folder
      shell.exec(`mv www bowtie-temp`)
      shell.exec(`mkdir www && mv bowtie-temp www/${box_domain}`)

      // Creating nginx conf to replace default
      this.log(chalk.gray('Copying site nginx conf to www'))
      await fs.copy(path.join(__dirname, '../conf/nginx.conf'), path.join(currentdir, `www/${box_domain}/provision/nginx.conf`))
      await fs.copy(path.join(__dirname, '../conf/ssl-params.conf'), path.join(currentdir, `www/${box_domain}/provision/ssl-params.conf`))
      shell.sed('-i',/{{SITE_DOMAIN}}/g, `${box_domain}`, path.join(currentdir, `www/${box_domain}/provision/nginx.conf`))
      shell.sed('-i',/{{SITE_DB}}/g, 'wordpress', path.join(currentdir, `www/${box_domain}/provision/nginx.conf`))
      
      this.log(chalk.gray('Updating configuration in Vagrant box'))
      shell.exec(`vagrant up --no-provision && vagrant ssh -c "sudo mv /var/www/${box_domain}/provision/nginx.conf /etc/nginx/sites-available/${box_domain}"`)
      shell.exec(`vagrant ssh -c "test -e /etc/nginx/snippets/ssl-params.conf || sudo mv /var/www/${box_domain}/provision/ssl-params.conf /etc/nginx/snippets/ssl-params.conf"`)
      shell.exec(`vagrant ssh -c "test -e /etc/nginx/sites-available/default && sudo rm /etc/nginx/sites-available/default"`)
      shell.exec(`vagrant ssh -c "test -e /etc/nginx/sites-enabled/default && sudo rm /etc/nginx/sites-enabled/default"`)
      shell.exec(`vagrant ssh -c "test -e /etc/nginx/sites-enabled/${box_domain} || sudo ln -s /etc/nginx/sites-available/${box_domain} /etc/nginx/sites-enabled/${box_domain}"`)

      
      this.log(chalk.grey('Generating self-signed SSL certificate'))
      shell.exec(`vagrant ssh -c "sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048  -subj \"/CN=${box_domain}\" -keyout /etc/ssl/private/nginx-selfsigned-wordpress.key -out /etc/ssl/certs/nginx-selfsigned-wordpress.crt"`)
      
      this.log(chalk.grey('Generating strong Diffie-Hellman group parameters. This will take a while...'))
      shell.exec(`vagrant ssh -c "test -e /etc/ssl/certs/dhparam.pem || sudo openssl dhparam -out /etc/ssl/certs/dhparam.pem 2048 > /dev/null 2>&1"`)

      this.log(chalk.grey('Restarting NGINX'))
      shell.exec(`vagrant ssh -c "sudo systemctl restart nginx"`)

      this.log(chalk.grey('Cleaning up'))
      await fs.remove(path.join(currentdir, `www/${box_domain}/provision`))

      this.log(chalk.green('Completed multisite preparation.'))
    }

    if(site_www_exists && flags.force) await fs.remove(path.join(currentdir, `www/${domain}`))

    if(site_www_exists && !flags.force) return this.error(`${domain} site already exists in www`)

    // Create site directory in www
    await fs.ensureDir(path.join(currentdir, `www/${domain}`))
    this.log(chalk.gray('Created site directory'))

    // Clone bowtie wordpress to www/domain.test
    this.log(chalk.gray('Connecting to Github'))
    shell.exec('ssh -T git@github.com')

    this.log(chalk.gray('Pulling latest master of', 'bowtie-wordpress'))
    shell.exec(`git clone git@github.com:theinfiniteagency/bowtie-wordpress www/${domain}/.`)

    this.log(chalk.gray('Pulling latest master of', 'Bowtie wordpress theme'))
    shell.exec(`git clone git@github.com:theinfiniteagency/Bowtie www/${domain}/wp-content/themes/bowtie`)

    this.log(chalk.gray('Copying site provision script to www'))
    await fs.copy(path.join(__dirname, '../conf/provision.sh'), path.join(currentdir, `www/${domain}/provision/provision.sh`))
    shell.sed('-i',/{{SITE_DOMAIN}}/g, domain, path.join(currentdir, `www/${domain}/provision/provision.sh`))
    shell.sed('-i',/{{SITE_DB}}/g, hostname, path.join(currentdir, `www/${domain}/provision/provision.sh`))

    this.log(chalk.gray('Copying site nginx conf to www'))
    await fs.copy(path.join(__dirname, '../conf/nginx.conf'), path.join(currentdir, `www/${domain}/provision/nginx.conf`))
    shell.sed('-i',/{{SITE_DOMAIN}}/g, domain, path.join(currentdir, `www/${domain}/provision/nginx.conf`))
    shell.sed('-i',/{{SITE_DB}}/g, hostname, path.join(currentdir, `www/${domain}/provision/nginx.conf`))

    // Update sql file with new domain and site name

    if(fs.existsSync(path.join(currentdir, `www/${domain}/wp-content/themes/bowtie/webpack.config.js`))) {
      this.log(chalk.gray('Updating Webpack configuration'))
      shell.sed('-i','bowtie-vagrant', hostname, `www/${domain}/wp-content/themes/bowtie/webpack.config.js`)
    }

    if(fs.existsSync(path.join(currentdir, `www/${domain}/wp-content/themes/bowtie/gulpfile.js`))) {
      this.log(chalk.gray('Updating Gulp configuration'))
      shell.sed('-i','bowtie-vagrant', hostname, `www/${domain}/wp-content/themes/bowtie/gulpfile.js`)
    }

    this.log(chalk.gray('Updating Wordpress configuration'))

    // Update wp-config with new db name
    shell.sed('-i', `'DB_NAME', 'wordpress'`, `'DB_NAME', '${hostname}'`, `www/${domain}/wp-config.php`)
    this.log('Updated site db:', hostname)

    shell.sed('-i',/bowtie-vagrant/g, hostname, `www/${domain}/bowtie-wordpress.sql`)
    this.log('Updated site domain:', `https://${domain}`)
    
    if(name) {
      shell.sed('-i','New Site', name, `www/${domain}/bowtie-wordpress.sql`)
      this.log('Updated site name:', name)
    }

    // add db to box, and import sql
    this.log(chalk.gray('Starting Wordpress provision'))
    shell.exec(`vagrant ssh -c "/var/www/${domain}/provision/provision.sh"`)

    // Update salts
    // await axios.get('https://api.wordpress.org/secret-key/1.1/salt/').then(response => {
    //   console.log(response.data)
    // })

    // Update Vagrantfile hosts: ["#{config.vm.hostname}.test"]
    this.log(chalk.gray('Adding hostname to Vagrantfile and hosts'))
    shell.exec(`sudo sh -c 'echo "${ip} ${domain} # Added by Bowtie" >> /etc/hosts'`)
    shell.sed('-i', `"#{config.vm.hostname}.test"`, `"#{config.vm.hostname}.test","${domain}"`, `Vagrantfile`)

    this.log(chalk.gray('Cleaning up'))
    fs.removeSync(path.join(currentdir, `www/${domain}/provision`))
    fs.removeSync(path.join(currentdir, `www/${domain}/bowtie-wordress.sql`))


    this.log(chalk.green(`🎉  Now serving ${name || 'Wordpress'} on ${domain}`))
    this.log(chalk.green("🔒  HTTPS is available"))
    this.log(chalk.green(`🗄   Go to ${domain}:8080 to manage the DB`))
    
  }
}

SiteCommand.description = `create a new site in current Vagrant box`

SiteCommand.args = [
  { name: 'hostname', required: true, default: 'bowtie-vagrant', description: 'hostname of site, will add .test' }
]

SiteCommand.flags = {
  name: flags.string({char: 'n', description: 'set Wordpress site name'}),
  force: flags.boolean({char: 'f', description: 'overwrite existing site with domain'}),
}

module.exports = SiteCommand
