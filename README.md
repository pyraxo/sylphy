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

**iris** is an advanced, efficient and highly customisable framework for Discord command bots written in Node.js

# Getting Started
## Requirements
* **Node.js 6+**

A firm grasp of **ES6 + async/await** syntax is optional but recommended.

As the bot framework extends the [Eris](https://github.com/abalabahaha/Eris) client, please refer to the docs [here](https://abal.moe/Eris/docs).

## Usage
```bash
$ npm install --save pyraxo/iris
```

If you don't want to use any built-in plugins, you may run the above command with the `--no-optional` flag.

### Example
```js
const Bot = require('iris')

const client = new Bot({
  token: 'your token here'
})

client.register('commands', 'path/to/commands')

client.run()
```

# Plugins
The framework consists of plugins that extend the functionality of the Discord client.

Plugins can be added via external modules; several have already been included in the framework.

## Commander
The **Commander** plugin allows **Commands** to be executed. When a successful command is called, the Commander will execute the corresponding command functions.

Example usage:
```js
const filepath = 'path/to/commands'
class PingCommand extends Command {
  constructor (...args) {
    super(...args, {
      name: 'ping',
      options: { guildOnly: true }
    })
  }

  handle ({ msg }) {
    return msg.reply('Pong!')
  }
}
const commands = [
  PingCommand,
  {
    name: 'powerup',
    execute: async ({ msg, client }) => {
      const channel = await client.getChannel('247727924889911297')
      return msg.reply(channel ? 'Powered up!' : 'Unpowered...')
    }
  }
]

client
.register('commands', commands)
.register('commands', filepath)
```

## Router
The **Router** plugin takes care of **Modules** by routing event arguments to the corresponding modules' methods.

Example usage:
```js
class BanModule extends Module {
  constructor (...args) {
    name: 'guilds:bans',
    events: {
      guildBanAdd: 'onBan'
    }
  }

  onBan (guild, user) {
    console.log(`User ${user.username} has been banned from ${guild.name}`)
  }
}
const modules = [
  BanModule,
  {
    name: 'guilds:logger',
    events: {
      guildCreate: 'newGuild'
    },
    newGuild: (guild) => console.log(`New guild: ${guild.name}`)
  }
]

client.register('modules', modules)
```

## Bridge
The **Bridge** plugin maintains a chain of **Middleware**, passing messages through each middleware function and resolving a **Container** object.

Example usage:
```js
client.register('middleware', [{
  name: 'checkPrivate',
  priority: 1,
  process: (container) => {
    container.isPrivate = !!msg.guild
    return Promise.resolve(container)
  }
}])
```

## Registering Components into Built-in Plugins
As shown in the examples above, to fully utilise the plugins, the components have to be registered into the appropriate plugin with the `register()` method.

The 1st argument should take in the plugin type, while the 2nd argument should **not** receive the raw component, but instead should be an array or object containing the components.

```js
// Correct:
client
.register('commands', [ SomeCommand ])
.register('commands', {
  core: {
    'ping': PingCommand,
    'help': HelpCommand
  }
})

// Incorrect:
client.register('commands', SomeCommand)
```

## Custom Plugins
Custom plugin support is available as long as the added plugins follow certain criteria:
* Must be a class
* Must contain the `register()` and `unregister()` methods, to which any number of arguments can be passed

To add a custom plugin:
```js
client.createPlugin('pluginType', PluginClass)
```

To access a plugin:
```js
const plugin = client.plugins.get('pluginType')
```

The plugin's `register` method will be called when `client.register()` is called with the first argument matching the corresponding plugin type.

# Components
Plugins handle certain components that players can choose to add. For example, the **Commander** plugin makes use of **Commands**, which could be a class, function or object depending on the user's preference.

**All built-in components have a built-in utility class containing various special methods. Do read the docs.**

## Commands
Text commands are specially formatted messages that Discord users can send. Bots will then carry out tasks according to the issued command. Most commands follow this format:

```
<prefix><trigger> <suffix>
e.g. !help ping
```

Each **Command** component corresponds to a text command. Commands can be a class, function or object.

Commands must include:
* `triggers` - An array of triggers, where the first is the main trigger while the rest are aliases
* `execute` - A function that should accept a **Container** object as the first argument
* `group` - An *optional* string referencing the group of the command

## Modules
**Modules** are classes or objects containing methods that listen to specific events the client emits.

Modules must include:
* `name` - A string containing the name of the middleware
* `events` - An object mapping an event name to a function name

Example module object:
```js
{
  name: 'guilds:logger',
  events: {
    guildCreate: 'newGuild',
    guildDelete: 'delGuild'
  },
  newGuild: (guild) => console.log(`New guild: ${guild.name}`),
  delGuild: (guild) => console.log(`Deleted guild: ${guild.name}`)
}
```

## Middleware
**Middleware** are objects that receive a **Container** object, insert or modify its elements, and resolve the container. Middleware are chained together and executed according to their priority number.

Middleware must include:
* `name` - A string containing the name of the middleware
* `priority` - A number referencing the priority to run the middleware. A lower number means it will be run earlier.
* `process` - A function that should a **Container** object as the first argument.

## Container
**Containers** are special objects containing properties that are passed around as a context. Among the default plugins, the **Commander** and **Bridge** plugins use them, and the **Commands** and **Middleware** components will be passed a **Container** as an argument, where they can modify and add properties to the container.

A default unmodified container contains:
* `msg` - A message object
* `client` - The client instance
* `commands` - A **Commander** instance
* `modules` - A **Router** instance
* `middleware` - A **Bridge** instance

# License
Copyright (C) 2017  Pyraxo

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.
