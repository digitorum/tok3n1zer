var gulp = require('gulp');
var gulpConcat = require('gulp-concat');
var gulpUglifyJS = require("gulp-uglifyjs");

gulp.task('default', function () {
    var orderedFiles = ['lib/parserStates.js', 'lib/produce.js', 'lib/parser.js'];

    gulp.src(orderedFiles).pipe(gulpConcat('tok3n1zer.js')).pipe(gulp.dest('dist/'));
    gulp.src(orderedFiles).pipe(gulpConcat('tok3n1zer.min.js')).pipe(gulpUglifyJS()).pipe(gulp.dest('dist/'));
});