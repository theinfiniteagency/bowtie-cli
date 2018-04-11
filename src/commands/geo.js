const Command = require('../base')
const {flags, args} = require('@oclif/command')
const intro = require('../partials/intro')
const chalk = require('chalk')
const axios = require('axios')
const path = require('path')
const fs = require('fs-extra')
const Papa = require('papaparse')
const RateLimiter = require('limiter').RateLimiter
const Progress = require('cli-progress')

class GeoCommand extends Command {
  async run() {
    const currentdir = process.cwd()
    const {args, flags} = this.parse(GeoCommand)

    let user_config = await this.getUserConfig()
    if(!user_config.google_api_key) {
      let prompt = await inquirer.prompt([
        {
          type: 'input',
          name: 'google_api_key',
          message: 'Please enter Maps API enabled Google API key:'
        }
      ])

      user_config = await this.updateUserConfig({ google_api_key: prompt.google_api_key })
    }

    if(flags.source) return await this.parseCSV(path.join(currentdir, flags.source), user_config.google_api_key)
    if(!flags.source && !args.address) return this.error('An address is required')

    let params = {
      params: {
        key: user_config.google_api_key,
        address: args.address
      }
    }

    this.log(chalk.grey('Getting coordinates for', args.address))
    try {
      let response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', params)
      let coordinates = response.data.results[0].geometry.location

      this.log('🌎', { latitude: coordinates.lat, longitude: coordinates.lng })
    } catch(err) {
      this.error('Could not get coordinates')
    }
    
  }

  async parseCSV(source, api_key) {
    let exists = fs.existsSync(source)
    if(!exists) return this.error(`Could not find CSV: ${source}`)

    let output = [],
        failed = [],
        total  = 0

    let limiter = new RateLimiter(75, 'second')

    
    let bar = new Progress.Bar({
      format: 'Processing [{bar}] {percentage}% {value}/{total}',
    }, Progress.Presets.legacy)
    

    fs.readFile(source, 'utf8', (err, data) => {
      Papa.parse(data, {
        header: true,
        step: row => {
          total++
          let location = row.data[0]

          limiter.removeTokens(1, async () => {
            // Query address for coordinates
            let params = {
              params: {
                key: api_key,
                address: `${location.address} ${location.city}, ${location.state} ${location.zip_code}`
              }
            }
            try {
              let results = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', params)
              if(results.data.status == 'OVER_QUERY_LIMIT') {
                bar.stop()
                this.log(chalk.red(results.data.error_message))
                return process.exit(1)
              } 
              
              if(results.data.results.length == 0) return failed.push(location)

              let coordinates = results.data.results[0].geometry.location
              location.latitude = coordinates.lat
              location.longitude = coordinates.lng

              output.push(location)
            } catch(err) {
              // this.error(err.data.error_message || err.code)
              failed.push(location)
            }
            
          })
        },
        complete: () => {
          bar.start(total, 0)
        }
      })
      
      let interval = setInterval(async () => {
        let completed = output.length + failed.length
        bar.update(completed)
        if(completed == total) {
          bar.stop()
          this.log(chalk.green('Geocode Complete!'), chalk.grey(`${completed}/${total}`))
          clearInterval(interval)
          
          let p = path.parse(source)
          let json_path = path.join(p.dir, p.name+'.json')
          try {
            await fs.writeJson(json_path, { completed: output, failed })
            this.log(chalk.grey(json_path))
          } catch(err) {
            this.error('Could not write JSON file')
          }
          
        }
      }, 1000)


    })
  }
}

GeoCommand.description = `geocode an address or csv to get coordinates`

GeoCommand.args = [
  { name: 'address', description: 'address to retrieve coordinates for' }
]

GeoCommand.flags = {
  source: flags.string({char: 's', description: 'relative path to csv to geocode, must have headings: [address, city, state, zip_code]'}),
}

module.exports = GeoCommand
