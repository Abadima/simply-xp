let leaderboard = require('./leaderboard')

/**
 * @param {Discord.Message} message
 * @param {import('../index').chartsOptions} options
 */

async function charts(message, options = []) {
  let { client } = message
  const ChartJS = require('chart.js')
  const Canvas = require('canvas')

  let data = []
  let pos = options?.position || 5
  let uzern = []

  let ctx = Canvas.createCanvas(950, 526)
  await leaderboard(client, message.guild.id).then((e) => {
    e.forEach((m) => {
      if (m.position <= pos) {
        data.push(m.xp)
        uzern.push(m.tag)
      }
    })
  })

  new ChartJS(ctx, {
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
      animation: false,
      plugins: {
        title: {
          display: true,
          text: 'XP Datasheet'
        }
      }
    },
    plugins: [
      {
        id: 'simply-xp',
        beforeDraw: (chart) => {
          const ctx = chart.canvas.getContext('2d')
          ctx.save()
          ctx.globalCompositeOperation = 'destination-over'
          ctx.fillStyle = options.background || '#2F3136'
          ctx.fillRect(0, 0, chart.width, chart.height)
          ctx.restore()
        }
      }
    ]
  }).update()

  const attachment = {
    attachment: ctx.toBuffer(),
    name: 'chart.png'
  }
  return attachment
}

module.exports = charts
