// VAR
var	autoprefixer	= require('autoprefixer'),
	browserSync		= require('browser-sync'),
	cssnano			= require('cssnano'),
	gulp			= require('gulp'),
	log				= require('fancy-log'),
	sass			= require('gulp-sass')(require('sass')),
	sourcemaps		= require('gulp-sourcemaps'),
	size			= require('gulp-size'),
	postcss			= require('gulp-postcss'),
	wait			= require('gulp-wait'),
	rename			= require('gulp-rename'),
	svgSprite		= require('gulp-svg-sprite'),
	postcssPresetEnv = require('postcss-preset-env'),
	precss			= require('precss'),
	ftp				= require('vinyl-ftp'),
	minimist		= require('minimist');

var args = minimist(process.argv.slice(2));


// =============================================================================
// Errors Handler
// =============================================================================

var err = {
	errorHandler: function (error) {
		log.error('Error: ' + error.message);
		this.emit('end');
	}
}

// =============================================================================
// SASS to CSS
// =============================================================================

gulp.task('sass', function() {
	return gulp.src('sass/**/*.scss')
		.pipe( wait(100) )
		.pipe( sass({ silenceDeprecations: ['import', 'global-builtin', 'slash-div'] }).on('error', sass.logError) )
		.pipe( gulp.dest('css/') );
});

// =============================================================================
// CSS Enhancement
// =============================================================================

gulp.task('css', function () {
	var plugins = [
		autoprefixer(),
		cssnano()
	];

	return gulp.src('css/style.css')
		.pipe( sourcemaps.init() )
		.pipe( postcss(plugins) )
		.pipe( rename({suffix: '.min', prefix : ''}) )
		.pipe( sourcemaps.write('.') )
		.pipe( gulp.dest('css') )
		.pipe( browserSync.reload({stream: true}) );
});

// =============================================================================
// SVG Sprite
// =============================================================================

gulp.task('sprite', function () {
	return gulp.src('img/svg/*.svg')
		.pipe( svgSprite({
			shape: {
				spacing: {
					padding: 0
				}
			},
			mode: {
				css: {
					dest: "img/",
					layout: "diagonal",
					sprite: '../sprite.svg',
					bust: false,
					render: {
						scss: {
							dest: "../../sass/partials/_sprite-svg.scss",
							template: "sass/tpl/_sprite-tpl-css.scss"
						}
					}
				},

				symbol: {
					dest: "img/",
					layout: "diagonal",
					sprite: '../sprite-inline.svg',
					bust: false,
					render: {
						scss: {
							dest: "../../sass/partials/_sprite-svg-inline.scss",
							template: "sass/tpl/_sprite-tpl-inline.scss"
						}
					}
				}
			},
			variables: {
				mapname: "icons"
			}
		}))
		.pipe(gulp.dest('img/'));
});

// =============================================================================
// BrowserSync
// =============================================================================

gulp.task('browser-sync', function(done) {
	browserSync({
		server: {
			baseDir: "."
		},
		notify: false
	});
	done();
});


// =============================================================================
// Deploy
// =============================================================================

gulp.task('deploy', function() {
	var remotePath = '/';
	var conn = ftp.create({
		host: 'gold.elastictech.org',
		user: args.user,
		password: args.password,
		log: log
	});
	return gulp.src([
		'./**/*.*',
		'!./.*',
		'!./node_modules/**/*.*'
	])
		.pipe(conn.newer(remotePath))
		.pipe(conn.dest(remotePath));
});


// =============================================================================
// Watcher
// =============================================================================

gulp.task('watch', gulp.series(gulp.parallel('sass', 'css', 'browser-sync'), function() {
	gulp.watch('img/sprite.svg');
	gulp.watch('**/*.scss', gulp.series('sass'));
	gulp.watch('css/style.css', gulp.series('css'));
	gulp.watch('img/svg/*.svg', gulp.series('sprite'));
	gulp.watch('js/*.js').on('change', browserSync.reload);
	gulp.watch('*.html').on('change', browserSync.reload);
}));

gulp.task('build', gulp.series('sass', 'css', 'sprite'));

gulp.task('default', gulp.series('watch'));
