var gulp = require('gulp')
var sourcemaps = require('gulp-sourcemaps')
var babel = require('gulp-babel')
var coffee = require('gulp-coffee')
var gutil = require('gulp-util')
var plumber = require('gulp-plumber')
var changed = require('gulp-changed')
var path = require('path')

var paths = {
  coffee: ['src/**/*.coffee'],
  brewed: 'lib',
  es6: ['src/**/*.es6', 'src/**/*.js'],
  es5: 'lib',
  root: path.join(__dirname, 'src')
}

gulp.task('coffee', function () {
  return gulp.src(paths.coffee, {dot: true})
    .pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(coffee({bare: true})
    .on('error', function (err) {
      gutil.log(err.stack)
    }))
    .pipe(sourcemaps.write('.', { sourceRoot: paths.root }))
    .pipe(gulp.dest(paths.brewed))
})

gulp.task('babel', function () {
  return gulp.src(paths.es6, {dot: true})
    .pipe(plumber())
    .pipe(changed(paths.es5))
    .pipe(sourcemaps.init())
    .pipe(babel({ presets: ['es2015'] }))
    .pipe(sourcemaps.write('.', { sourceRoot: paths.root }))
    .pipe(gulp.dest(paths.es5))
})

gulp.task('watch', function () {
  gulp.watch(paths.coffee, ['coffee'])
  gulp.watch(paths.es6, ['babel'])
})

gulp.task('default', ['watch', 'coffee', 'babel'])
