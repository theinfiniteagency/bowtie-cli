const Command = require('../base')
const {flags, args} = require('@oclif/command')
const intro = require('../partials/intro')
const chalk = require('chalk')
const axios = require('axios')
const cheerio = require('cheerio')
const moment = require('moment')

const southbound = ['Westmoreland', 'N. Carrollton', 'DFW', 'UNT', 'Bachman', 'Cedars'];
const northbound = ['Parker Road', 'Rowlett', 'LBJ / Central', 'Buckner', 'Fair Park'];

class DartCommand extends Command {
  async run() {
    const currentdir = process.cwd()
    const {args, flags} = this.parse(DartCommand)

      let stations = [
        { id: '22751', name: 'St. Paul Station' }
      ]

      this.log(chalk.grey('Getting Dart Rail schedule for St. Paul Station'))
      this.log(chalk.grey('Time Now:', moment().format('h:m A')))

      try {
        let page = await axios.get('https://m.dart.org/railSchedule.asp?switch=pushRailStops3&ddlRailStopsFrom=22751')
        const $ = cheerio.load(page.data)

        let schedules = []

        let elements = $('#maincontent').find('div')

        elements.each((i, stop) => {
          let schedule = {}

          let html = $(stop).html()
          let line = this.getRailLine(html)
          let destination = this.getDestination(html)
          let departure = this.getDeparture(html)

          if(!line || !destination) return

          schedule.line = line
          if(departure) schedule.departure = departure

          for(let s=0;s<southbound.length;s++) {
            if(new RegExp(southbound[s].toUpperCase()).test(destination)) {
              schedule.direction = 'W';
              schedule.destination = southbound[s];
            }
          }

          for(let n=0;n<northbound.length;n++) {
            if(new RegExp(northbound[n].toUpperCase()).test(destination)) {
              schedule.direction = 'E';
              schedule.destination = northbound[n];
            }
          }

          this.log(chalk.grey(`(Departs: ${schedule.departure})`), `${chalk[this.getChalkColor(schedule.line)](schedule.line)}`, chalk.grey('Line', 'to'), schedule.destination)
        })

      } catch(err) {
        this.log(err)
        this.error('Could not get schedules')
      }
      

      // osmosis.get('http://m.dart.org/railSchedule.asp?switch=pushRailStops3&ddlRailStopsFrom=22751&option=1')
      //   .find('#maincontent div')
      //   .set('#maincontent div :html')
      //   .data(function(listing) {
      //     let schedule = {}
      //     let data = listing['#maincontent div :html'];
      //     let line = new RegExp('LINE');
      //     // Check if DIV is referencing a rail line
      //     if(line.test(data)) {
      //       data = data.replace('Estimated', ' Estimated');
      //       data = data.replace('Scheduled', ' Scheduled');

      //       // Set the line color
      //       if(new RegExp('ORANGE LINE').test(data)) {
      //         schedule.line = 'orange';
      //       } else if (new RegExp('GREEN LINE').test(data)) {
      //         schedule.line = 'green';
      //       } else if (new RegExp('RED LINE').test(data)) {
      //         schedule.line = 'red';
      //       } else if (new RegExp('BLUE LINE').test(data)) {
      //         schedule.line = 'blue';
      //       }

      //       // Set direction
      //       let southbound = ['Westmoreland', 'N. Carrollton', 'DFW', 'UNT', 'Bachman', 'Cedars'];
      //       let northbound = ['Parker Road', 'Rowlett', 'LBJ / Central', 'Buckner', 'Fair Park'];

      //       for(let s=0;s<southbound.length;s++) {
      //         if(new RegExp(southbound[s].toUpperCase()).test(data)) {
      //           schedule.direction = 'westbound';
      //           schedule.destination = southbound[s];
      //         }
      //       }

      //       for(let n=0;n<northbound.length;n++) {
      //         if(new RegExp(northbound[n].toUpperCase()).test(data)) {
      //           schedule.direction = 'eastbound';
      //           schedule.destination = northbound[n];
      //         }
      //       }

      //       // Set the time
      //       let time = data.match(/(\d?\d:\d\d [P|A][M])/g);
      //           time = moment(time[0], 'h:mm A');

      //       schedule.departure = time.unix();
      //       schedule.departs = time.fromNow();
      //       schedules['St. Paul Station'].push(schedule);
      //     }

      //   })
      //   .done(function() {

      //     schedules['St. Paul Station'].sort(function(a, b) {
      //       return a.departure - b.departure;
      //     });

      //     let output = {
      //       schedules,
      //       scraped: moment().unix()
      //     }

      //     resolve(output);
      //   });
    
  }

  getRailLine(html) {
    if(new RegExp('ORANGE LINE').test(html)) {
      return 'Orange';
    } else if (new RegExp('GREEN LINE').test(html)) {
      return 'Green';
    } else if (new RegExp('RED LINE').test(html)) {
      return 'Red';
    } else if (new RegExp('BLUE LINE').test(html)) {
      return 'Blue';
    }
  }

  getChalkColor(color) {
    switch(color) {
      case 'Orange':
        return 'yellow'
        break
      case 'Green':
        return 'green'
        break
      case 'Red':
        return 'red'
        break
      case 'Blue':
        return 'blue'
        break
    }
  }

  getDestination(html) {
    let destination = html.match(/to\s\<b\>\s*([A-Za-z\.\s*]+)\s*\<\/b\>/i)
    return destination ? destination[1] : false
  }

  getDeparture(html) {
    let time = html.match(/\d?\d:\d\d\s(A|P)M/)
    return time ? time[0] : 'N/A'
  } 
}

DartCommand.description = `get Dart Rail schedules`

DartCommand.args = [
  
]

DartCommand.flags = {
  
}

module.exports = DartCommand
