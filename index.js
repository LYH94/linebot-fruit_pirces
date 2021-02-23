// 引用 line 機器人套件
import linebot from 'linebot'
// 引用 dotenv 套件
import dotenv from 'dotenv'
// 引用 axios 套件
import axios from 'axios'
// 引用 node-schedule
import schedule from 'node-schedule'
// 引用 cheerio
import cheerio from 'cheerio'
// import fs from 'fs'

const data = []
const getHTML = async () => {
  // 取得 10 頁的水果資料
  for (let i = 1; i <= 10; i++) {
    const response = await axios.get(`https://www.twfood.cc/fruit?page=${i}&per-page=5`)
    data.push(cheerio.load(response.data))
  }
  console.log('資料更新完成')
}
// 每天 0 點自動更新資料
schedule.scheduleJob('* * 0 * * *', () => {
  getHTML()
})
// 呼叫資料
getHTML()
// 讀取 .env
dotenv.config()

// 設定機器人
const bot = linebot({
  channelId: process.env.CHANNEL_ID,
  channelSecret: process.env.CHANNEL_SECRET,
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN
})

// 當收到訊息時，event 包含了訊息的類型、文字等
bot.on('message', async event => {
  try {
    const text = event.message.text
    let reply = {
      type: 'flex',
      altText: `查詢${text}的結果`,
      contents: {
        type: 'carousel',
        contents: [
        ]
      }
    }

    for (const $ of data) {
      for (let j = 0; j < $('#vege_chart').length; j++) {
        // 取得價格
        const prices = ($('table').eq(j).text().trim().replace(/\s+/g, ''))
        // 取種類名稱
        let name = ($('h4').eq(j).text().replace(/\s+/g, ''))
        name = name.replace(/推薦No:\d+/g, '')
        // 取網址資訊
        const info = ($('h4 a').eq(j).attr('href'))
        const web = ('https://www.twfood.cc' + info)
        // 抓照片
        const img = ($('.vege_img').eq(j).find('img').attr('src'))
        const imgs = ('https://www.twfood.cc' + img)

        // 如果使用者輸入的字有相符的水果
        if (name.includes(text)) {
          reply.contents.contents.push(
            {
              type: 'bubble',
              hero: {
                type: 'image',
                url: imgs,
                size: 'full',
                aspectRatio: '20:13',
                aspectMode: 'cover',
                action: {
                  type: 'uri',
                  uri: web
                }
              },
              body: {
                type: 'box',
                layout: 'vertical',
                contents: [
                  {
                    type: 'text',
                    text: '每日農產品交易價格',
                    weight: 'bold',
                    size: 'md',
                    color: '#264653'
                  },
                  {
                    type: 'box',
                    layout: 'vertical',
                    contents: [
                      {
                        type: 'box',
                        layout: 'vertical',
                        margin: 'lg',
                        spacing: 'sm',
                        contents: []
                      }
                    ]
                  },
                  {
                    type: 'text',
                    text: name,
                    weight: 'bold',
                    size: 'xl',
                    color: '#649300'
                  },
                  {
                    type: 'box',
                    layout: 'vertical',
                    margin: 'lg',
                    spacing: 'sm',
                    contents: [
                      {
                        type: 'box',
                        layout: 'baseline',
                        spacing: 'sm',
                        contents: [
                          {
                            type: 'text',
                            text: prices,
                            wrap: true,
                            color: '#aaaaaa',
                            size: 'md',
                            weight: 'bold'
                          }
                        ]
                      }
                    ]
                  }
                ]
              },
              footer: {
                type: 'box',
                layout: 'vertical',
                spacing: 'sm',
                contents: [
                  {
                    type: 'spacer',
                    size: 'sm'
                  },
                  {
                    type: 'button',
                    style: 'primary',
                    color: '#264653',
                    height: 'sm',
                    action: {
                      type: 'uri',
                      label: '更多資訊',
                      uri: web
                    }
                  }
                ],
                flex: 0
              }
            }
          )
        }
      }
    }
    // fs.writeFile('./data.json', JSON.stringify(reply, null, 2), () => {})
    reply = (reply.contents.contents.length === 0) ? '找不到你要的水果，請重新搜尋' : reply
    event.reply(reply)
  } catch (error) {
    event.reply('發生錯誤')
    console.log(error)
  }
})

// 設定機器人監聽 port
bot.listen('/', process.env.PORT, () => {
  console.log('機器人已啟動')
})

// 目前只有取 10頁 共 50 種水果
// 價格無法依照想要的欄位取出所以就一起顯示了
