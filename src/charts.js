let Discord = require('discord.js')
let leaderboard = require('./leaderboard')

/**
 * @param {Discord.Message} message
 * @param {import('../index').chartsOptions} options
 */

async function charts(message, options = []) {
  let { client } = message
  const ChartJSImage = require('chart.js-image')

  let data = []
  let uzern = []

  await leaderboard(client, message.guild.id).then((e) => {
    e.forEach((m) => {
      if (m.position <= 5) {
        data.push(m.xp)
        uzern.push(m.tag)
      }
    })
  })

  const line_chart = ChartJSImage()
    .chart({
      type: options.type || 'bar',
      data: {
        labels: uzern,
        datasets: [
          {
            label: 'Leaderboards',
            data: data,
            backgroundColor: [
              'rgba(255, 99, 132, 0.5)',
              'rgba(255, 159, 64, 0.5)',
              'rgba(255, 205, 86, 0.5)',
              'rgba(75, 192, 192, 0.5)',
              'rgba(54, 162, 235, 0.5)',
              'rgba(153, 102, 255, 0.5)',
              'rgb(201, 203, 207, 0.5)'
            ],
            borderColor: [
              'rgb(255, 99, 132)',
              'rgb(255, 159, 64)',
              'rgb(255, 205, 86)',
              'rgb(75, 192, 192)',
              'rgb(54, 162, 235)',
              'rgb(153, 102, 255)',
              'rgb(201, 203, 207)'
            ],
            borderWidth: 2
          }
        ]
      },
      options: {
        plugins: {
          legend: {
            labels: {
              font: {
                family: 'Courier New'
              }
            }
          }
        },
        title: {
          display: true,
          text: 'XP Datasheet'
        }
      }
    })
    .backgroundColor(options.background || '#2F3136')
    .width(940) // 500px
    .height(520) // 300px

  const attachment = new Discord.MessageAttachment(
    line_chart.toURL(),
    `chart.png`
  )
  return attachment
}

module.exports = charts
