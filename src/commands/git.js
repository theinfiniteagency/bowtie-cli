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

class GitCommand extends Command {
  async run() {
    const currentdir = process.cwd()
    const {args, flags} = this.parse(GitCommand)

    let user_config = await this.getUserConfig()
    let is_repo = await fs.exists(path.join(currentdir, '.git'))

    if(!user_config.github_username) {
      let prompt = await inquirer.prompt([
        {
          type: 'input',
          name: 'github_username',
          message: 'Please enter your GitHub Username:'
        }
      ])

      user_config = await this.updateUserConfig({ github_username: prompt.github_username })
    }

    switch(args.action) {
      case 'info':
        
        if(!is_repo) this.error('This folder does not have a valid repository')

        this.log(chalk.green('Origin'))
        shell.exec('git remote show origin')
        this.log(chalk.green('Current Branch'))
        shell.exec('git branch')
        break

      case 'create':
        let default_name = this.getDirname(currentdir)

        if(is_repo) {
           let prompt_to_continue = await inquirer.prompt([
             {
               type: 'confirm',
               name: 'continue',
               message: 'A local repo already exists, do you want to overwrite?'
             }
           ])

           if(!prompt_to_continue.continue) {
             this.exit()
           } else {
             await fs.remove(path.join(currentdir, '.git'))
           }
        }

        let prompt = await inquirer.prompt([
          {
            type: 'input',
            name: 'repo_name',
            message: `What do you want to name this repo?`,
            default: default_name
          },
          {
            type: 'input',
            name: 'repo_description',
            message: `Enter a description:`
          }
        ])

        const github_password = await this.getGithubPassword(user_config.github_username)


        try {
          const repo = await axios.post('https://api.github.com/orgs/theinfiniteagency/repos', {
            name: prompt.repo_name,
            description: prompt.repo_description,
            private: true
          }, {
            auth: {
              username: user_config.github_username,
              password: github_password
            }
          })

          this.log(chalk.green('Created repository:'), repo.data.name, `(${repo.data.html_url})`)
          this.log(chalk.grey('Initializing local repository'))
          shell.exec('git init')
          shell.exec(`git remote add origin ${repo.data.ssh_url}`)


        } catch(err) {
          err.response.data.errors.forEach(error => {
            this.log(chalk.grey(error.message))
          })
          this.error(err.response.data.message)
        }
        
        break
    }
    
  }

  async getGithubPassword(account) {
    return new Promise((resolve, reject) => {
      keychain.getPassword({ account, service: 'github.com', type: 'internet' }, (err, password) => {
        if(err) return reject(err)
        return resolve(password)
      })
    })
  }
}

GitCommand.description = `manage this project on Github`

GitCommand.args = [
  { name: 'action', required: true, default: 'info', description: 'action to perform', options: ['info', 'create'] }
]

GitCommand.flags = {
  // name: flags.string({char: 'n', description: 'site name'}),
  // force: flags.boolean({char: 'f', description: 'overwrite existing site'}),
}

module.exports = GitCommand
