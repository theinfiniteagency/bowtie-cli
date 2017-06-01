#!/usr/bin/env node
const co = require('co');
const prompt = require('co-prompt');
const program = require('commander');
const shell = require('shelljs');
const path = require('path');
const fs = require('fs');
const request = require('request');

const Project = require('./lib/Project');
const Config = require('./lib/Config');
const config = new Config({
  configName: 'bowtie',
  defaults: {
    deployBot: ''
  }
});

const project = new Project({
  defaults: {
    name: 'New Bowtie Project',
    slug: 'bowtie-vagrant',
    repository_id: '',
    environments: {
      default: 'production',
      staging: {
        env_id: '',
        url: '',
        username: '',
        password: ''
      },
      production: {
        env_id: '',
        url: '',
        username: '',
        password: ''
      }
    }
  }
});

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
'  IIIIIIIIIIIIIIIIIIIIIIIIII                        IIIIIIIIIIIIIIIIIIIIIIIIII   \n';
var intro_desc = '\n' +
'                       Bowtie. A Vagrant Box for Wordpress                      \n' +
'                             by The Infinite Agency                             \033[0m\n' +
'\n';

program.version('0.0.4')
  .option('-p, --provision','start the box and import bowtie-wordpress.sql')
  .option('-i, --install', 'install npm packages in project')
  .option('-d, --destroy','destroy the box');

program.command('new [name]')
  .option('-i, --install')
  .description('create a new vagrant box')
  .action(function(startName) {
    co(function *() {
      console.log(intro, intro_desc);
      var dir = process.cwd();
      var dirName = path.basename(dir);
      if(startName == '') {
        var name = yield prompt('\033[32mWhat would you like to name this site?\033[0m\n');
      } else {
        var name = startName;
      }

      // ('+dirName+')\033[0m Press return to use current name.

      if(name == '') {
        name = dirName;
      }


      if(!shell.test('-d', name)) {
        console.log('\033[32m✨  Generating new project: \033[0m' + name);
        shell.mkdir('-p', name);
      } else {
        console.error('\033[31mThat folder already exists. \033[0m')
        process.exit(1);
      }

      console.log('\033[32mConnecting to Github\033[0m');
      shell.exec('ssh -T git@github.com');

      console.log('\033[32mPulling latest master of bowtie-vagrant\033[0m');
      shell.exec('git clone git@github.com:theinfiniteagency/bowtie-vagrant '+ name);

      shell.cd(name);

      project.setPath(name);
      project.set('slug', name);

      console.log('\033[32mPulling latest master of bowtie-wordpress\033[0m');
      shell.exec('git clone git@github.com:theinfiniteagency/bowtie-wordpress www');

      console.log('\033[32mPulling latest master of Bowtie wordpress theme\033[0m');
      shell.exec('git clone git@github.com:theinfiniteagency/Bowtie www/wp-content/themes/bowtie');

      console.log('\033[32mUpdating Wordpress and Vagrant URL to '+name+'.dev\033[0m');
      shell.sed('-i','bowtie-vagrant', name, 'Vagrantfile');
      shell.sed('-i','bowtie-vagrant', name, 'www/wp-content/themes/bowtie/gulpfile.js');
      shell.sed('-i',/bowtie-vagrant/g, name, 'www/bowtie-wordpress.sql');
      // shell.exec("sed -i '' \"/config.vm.hostname = /s/'\([^']*\)'/'bowtie-vagrant'/\" Vagrantfile")

      console.log('\033[35mDatabase will be imported after the box has booted.\033[0m');
      console.log('\033[32mStarting Box\033[0m');
      shell.exec('vagrant up --provision');

      if(program.install) {
        shell.cd('www/wp-content/themes/bowtie');
        console.log('\033[32mInstalling packages\033[0m');
        shell.exec('npm install');
      }

      console.log('\033[32m🎉  Done! \033[0m');
      process.exit(1);
    });
  });

