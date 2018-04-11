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
const Progress = require('cli-progress')

class DeployCommand extends Command {
  async run() {
    const currentdir = process.cwd()
    const {args, flags} = this.parse(DeployCommand)

    let current_repo = this.getCurrentRepo()
    let user_config = await this.getUserConfig()

    if(!user_config.buddy_token) {
      let prompt = await inquirer.prompt([
        {
          type: 'input',
          name: 'buddy_token',
          message: 'Please enter your Buddy access token (you can get one from https://app.buddy.works/api-tokens):'
        }
      ])

      user_config = await this.updateUserConfig({ buddy_token: prompt.buddy_token })
    }

    const buddy = axios.create({
      baseURL: 'https://api.buddy.works/workspaces/theinfiniteagency/',
      headers: {
        'Authorization': `Bearer ${user_config.buddy_token}`,
        'Content-Type': 'application/json',
      }
    })

    switch(args.action) {
      case 'status':
        this.log(chalk.grey('Getting pipelines for project:', current_repo))

        try {
          let pipelines = await buddy.get(`projects/${current_repo}/pipelines`)

          pipelines.data.pipelines.forEach(pipeline => {
            switch(pipeline.last_execution_status) {
              case 'SUCCESSFUL':
                this.log(chalk.green('•'), chalk.grey(`(${pipeline.id})`), pipeline.name, chalk.green(pipeline.last_execution_status))
                break
              case 'INPROGRESS':
                this.log(chalk.yellow('•'), chalk.grey(`(${pipeline.id})`), pipeline.name, chalk.yellow(pipeline.last_execution_status))
                break
              case 'ENQUEUED':
                this.log(chalk.yellow('•'), chalk.grey(`(${pipeline.id})`), pipeline.name, chalk.yellow(pipeline.last_execution_status))
                break
              default:
                this.log(chalk.red('•'), chalk.grey(`(${pipeline.id})`), pipeline.name, chalk.red(pipeline.last_execution_status))
                break
            }
            
          })

        } catch(err) {
          err.response.data.errors.forEach(error => {
            this.log(chalk.grey(error.message))
          })
          return this.exit()
        }

        break
      case 'pipeline':
        this.log(chalk.grey('Getting pipelines for project:', current_repo))

        try {
          let pipelines = await buddy.get(`projects/${current_repo}/pipelines`)

          let choices = [], choose = {}
          pipelines.data.pipelines.forEach(pipeline => {
            choices.push({ name: pipeline.name, value: pipeline.id })
          })

          if(flags.pipeline) {
            let valid_pipeline = choices.filter(choice => {
              return (choice.value == flags.pipeline || choice.name == flags.pipeline)
            })

            if(valid_pipeline.length == 0) return this.error(`Could not find a pipeline with id: ${flags.pipeline}`)

            choose = { pipeline: valid_pipeline[0].value }
          } else {
            choose = await inquirer.prompt([
              {
                type: 'list',
                name: 'pipeline',
                message: 'Choose a pipeline to deploy:',
                choices: choices
              }
            ])
          }
          

          // this.log(chalk.grey(`Executing pipeline (${choose.pipeline})`))
          let bar = new Progress.Bar({
            format: '{status} pipeline ({pipeline}) [{bar}] {percentage}%',
          }, Progress.Presets.legacy)
          bar.start(120, 0, {
            status: 'Executing',
            pipeline: choose.pipeline,
          })

          let execute = await buddy.post(`projects/${current_repo}/pipelines/${choose.pipeline}/executions`, {
            to_revision: {
              revision: flags.revision
            }
          })

          bar.update(25, {
            status: 'Running'
          })

          let execution_id = execute.data.id

          let check_promise = new Promise((resolve, reject) => {
              let check_status = () => {
                buddy.get(`projects/${current_repo}/pipelines/${choose.pipeline}/executions/${execution_id}`).then(response => {
                  let data = response.data
                  bar.update(data.action_executions[0].progress + 25)
                  // this.log(chalk.grey(`Progress: ${Math.round(data.action_executions[0].progress)}%`))
                  if(data.finish_date !== null) return resolve(data)
                  if(data.finish_date == null) return setTimeout(() => { check_status() }, 1000)
                }).catch(reject)
              }

              check_status()
          })

          let complete = await check_promise
          bar.stop()

          switch(complete.status) {
            case 'SUCCESSFUL':
              this.log(chalk.grey('Buddy Status:'), chalk.green(complete.status))
              break
            case 'INPROGRESS':
              this.log(chalk.grey('Buddy Status:'), chalk.yellow(complete.status))
              break
            case 'ENQUEUED':
              this.log(chalk.grey('Buddy Status:'), chalk.yellow(complete.status))
              break
            default:
              this.log(chalk.grey('Buddy Status:'), chalk.red(complete.status))
              break
          }


        } catch(err) {
          if(!err.response) return this.error(err)
          err.response.data.errors.forEach(error => {
            this.log(chalk.grey('Buddy:',error.message))
          })
          return this.exit()
        }

        
        break
      case 'add':
        
        break
    }
    
  }
}

DeployCommand.description = `manage Buddy projects and trigger pipelines`

DeployCommand.args = [
{ 
  name: 'action', 
  required: true, 
  default: 'pipeline', 
  description: `
[status] get status of current project pipelines,
[pipeline] execute a pipeline, use the -p flag to skip selection,
[add] create a project from current repository`, 
  options: ['status', 'pipeline', 'add'] 
}
]

DeployCommand.flags = {
  pipeline: flags.string({char: 'p', description: '[default: select from list] pipeline name or id to execute'}),
  revision: flags.string({char: 'r', description: 'revision id to deploy', default: 'HEAD' }),
}

module.exports = DeployCommand
