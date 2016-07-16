<h1 align="center">
  <br>
  iris
  <br>
</h1>
<h4 align="center">a better discord bot base</h4>
<p align="center">
  <a href="https://github.com/feross/standard"><img src="https://cdn.rawgit.com/feross/standard/master/badge.svg"></a>
  <br>
  <a href="http://forthebadge.com/"><img src="http://forthebadge.com/images/badges/built-with-love.svg" alt="Built with ❤"></a>
</p>

**Written for:** [Tatsumaki](http://tatsumaki.xyz), a social Discord bot

**Node.js 6+** required. Uses ECMAScript 6.

## Installation
```bash
$ git clone https://github.com/pyraxo/iris
$ cd iris
$ npm i
$ gulp
$ npm start
```

## Configuration
You will see **two** sample configuration files, `discord.example.json` and `redis.example.json`.

If you do not intend to use [Redis](http://redis.io), simply edit `discord.json` as directed, and then save them as `discord.json`.

Otherwise, edit `redis.example.json` and save it as `redis.example.json`.

## Compilation
**iris** uses [Gulp](http://gulpjs.com) to compile the files from `src` to `lib`.

Ensure that the `lib` folder exists before running the bot, and is generally in accordance with your `src` folder.

## Documentation
To read the docs, simply run `npm run gendocs` in the main directory.

## Contributing
Want to help develop **iris** or **Tatsumaki**? Feel free to submit a PR or drop by the [Tatsumaki server](https://discord.gg/0xyZL4m5TyYTzVGY)!

We're also currently looking for translators and artists.
