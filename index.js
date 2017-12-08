#!/usr/bin/env node
const co = require('co')
const prompt = require('co-prompt')
const program = require('commander')
const shell = require('shelljs')
const path = require('path')
const fs = require('fs')
const request = require('request')

const Project = require('./lib/Project')
const Config = require('./lib/Config')
const config = new Config({
  configName: 'bowtie',
  defaults: {
    deployBot: ''
  }
})

const project = new Project({
  defaults: {
    name: 'New Bowtie Project',
    slug: 'bowtie-vagrant',
  }
})

const intro =
'\n' +
//'\033[31mWARNING: This will destroy the current WP site in this box if one exists.\033[0m\n' +
'\n' +
'\033[32m  IIIIIIIIIIIIIIIIIIIIIIIIII                        IIIIIIIIIIIIIIIIIIIIIIIIII   \n' +
'IIIIIIIIIIIIIIIIIIIIIIIIIIIIII                    IIIIIIIIIIIIIIIIIIIIIIIIIIIIII \n' +
'IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII                IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII \n' +
'IIIIII                  IIIIIIIII            IIIIIIIII                    IIIIII \n' +
'IIIIII                     IIIIIIIII        IIIIIIIII                     IIIIII \n' +
'IIIIII                       IIIIIIIII    IIIIIIIII                       IIIIII \n' +
'IIIIII                         IIIIIIIIIIIIIIIIII                         IIIIII \n' +
'IIIIII                           IIIIIIIIIIIIII                           IIIIII \n' +
'IIIIII                             IIIIIIIIII                             IIIIII \n' +
'IIIIII                           IIIIIIIIIIIIII                           IIIIII \n' +
'IIIIII                         IIIIIIIIIIIIIIIIII                         IIIIII \n' +
'IIIIII                       IIIIIIIII    IIIIIIIII                       IIIIII \n' +
'IIIIII                     IIIIIIIII        IIIIIIIII                     IIIIII \n' +
'IIIIII                   IIIIIIIII            IIIIIIIII                   IIIIII \n' +
'IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII                IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII \n' +
'IIIIIIIIIIIIIIIIIIIIIIIIIIIIII                    IIIIIIIIIIIIIIIIIIIIIIIIIIIIII \n' +
'  IIIIIIIIIIIIIIIIIIIIIIIIII                        IIIIIIIIIIIIIIIIIIIIIIIIII   \n'
var intro_desc = '\n' +
'                       Bowtie. A Vagrant Box for Wordpress                      \n' +
'                             by The Infinite Agency                             \033[0m\n' +
'\n'

program.version('0.1.0')
  .option('-p, --provision','start the box and import bowtie-wordpress.sql')
  .option('-i, --install', 'install npm packages in project')
  .option('-d, --destroy','destroy the box')

program.command('new [name]')
  .option('-i, --install')
  .description('create a new vagrant box')
  .action(function(startName) {
    co(function *() {
      console.log(intro, intro_desc)
      var dir = process.cwd()
      var dirName = path.basename(dir)
      if(startName == '') {
        var name = yield prompt('\033[32mWhat would you like to name this site?\033[0m\n')
      } else {
        var name = startName
      }

      // ('+dirName+')\033[0m Press return to use current name.

      if(name == '') {
        name = dirName
      }


      if(!shell.test('-d', name)) {
        console.log('\033[32m✨  Generating new project: \033[0m' + name)
        shell.mkdir('-p', name)
      } else {
        console.error('\033[31mThat folder already exists. \033[0m')
        process.exit(1)
      }

      console.log('\033[32mConnecting to Github\033[0m')
      shell.exec('ssh -T git@github.com')

      console.log('\033[32mPulling latest master of bowtie-vagrant\033[0m')
      shell.exec('git clone git@github.com:theinfiniteagency/bowtie-vagrant '+ name)

      shell.cd(name)

      project.setPath(name)
      project.set('slug', name)

      console.log('\033[32mPulling latest master of bowtie-wordpress\033[0m')
      shell.exec('git clone git@github.com:theinfiniteagency/bowtie-wordpress www')

      console.log('\033[32mPulling latest master of Bowtie wordpress theme\033[0m')
      shell.exec('git clone git@github.com:theinfiniteagency/Bowtie www/wp-content/themes/bowtie')

      console.log('\033[32mUpdating Wordpress and Vagrant URL to '+name+'.localhost\033[0m')
      shell.sed('-i','bowtie-vagrant', name, 'Vagrantfile')

      if(shell.test('-f', 'www/wp-content/themes/bowtie/webpack.config.js')) {
        shell.sed('-i','bowtie-vagrant', name, 'www/wp-content/themes/bowtie/webpack.config.js')
      }

      if(shell.test('-f', 'www/wp-content/themes/bowtie/gulpfile.js')) {
        shell.sed('-i','bowtie-vagrant', name, 'www/wp-content/themes/bowtie/gulpfile.js')
      }

      shell.sed('-i',/bowtie-vagrant/g, name, 'www/bowtie-wordpress.sql')
      // shell.exec("sed -i '' \"/config.vm.hostname = /s/'\([^']*\)'/'bowtie-vagrant'/\" Vagrantfile")

      console.log('\033[35mDatabase will be imported after the box has booted.\033[0m')
      console.log('\033[32mStarting Box\033[0m')
      shell.exec('vagrant up --provision')

      if(program.install) {
        shell.cd('www/wp-content/themes/bowtie')
        console.log('\033[32mInstalling packages\033[0m')
        shell.exec('npm install')
      }

      console.log('\033[32m🎉  Done! \033[0m')
      process.exit(1)
    })
  })

