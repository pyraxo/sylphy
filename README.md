<div align="center">
  <h1>
    <br>
    iris
    <br>
  </h1>
  <h4>The better Discord bot framework</h4>
  <p>
    <a href="https://github.com/feross/standard"><img src="https://cdn.rawgit.com/feross/standard/master/badge.svg"></a>
    <br>
    <a href="http://forthebadge.com/"><img src="http://forthebadge.com/images/badges/built-with-love.svg" alt="Built with ❤"></a>
    <br>
    <a href="https://discord.gg/0xyZL4m5TyYTzVGY"><img src="https://discordapp.com/api/guilds/247727924889911297/embed.png" alt="Studio 777"></a>
  </p>
</div>

### Used by
* [Tatsumaki](https://tatsumaki.xyz), a multi-purpose social Discord bot
* [haru](https://pyraxo.moe/haru), everyone's favourite idol and part-time bot

**iris** is an advanced, efficient and highly customisable base for Discord command bots written in Node.js

### Requirements
* **Node.js 7+**

A firm grasp of **ES6 + async/await** syntax is recommended.

### Usage
```bash
$ npm install --save pyraxo/iris
```

#### Quick Example
```js
const Bot = require('iris')

const client = new Bot({
  token: 'your token here'
})

client.run()
```

### Configuration
As the bot framework extends the [Eris](https://github.com/abalabahaha/Eris) client, please refer to the docs [here](https://abal.moe/Eris/docs).

### License
Copyright (C) 2017  Pyraxo

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.
