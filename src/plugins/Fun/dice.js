import _ from 'lodash'

import BaseCommand from '../../Base/BaseCommand'

class Dice extends BaseCommand {
  get name () {
    return 'dice'
  }

  get description () {
    return 'Rolls some dice. 1d6 by default'
  }

  get usage () {
    return '[(rolls)d(sides)][+|-|*|/(number)]'
  }

  roll (num = 1, faces = 6, offset = '+0') {
    num = parseInt(num, 10)
    faces = parseInt(faces, 10)
    let res = []
    for (let i = 0; i < num; i++) {
      res.push(Math.floor(Math.random() * faces + 1))
    }
    res = _.sum(res)
    switch (offset[0]) {
      case '+': {
        res += parseInt(offset.substring(1), 10)
        break
      }
      case '-': {
        res -= parseInt(offset.substring(1), 10)
        break
      }
      case '*': {
        res *= parseInt(offset.substring(1), 10)
        break
      }
      case '/': {
        res /= parseInt(offset.substring(1), 10)
        break
      }
    }
    return +res.toFixed(2)
  }

  handle (args) {
    if (args[0]) {
      if (/^[1-9]*$/.test(args[0])) {
        this.reply(`🎲 **${args[0]}d6**  |  Result: **${this.roll(args[0])}**`)
      } else {
        let input = args[0].match(/^(\d+)?d(\d+)([\+\-\*\/]\d+)?$/i)
        if (input === null) {
          this.wrongUsage()
          return
        }
        this.reply(`🎲 **${args[0]}**  |  Result: **${this.roll(...input.slice(1))}**`)
      }
    } else {
      this.reply(`🎲 **1d6**  |  Result: **${this.roll()}**`)
    }
  }
}

module.exports = Dice
