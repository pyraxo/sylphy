# Sylphy
[![Studio 777](https://discordapp.com/api/guilds/247727924889911297/embed.png)](https://discord.gg/bBqpAKw) [![NPM version](https://img.shields.io/npm/v/sylphy.svg?style=flat-square)](https://www.npmjs.com/package/sylphy) [![Dependency Status](https://img.shields.io/david/abalabahaha/eris.svg?style=flat-square)](https://david-dm.org/abalabahaha/eris)

<a href="https://nodei.co/npm/sylphy/"><img src="https://nodei.co/npm/sylphy.png?downloads=true&stars=true" alt="NPM info" /></a>

**Sylphy** is an advanced, efficient and highly customisable framework for Discord command bots written in Node.js

## Getting Started
### Requirements
* **Node.js 6+**

A firm grasp of **ES6 + async/await** syntax is optional but recommended.

As the bot framework extends the [Eris](https://github.com/abalabahaha/Eris) client, please refer to the docs [here](https://abal.moe/Eris/docs).

### Usage
```bash
$ npm install --save sylphy
```

If you don't want to use any built-in plugins, you may run the above command with the `--no-optional` flag.

#### Example
```js
const Bot = require('sylphy')

const client = new Bot({
  token: 'your token here',
  modules: 'path/to/modules'
})

client.register('commands', 'path/to/commands')

client.run()
```

### Documentation
To view the API, please visit the [wiki](https://github.com/pyraxo/sylphy/wiki).

## License
Copyright (C) 2017  Pyraxo

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.
