const gulp = require('gulp')
const babel = require('gulp-babel')

const paths = ['src/**/*.js']

gulp.task('default', ['babel'])

gulp.task('babel', () => {
  gulp.src(paths)
  .pipe(babel({
    plugins: ['transform-async-to-generator']
  }))
  .pipe(gulp.dest('build'))
})