program.command('static [name]')
  .option('-i, --install')
  .description('create a new static site')
  .action(function(startName) {
    co(function *() {
      var dir = process.cwd();
      var dirName = path.basename(dir);
      if(startName == '') {
        var name = yield prompt('\033[32mWhat would you like to name this site?\033[0m\n');
      } else {
        var name = startName;
      }

      if(name == '') {
        name = dirName;
      }


      if(!shell.test('-d', name)) {
        console.log('\033[32m✨  Generating new static project: \033[0m' + name);
        shell.mkdir('-p', name);
      } else {
        console.error('\033[31mThat folder already exists. \033[0m')
        process.exit(1);
      }

      console.log('\033[32mConnecting to Github\033[0m');
      shell.exec('ssh -T git@github.com');

      console.log('\033[32mPulling latest master of bowtie-static\033[0m');
      shell.exec('git clone git@github.com:theinfiniteagency/bowtie-static '+ name);

      if(program.install) {
        console.log('\033[32mInstalling packages\033[0m');
        shell.cd(name);
        shell.exec('npm install');
      }

      console.log('\033[32m🎉  Done! \033[0m');
    });
  });

program.command('up')
  .option('-p, --provision','')
  .description('start the vagrant box')
  .action(function() {
    if(program.provision) {
      shell.exec('vagrant up --provision')
    } else {
      shell.exec('vagrant up');
    }

    console.log('🎉  \033[32mNow serving Wordpress on '+project.get('slug')+'.dev\033[0m');
    console.log('🗄  Go to :8080 to manage the DB');
  });

