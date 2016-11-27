const crypto = require('crypto')
const http = require('http')
const entities = require('entities')

const { Module } = require('../../core')

class Cleverbot extends Module {
  constructor (...args) {
    super(...args, {
      name: 'cleverbot'
    })

    this.params = {
      stimulus: '',
      start: 'y',
      sessionid: '',
      vText8: '',
      vText7: '',
      vText6: '',
      vText5: '',
      vText4: '',
      vText3: '',
      vText2: '',
      icognoid: 'wsf',
      icognocheck: '',
      fno: '0',
      prevref: '',
      emotionaloutput: '',
      emotionalhistory: '',
      asbotname: '',
      ttsvoice: '',
      typing: '',
      lineref: '',
      sub: 'Say',
      islearning: '1',
      cleanslate: 'false'
    }

    this.parserKeys = [
      'message', 'sessionid', 'logurl',
      'vText8', 'vText7', 'vText6', 'vText5', 'vText4', 'vText3', 'vText2',
      'prevref', '', 'emotionalhistory', 'ttsLocMP3', 'ttsLocTXT', 'ttsLocTXT3',
      'ttsText', 'lineref', 'lineURL', 'linePOST',
      'lineChoices', 'lineChoicesAbbrev', 'typingData', 'divert'
    ]

    this.cookies = {}
  }

  async respond (message, channel) {
    let response = await this.write(message)
    response = this.processUnicode(response.message)
    if (!response) return
    this.send(channel, `💬  |  ${entities.decodeHTML(response)}`)
  }

  processUnicode (text) {
    if (/\|/g.test(text)) {
      return text.replace(/\|/g, '\\u').replace(/\\u([\d\w]{4})/gi, (match, grp) => String.fromCharCode(parseInt(grp, 16)))
    }
    return text
  }

  digest (body) {
    let m = crypto.createHash('md5')
    m.update(body)
    return m.digest('hex')
  }

  encodeParams (a1) {
    let u = []
    for (const x in a1) {
      if (a1[x] instanceof Array) {
        u.push(x + '=' + encodeURIComponent(a1[x].join(',')))
      } else if (a1[x] instanceof Object) {
        u.push(this.params[a1[x]])
      } else {
        u.push(x + '=' + encodeURIComponent(a1[x]))
      }
    }
    return u.join('&')
  }

  init () {
    const options = {
      host: 'www.cleverbot.com',
      port: 80,
      path: '/',
      method: 'GET'
    }

    let req = http.request(options, res => {
      if (res.headers && res.headers['set-cookie']) {
        let list = res.headers['set-cookie']
        list.forEach(elem => {
          const single = elem.split(';')
          const current = single[0].split('=')
          this.cookies[current[0]] = current[1]
        })
      }
    })
    req.end()
  }

  write (message) {
    let body = this.params
    body.stimulus = message
    body.icognocheck = this.digest(this.encodeParams(body).substring(9, 35))

    let cookieArr = []
    for (const key in this.cookies) {
      if (this.cookies.hasOwnProperty(key)) {
        cookieArr.push(key + '=' + this.cookies[key])
      }
    }
    const options = {
      host: 'www.cleverbot.com',
      port: 80,
      path: '/webservicemin?uc=165&',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': this.encodeParams(body).length,
        'Cache-Control': 'no-cache',
        'Cookie': cookieArr.join(';')
      }
    }
    return new Promise((resolve, reject) => {
      let req = http.request(options, res => {
        res.on('data', chunk => {
          const chunkData = chunk.toString().split('\r')
          let response = {}
          chunkData.forEach((data, idx) => {
            this.params[this.parserKeys[idx]] = response[this.parserKeys[idx]] = data
          })
          return resolve(response)
        })
      })
      req.write(this.encodeParams(body))
      req.end()
    })
  }
}

module.exports = Cleverbot
