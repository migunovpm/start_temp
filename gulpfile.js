const gulp         = require('gulp'),
      imagemin     = require('gulp-imagemin'),
      cache        = require('gulp-cache'), // Не сжимает картинки при добавлении новой.
      sass         = require('gulp-sass'),
      autoprefixer = require('gulp-autoprefixer'),
      minifycss    = require('gulp-csso'), // Минификация
      rename       = require('gulp-rename'),
      browserSync  = require('browser-sync').create(),
      gulpIf       = require('gulp-if'), // В зависимости от условия будет выполнять или не будет выполнять пакеты.
      sourcemaps   = require('gulp-sourcemaps'),
      plumber      = require('gulp-plumber'), // Обработка ошибок
      notify       = require('gulp-notify'), // Вывод ошибок
      concat       = require('gulp-concat'), // Объединение js файлов
      uglify       = require('gulp-uglify'), // Минификация js файлов
      del          = require('del'), // Удаление папки dist
      runSequence  = require('run-sequence'); // Выполнение задач последовательно

/* ------ Конфигурация и настройка сборки  -------- */
const isDevelopment = true;

const moduleJS  = [
  // 'app/js/first.js',
  // 'app/js/second.js',
  // 'app/js/third.js',
  'app/js/common.js'
];

const vendorJS = [
  'app/bower/jquery/dist/jquery.min.js',
  'app/bower/owl-carousel/owl-carousel/owl.carousel.min.js'
];

const vendorCss = [
  'app/bower/normalize-css/normalize.css',
  'app/bower/owl-carousel/owl-carousel/owl.carousel.css'
];  

// Запускаем сервер
gulp.task('browser-sync', [
  'html',
  'styles',
  'images',
  'build:js',
  'vendor:js',
  'vendor:css',
  'fonts'
], function() {
	browserSync.init({
		server: {
			baseDir: './dist'
		}
	});
	// Наблюдаем и обновляем
	browserSync.watch(['./dist/**/*.*', '!**/*.css'], browserSync.reload);
});

// перенос страничек html
gulp.task('html', function(){
  return gulp.src('app/pages/**/*.*')
    .pipe(gulp.dest('dist'));
})

// Перенос шрифтов
gulp.task('fonts', function() {
	return gulp.src('app/fonts/**/*.*')
		.pipe(gulp.dest('dist/fonts'));
});

// Перенос и оптимизация картинок
gulp.task('images', function() {
	return gulp.src('app/img/**/*.{png,svg,jpg}')
		.pipe(cache(imagemin({ 
	    interlaced: true,
	    progressive: true,
	    optimizationLevel: 5,
	    svgoPlugins: [{removeViewBox: true}]
		})))
		.pipe(gulp.dest('dist/img'));
});

// Стили
gulp.task('styles', function() {
	return gulp.src(['app/scss/main.scss'])
		.pipe(plumber({
			errorHandler: notify.onError(function (err) {
				return {title: 'Style', message: err.message}
			})
		}))
		.pipe(gulpIf(isDevelopment, sourcemaps.init()))
		.pipe(sass())
		.pipe(autoprefixer({
      browsers: ['last 2 versions'],
      cascade: false
    }))
    .pipe(minifycss())
    .pipe(rename({suffix: '.min'}))
    .pipe(gulpIf(isDevelopment, sourcemaps.write('maps')))
		.pipe(gulp.dest('dist/css'))
		.pipe(browserSync.stream());
});

// Scripts JS
gulp.task('build:js', function() {
  return gulp.src(moduleJS)
    .pipe(plumber({
      errorHandler: notify.onError(function (err) {
        return {title: 'javaScript', message: err.message}
      })
    }))
    .pipe(gulpIf(isDevelopment, sourcemaps.init()))
    .pipe(concat('main.min.js'))
    .pipe(uglify())
    .pipe(gulpIf(isDevelopment, sourcemaps.write('maps')))
    .pipe(gulp.dest('dist/js'))
});

/* -------- Объединение всех подключаемых плагинов в один файл -------- */
gulp.task('vendor:js', function () {
  return gulp
    .src(vendorJS)
    .pipe(concat('vendor.min.js'))
    .pipe(gulp.dest('dist/js'));
});

/* -------- Объединение всех стилей подключаемых плагинов в один файл -------- */
gulp.task('vendor:css', function () {
  return gulp
    .src(vendorCss)
    .pipe(concat('vendor.min.css'))
    .pipe(minifycss())
    .pipe(gulp.dest('dist/css/'));
});

gulp.task('watch', function() {
	gulp.watch('app/pages/**/*.*', ['html']);
	gulp.watch('app/scss/**/*.*', ['styles']);
	gulp.watch('app/img/**/*.*', ['images']);
	gulp.watch('app/js/**/*.js', ['build:js']);
});

gulp.task('default', ['browser-sync', 'watch']);

// Очистка папки dist
gulp.task('clean', function () {
  return del(['dist'], {force: true}).then(paths => {
    console.log('Deleted files and folders: in dist');
  });
});

// Выполнить билд проекта
gulp.task('build', function (callback) {
  runSequence(['clean'], [
    'html',
    'styles',
    'images',
    'build:js',
    'vendor:js',
    'vendor:css',
    'fonts'
  ], callback);
});