program.command('halt')
  .description('stop the vagrant box')
  .action(function() {
    shell.exec('vagrant halt');
  });

  program.command('deploy [action]')
    .description('deploy current project to server')
    .action(function(action) {
      const deployBotApiKey = config.get('deployBot');
      let ENV, env_id = undefined;

      co(function *() {
        // Check for API Key
        if(!deployBotApiKey) {
          let newKey = yield prompt('\033[33mPlease enter your DeployBot API Key to continue: \033[0m');
          if(newKey.length > 0) {
            config.set('deployBot', newKey);
            console.log(' \033[32mDeployBot API key saved.\033[0m');
          } else {
            console.log('\033[31mFailed to save key. Try again.\033[0m');
            process.exit(1);
          }
        }

        // No action, so deploy current if available
        if(!action) {
          if(isBowtieProject()) {

            let repository_id = project.get('repository_id');
            if(!repository_id) {
              console.log('\033[31mA DeployBot Repository ID is not set in bowtie.json\033[0m');
              process.exit(1);
            }

            let defaultEnv = project.get('environments.default');
            // Check for Default deployment environment
            if(!defaultEnv) {
              console.log('\033[31mA default environment could not be found in configuration. Update bowtie.json or use `bowtie deploy ENV`\033[0m');
              process.exit(1);
            }

            ENV = defaultEnv;

            // Perform deployment on default
            env_id = project.get('environments.'+defaultEnv+'.env_id');
            if(env_id == undefined) {
              console.log('\033[31mAn environment ID could not be found for '+defaultEnv+'. Update bowtie.json or use `bowtie deploy ENV`\033[0m');
              process.exit(1);
            }

          } else {
            console.log('\033[31mYou are not in a Bowtie project directory.\033[0m');
            process.exit(1);
          }
        }

        // Actions
        if(action == 'init') {
          let dir = process.cwd();
          let dirName = path.basename(dir);
          project.set('slug', dirName);
          console.log('🎉  \033[32mBowtie project has been initalized in current directory.\033[0m');
          process.exit(1);

        } else if(action == 'list') {
          // Action to list repositories
          console.log('🗄  Listing Repositories');
          let listing = yield new Promise(function(resolve, reject) {
            request({
              url: 'https://the-infinite-agency.deploybot.com/api/v1/repositories',
              headers: {
                'X-Api-Token': deployBotApiKey
              }
            }, function(err, res, body) {
              return resolve(body);
            });
          });

          let repositories = JSON.parse(listing).entries;
          for(let e=0;e<repositories.length;e++) {
            console.log('\033[32m'+repositories[e].id+':\033[0m '+repositories[e].title);
          }

          process.exit(1);
        } else if(action == 'env') {
          // Action to list environments for repository
          if(isBowtieProject()) {
            let repository_id = project.get('repository_id');
            if(!repository_id) {
              console.log('\033[31mA DeployBot Repository ID is not set in Bowtie.json\033[0m');
              process.exit(1);
            }

            let listing = yield new Promise(function(resolve, reject) {
              request({
                url: 'https://the-infinite-agency.deploybot.com/api/v1/environments/?repository_id='+repository_id,
                headers: {
                  'X-Api-Token': deployBotApiKey
                }
              }, function(err, res, body) {
                return resolve(body);
              });
            });

            listing = JSON.parse(listing);
            console.log('🗄  Listing Environments for this Project');
            for(let e=0;e<listing.entries.length;e++) {
              console.log('\033[32m'+listing.entries[e].id+':\033[0m '+listing.entries[e].name);
            }

          } else {
            console.log('\033[31mYou are not in a Bowtie project directory.\033[0m');
            process.exit(1);
          }

          process.exit(1);
        } else if(action) {

          // Perform deployment on provided environment
          ENV = action;
          env_id = project.get('environments.'+action+'.env_id');
          if(env_id == undefined) {
            console.log('\033[31mAn environment ID could not be found for '+action+'. Update bowtie.json or use `bowtie deploy ENV`\033[0m');
            process.exit(1);
          }
        }

        // Convert ENV to a number
        env_id = Number.parseInt(env_id);

        let checkEnvironment = yield new Promise(function(resolve, reject) {
          request({
            url: 'https://the-infinite-agency.deploybot.com/api/v1/environments/'+env_id,
            headers: {
              'X-Api-Token': deployBotApiKey
            }
          }, function(err, res, body) {
            return resolve(body);
          });
        });

        checkEnvironment = JSON.parse(checkEnvironment);

        if(typeof checkEnvironment.message == 'string') {
          console.log('\033[31m'+env_id+' is not a valid Environment ID for '+ENV+'.\033[0m');
          process.exit(1);
        }

        let confirm = yield prompt.confirm('\033[33mAre you sure you would like to deploy to '+checkEnvironment.name+'? (y/n) \033[0m');

        if(confirm) {
          let deploy = yield new Promise(function(resolve, reject) {
            request({
              method: 'POST',
              url: 'https://the-infinite-agency.deploybot.com/api/v1/deployments',
              body: JSON.stringify({
                environment_id: checkEnvironment.id
              }),
              headers: {
                'X-Api-Token': deployBotApiKey
              }
            }, function(err, res, body) {
              return resolve(body);
            });
          });

          let deployment = JSON.parse(deploy);

          if(deployment.id) {
            console.log(deployment);
            console.log('\033[32m✅  Deployment has been queued.\033[0m');
          } else {
            console.log('\033[31mDeployment failed.\033[0m');
          }

          process.exit(1);

        } else {
          process.exit(1);
        }


      }).catch(function(err) {
        console.log(err);
        process.exit(1);
      });
    });

program.command('config <setting> [value]')
  .description('set a config setting for current project')
  .action(function(setting, value) {
    if(isBowtieProject()) {
      let theSetting = project.get(setting);
      if(!theSetting && !value) {
        console.log('\033[31mCould not find setting '+setting+'. Enter a value to set it.\033[0m');
        process.exit(1);
      }

      if(!value) {
        console.log(setting+': '+ theSetting);
        process.exit(1);
      }

      project.set(setting, value);
      console.log('✅  '+setting+': '+value);


    } else {
      console.log('\033[31mYou are not in a Bowtie project directory.\033[0m');
      process.exit(1);
    }
  })

