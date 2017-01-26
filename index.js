#!/usr/bin/env node
var co = require('co');
var prompt = require('co-prompt');
var program = require('commander');
var shell = require('shelljs');
var path = require('path');

//console.log('\033[32m \033[0m');

var intro =
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
'  IIIIIIIIIIIIIIIIIIIIIIIIII                        IIIIIIIIIIIIIIIIIIIIIIIIII   \n' +
'\n' +
'                       Bowtie. A Vagrant Box for Wordpress                      \n' +
'                             by The Infinite Agency                             \033[0m\n' +
'\n';

program.version('0.0.1')
  .option('-p, --provision','start the box with provision flag');

program.command('new <name>')
  .description('initialize a new vagrant box')
  .action(function(startName) {
    co(function *() {
      console.log(startName);
      console.log(intro);
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

      console.log('\033[32mPulling latest master of bowtie-wordpress\033[0m');
      shell.exec('git clone git@github.com:theinfiniteagency/bowtie-wordpress www');

      console.log('\033[32mPulling latest master of Bowtie wordpress theme\033[0m');
      shell.exec('git clone git@github.com:theinfiniteagency/Bowtie www/wp-content/themes/bowtie');

      console.log('\033[32mUpdating Wordpress and Vagrant URL to '+name+'.dev\033[0m');
      shell.sed('-i','bowtie-vagrant', name, 'Vagrantfile');
      shell.sed('-i','bowtie-vagrant', name, 'www/wp-content/themes/bowtie/gulpfile.js');
      // shell.exec("sed -i '' \"/config.vm.hostname = /s/'\([^']*\)'/'bowtie-vagrant'/\" Vagrantfile")

      console.log('\033[35mDatabase will be imported after the box has booted.\033[0m');
      console.log('\033[32mStarting Box\033[0m');
      shell.exec('vagrant up --provision');

      process.exit(1);
    });
  });

program.command('up')
  .option('-p','--provision','start the box with provision flag')
  .description('start the vagrant box')
  .action(function() {
    if(program.provision) {
      shell.exec('vagrant up --provision')
    } else {
      shell.exec('vagrant up');
    }
  });

program.command('halt')
  .description('stop the vagrant box')
  .action(function() {
    shell.exec('vagrant halt');
  });

program.parse(process.argv);
