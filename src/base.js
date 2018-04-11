const { Command } = require('@oclif/command')
const path = require('path')
const fs = require('fs-extra')
const shell = require('shelljs')

class Base extends Command {
    
    async getUserConfig() {
        let config_exists = await fs.exists(path.join(this.config.configDir, `config.json`))
        let user_config
        if(config_exists) {
            user_config = await fs.readJSON(path.join(this.config.configDir, `config.json`))
        } else {
            await fs.outputJSON(path.join(this.config.configDir, `config.json`), { secret: false }, err => {
                this.error('could not create user config')
            })
            user_config = await fs.readJSON(path.join(this.config.configDir, `config.json`))
        }

        return user_config
    }

    async updateUserConfig(data) {
        let config = await this.getUserConfig()
        let updated = Object.assign({}, config, data)
        await fs.outputJSON(path.join(this.config.configDir, `config.json`), updated, err => {
            if(err) this.error('could not update user config')
        })

        return updated
    }

    getCurrentRepo() {
        return shell.exec('basename -s .git `git config --get remote.origin.url`', { silent: true }).stdout.trim()
    }

    getDirname(p) {
        let d = p.split(path.sep)
        return d[d.length-1]
    }
}

module.exports = Base