program.command('static [name]')
  .option('-i, --install')
  .description('create a new static site')
  .action(function(startName) {
    co(function *() {
      var dir = process.cwd()
      var dirName = path.basename(dir)
      if(startName == '') {
        var name = yield prompt('\033[32mWhat would you like to name this site?\033[0m\n')
      } else {
        var name = startName
      }

      if(name == '') {
        name = dirName
      }


      if(!shell.test('-d', name)) {
        console.log('\033[32m✨  Generating new static project: \033[0m' + name)
        shell.mkdir('-p', name)
      } else {
        console.error('\033[31mThat folder already exists. \033[0m')
        process.exit(1)
      }

      console.log('\033[32mConnecting to Github\033[0m')
      shell.exec('ssh -T git@github.com')

      console.log('\033[32mPulling latest master of bowtie-static\033[0m')
      shell.exec('git clone git@github.com:theinfiniteagency/bowtie-static '+ name)

      if(program.install) {
        console.log('\033[32mInstalling packages\033[0m')
        shell.cd(name)
        shell.exec('npm install')
      }

      console.log('\033[32m🎉  Done! \033[0m')
    })
  })

program.command('up')
  .option('-p, --provision','')
  .description('start the vagrant box')
  .action(function() {
    if(program.provision) {
      shell.exec('vagrant up --provision')
    } else {
      shell.exec('vagrant up')
    }

    console.log('🎉  \033[32mNow serving Wordpress on '+project.get('slug')+'.localhost\033[0m')
    console.log('🗄  Go to :8080 to manage the DB')
  })

program.command('halt')
  .description('stop the vagrant box')
  .action(function() {
    shell.exec('vagrant halt')
  })


program.command('backup')
  .description('backup the db [use -d to destroy]')
  .option('-d, --destroy','')
  .action(function() {
    co(function *() {
      if(!shell.test('-f', 'Vagrantfile')) {
        console.log('\033[31mCannot find a Bowtie Vagrantfile\033[0m')
        process.exit(1)
      } else if (!shell.test('-f', '.vagrant/machines/default/virtualbox/id')) {
        console.log('\033[31mCannot find a Bowtie box\033[0m')
        process.exit(1)
      }

      if(shell.test('-f', 'www/bowtie-wordpress.sql')) {
        var ok = yield prompt.confirm('\033[33mbowtie-wordpress.sql already exists, would you like to overwrite?\033[0m ')
        if(!ok) {
          console.log('Cancelled')
          process.exit(1)
        }
      }

      shell.exec("vagrant ssh -c 'mysqldump --login-path=local wordpress > /var/www/bowtie-wordpress.sql'")
      console.log('\033[32m🎉  Backup complete! > www/bowtie-wordpress.sql\033[0m') //\nUse \'bowtie destroy\' to destroy the box, \nwhen you need the box again, run \'bowtie up\'

      if(program.destroy) {
        console.log('\033[33mDestroying the box\033[0m')
        shell.exec("vagrant destroy -f")
        console.log('\033[32m🎉  Box destroyed!\033[0m Use \'bowtie restore\' to restore the site.')
      }

      process.exit(1)
    })
  })

program.command('update')
  .description('update the cli and vagrant box')
  .action(function() {
    console.log('\033[32mUpdating vagrant box\033[0m')
    shell.exec('vagrant box update --box=theinfiniteagency/bowtie')
    console.log('\033[32mUpdating Bowtie CLI\033[0m')
    shell.exec('npm install -g bowtie-cli')

    console.log('\033[33mChecking for WP-CLI\033[0m')
    if(shell.test('-e', '/usr/local/bin/wp')) {
      console.log('\033[32mUpdating WP-CLI\033[0m')
      shell.exec('wp cli update')
    }

    console.log('🎉  \033[32mBowtie updated!\033[0m')
    process.exit(1)
  })

program.command('wp-cli')
  .description('install wp-cli')
  .action(function() {
    console.log('Installing WP-CLI')
    shell.cd('~/')
    shell.exec('curl -O https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar')
    shell.chmod('+x', 'wp-cli.phar')
    shell.mv('-f', 'wp-cli.phar', '/usr/local/bin/wp')
    if(!shell.error()) {
      shell.exec('wp cli version')
      console.log('\033[32m🎉  WP-CLI Installed \033[0m')
    }

  })

program.parse(process.argv)
