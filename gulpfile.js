var gulp = require('gulp');
var minify = require('gulp-minifier');

gulp.task('default', function() {
	gulp.start('minifyHTML');
    gulp.start('minifyCSS');
    gulp.start('minifyJS');
    gulp.start('minifyJSOut');
    gulp.start('watch');
    gulp.src("imgRes/**.*")
    .pipe(gulp.dest('dist/imgRes'));
    gulp.src("imgRes/icons/**.*")
    .pipe(gulp.dest('dist/imgRes/icons'));
    gulp.src("manifest.json")
    .pipe(gulp.dest('dist/'));
});

gulp.task('minifyHTML', function() {
  return gulp.src('*.html').pipe(minify({
    minify: true,
    minifyHTML: {
      collapseWhitespace: true,
      conservativeCollapse: true,
    }
  })).pipe(gulp.dest('dist/'));
});

gulp.task('minifyCSS', function() {
  return gulp.src('css/*.css').pipe(minify({
    minify: true,
    minifyCSS: true,
    getKeptComment: function (content, filePath) {
        var m = content.match(/\/\*![\s\S]*?\*\//img);
        return m && m.join('\n') + '\n' || '';
    }
  })).pipe(gulp.dest('dist/css'));
});
 
gulp.task('minifyJS', function() {
  return gulp.src('js/*.js').pipe(minify({
    minify: true,
    minifyJS: {
      sourceMap: true
    },
  })).pipe(gulp.dest('dist/js'));
});

gulp.task('minifyJSOut', function() {
  return gulp.src('sw.js').pipe(minify({
    minify: true,
    minifyJS: {
      sourceMap: true
    },
  })).pipe(gulp.dest('dist/'));
});
gulp.task('watch', function() {
    gulp.watch('*.html', ['minifyHTML']);
    gulp.watch('css/*.css', ['minifyCSS']);
    gulp.watch('js/*.js', ['minifyJS']);
    gulp.watch('sw.js', ['minifyJSOut']);
});