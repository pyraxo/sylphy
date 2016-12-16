const gulp = require('gulp')
const babel = require('gulp-babel')
const standard = require('gulp-standard')

const paths = ['src/**/*.js']

gulp.task('default', ['build'])

gulp.task('watch', ['build'], () => {
  gulp.watch(paths, ['build'])
})

gulp.task('build', ['babel'])

gulp.task('lint', () => {
  gulp.src(paths)
  .pipe(standard())
  .pipe(standard.reporter('default', {
    breakOnError: true,
    quiet: true
  }))
})

gulp.task('babel', () => {
  gulp.src(paths)
  .pipe(babel())
  .pipe(gulp.dest('build'))
})