program.command('backup')
  .description('backup the db [use -d to destroy]')
  .option('-d, --destroy','')
  .action(function() {
    co(function *() {
      if(!shell.test('-f', 'Vagrantfile')) {
        console.log('\033[31mCannot find a Bowtie Vagrantfile\033[0m');
        process.exit(1);
      } else if (!shell.test('-f', '.vagrant/machines/default/virtualbox/id')) {
        console.log('\033[31mCannot find a Bowtie box\033[0m');
        process.exit(1);
      }

      if(shell.test('-f', 'www/bowtie-wordpress.sql')) {
        var ok = yield prompt.confirm('\033[33mbowtie-wordpress.sql already exists, would you like to overwrite?\033[0m ');
        if(!ok) {
          console.log('Cancelled');
          process.exit(1);
        }
      }

      shell.exec("vagrant ssh -c 'mysqldump --login-path=local wordpress > /var/www/bowtie-wordpress.sql'");
      console.log('\033[32m🎉  Backup complete! > www/bowtie-wordpress.sql\033[0m'); //\nUse \'bowtie destroy\' to destroy the box, \nwhen you need the box again, run \'bowtie up\'

      if(program.destroy) {
        console.log('\033[33mDestroying the box\033[0m');
        shell.exec("vagrant destroy -f");
        console.log('\033[32m🎉  Box destroyed!\033[0m Use \'bowtie restore\' to restore the site.');
      }

      process.exit(1);
    });
  });

  program.command('destroy')
    .description('destroy the box')
    .action(function() {
      co(function *() {
        if(!shell.test('-f', 'Vagrantfile')) {
          console.log('\033[31mCannot find a Bowtie Vagrantfile\033[0m');
          process.exit(1);
        } else if (!shell.test('-f', '.vagrant/machines/default/virtualbox/id')) {
          console.log('\033[31mCannot find a Bowtie box to destroy\033[0m');
          process.exit(1);
        }

        if(program.destroy) {
          console.log('\033[33mDestroying the box\033[0m');
          shell.exec("vagrant destroy -f");
          console.log('\033[32m🎉  Box destroyed!\033[0m');
        }

        process.exit(1);
      });
    });

// program.command('options')
//   .description('set default options')
//   .action(function() {
//     if(shell.test('-f', 'config.bowtie')) {
//
//     }
//
//     var defaultOptions = {
//       name: 'bowtie-vagrant',
//       ip: '192.168.56.28',
//       production: '',
//     };
//
//     var dir = process.cwd();
//     console.log(JSON.stringify(defaultOptions));
//   });

program.command('update')
  .description('update the cli and vagrant box')
  .action(function() {
    console.log('\033[32mUpdating vagrant box\033[0m');
    shell.exec('vagrant box update --box=theinfiniteagency/bowtie');
    console.log('\033[32mUpdating Bowtie CLI\033[0m');
    shell.exec('npm update -g bowtie-cli');

    console.log('\033[33mChecking for WP-CLI\033[0m');
    if(shell.test('-e', '/usr/local/bin/wp')) {
      console.log('\033[32mUpdating WP-CLI\033[0m');
      shell.exec('wp cli update');
    }

    console.log('🎉  \033[32mBowtie updated!\033[0m');
    process.exit(1);
  });

program.command('wp-cli')
  .description('install wp-cli')
  .action(function() {
    console.log('Installing WP-CLI')
    shell.cd('~/')
    shell.exec('curl -O https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar');
    shell.chmod('+x', 'wp-cli.phar');
    shell.mv('-f', 'wp-cli.phar', '/usr/local/bin/wp');
    if(!shell.error()) {
      shell.exec('wp cli version');
      console.log('\033[32m🎉  WP-CLI Installed \033[0m');
    }

  });

program.parse(process.argv);

function isBowtieProject(checkPath = process.cwd()) {
  shell.cd(checkPath);
  if(shell.test('-f', 'bowtie.json')) {
    return true;
  }
  return false;
}
