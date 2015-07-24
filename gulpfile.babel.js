// generated on 2015-07-21 using generator-gulp-webapp 1.0.3
import gulp from 'gulp';
import gulpLoadPlugins from 'gulp-load-plugins';
import browserSync from 'browser-sync';
import shell from 'shelljs';
import del from 'del';
import {stream as wiredep} from 'wiredep';

var cdnizer = require('gulp-cdnizer');
const $ = gulpLoadPlugins();
const reload = browserSync.reload;

const appdir = 'app';
const staticdir = appdir + '/flask_blog/static';
const templatedir = appdir + '/flask_blog/templates';
const stylesdir = staticdir + '/styles';
const scriptsdir = staticdir + '/scripts';

const distapp = 'dist/flask_blog';
const diststatic = distapp + '/static';
const disttemplates = distapp + '/templates';


function startFlask() {
  shell.exec(
    'cd ' + appdir + '; test -f twistd.pid || ' +
    'FLASK_BLOG_SETTINGS="../configurations/empty.py" twistd web --port 5005 --wsgi flask_blog.app',
    {silent: false});
}

function stopFlask() {
  shell.exec(
    'cd ' + appdir + '; test -f twistd.pid && kill $(cat twistd.pid) || true;');
}

gulp.task('flask', [], function() {
  startFlask();
});

gulp.task('flask-stop', [], function() {
  stopFlask();
});

gulp.task('flask-restart', ['flask-stop', 'flask']);


gulp.task('styles', () => {
  return gulp.src(stylesdir + '/*.scss')
    .pipe($.plumber())
    .pipe($.sourcemaps.init())
    .pipe($.sass.sync({
      outputStyle: 'expanded',
      precision: 10,
      includePaths: ['.']
    }).on('error', $.sass.logError))
    .pipe($.autoprefixer({browsers: ['last 1 version']}))
    .pipe($.sourcemaps.write())
    .pipe(gulp.dest('.tmp/static_gen/styles'))
    .pipe(reload({stream: true}));
});

function lint(files, options) {
  return () => {
    return gulp.src(files)
      .pipe(reload({stream: true, once: true}))
      .pipe($.eslint(options))
      .pipe($.eslint.format())
      .pipe($.if(!browserSync.active, $.eslint.failAfterError()));
  };
}
const testLintOptions = {
  env: {
    mocha: true
  }
};

var foundationCdnFiles = [];
var foundationLibs = ['accordion', 'topbar', 'alert'];
for (var i in foundationLibs) {
  var lib = foundationLibs[i];
  foundationCdnFiles.push(
    {
      file: '**/foundation/js/foundation/foundation.' + lib + '.js',
      package: 'foundation',
      cdn: '//cdnjs.cloudflare.com/ajax/libs/foundation/${ version }/js/foundation.' + lib + '.min.js'
    }
  );
}

gulp.task('lint', lint(scriptsdir + '/**/*.js'));
gulp.task('lint:test', lint('test/spec/**/*.js', testLintOptions));

gulp.task('html', ['styles'], () => {
  const assets = $.useref.assets({searchPath: ['.tmp', templatedir, '.']});

  return gulp.src(templatedir + '/**/*.html')
    .pipe(assets)
    .pipe($.if('*.js', $.uglify()))
    .pipe($.if('*.css', $.minifyCss({compatibility: '*'})))
    .pipe(gulp.dest(distapp))
    .pipe(assets.restore())
    .pipe($.useref())
    .pipe($.if('*.html', $.minifyHtml({conditionals: true, loose: true})))
    .pipe($.if('*.html',
        cdnizer({
            bowerComponents: './bower_components',
            files: [
              {
                file: '**/modernizr/modernizr.js',
                package: 'modernizr',
                cdn: '//cdnjs.cloudflare.com/ajax/libs/modernizr/${ version }/modernizr.min.js'
              },
              {
                file: '**/fastclick/lib/fastclick.js',
                package: 'fastclick',
                cdn: '//cdnjs.cloudflare.com/ajax/libs/fastclick/${ version }/fastclick.min.js'
              },
              {
                file: '**/jquery/dist/jquery.js',
                package: 'jquery',
                cdn: '//cdnjs.cloudflare.com/ajax/libs/jquery/${ version }/jquery.min.js'
              },
              {
                file: '**/foundation/js/foundation.js',
                package: 'foundation',
                cdn: '//cdnjs.cloudflare.com/ajax/libs/foundation/${ version }/js/foundation.min.js'
              },
              {
                file: '**/slick.js/slick/slick.js',
                package: 'slick.js',
                cdn: '//cdnjs.cloudflare.com/ajax/libs/slick-carousel/${ version }/slick.min.js'
              },
              {
                file: '**/slick.js/slick/slick.css',
                package: 'slick.js',
                cdn: '//cdnjs.cloudflare.com/ajax/libs/slick-carousel/${ version }/slick.min.css'
              }

            ].concat(foundationCdnFiles)
        })))
    .pipe($.if('*.html', gulp.dest(disttemplates)));
});

gulp.task('images', () => {
  return gulp.src(staticdir + '/images/**/*')
    .pipe($.if($.if.isFile, $.cache($.imagemin({
      progressive: true,
      interlaced: true,
      // don't remove IDs from SVGs, they are often used
      // as hooks for embedding and styling
      svgoPlugins: [{cleanupIDs: false}]
    }))
    .on('error', function (err) {
      console.log(err);
      this.end();
    })))
    .pipe(gulp.dest(diststatic + '/images'));
});

gulp.task('fonts', () => {
  return gulp.src(require('main-bower-files')({
    filter: '**/*.{eot,svg,ttf,woff,woff2}'
  }).concat(staticdir + '/fonts/**/*'))
    .pipe(gulp.dest('.tmp/static_gen/fonts'))
    .pipe(gulp.dest(diststatic + '/fonts'));
});

gulp.task('extras', () => {
  return gulp.src([
    appdir + '/*.*',
    '!app/*.html'
  ], {
    dot: true
  }).pipe(gulp.dest('dist'));
});

gulp.task('clean', del.bind(null, ['.tmp', 'dist']));

gulp.task('serve', ['flask', 'styles', 'fonts'], () => {
  browserSync({
    notify: false,
    ui: {
      port: 9001,
      weinre: {
        port: 9090
      }
    },
    scrollProportionally: true,
    port: 9000,
    proxy: 'localhost:5005'
/*    server: {
      baseDir: ['.tmp', 'app'],
      routes: {
        '/bower_components': 'bower_components'
      }
    } */
  });

  gulp.watch([
    templatedir + '/*.html',
    scriptsdir + '/**/*.js',
    staticdir + '/images/**/*',
    '.tmp/fonts/**/*'
  ]).on('change', reload);

  gulp.watch(stylesdir + '/**/*.scss', ['styles']);
  gulp.watch(staticdir + '/fonts/**/*', ['fonts']);
  gulp.watch('bower.json', ['wiredep', 'fonts']);

  gulp.watch(appdir + '/**/*.py', ['flask-restart']);
});

gulp.task('serve:dist', () => {
  browserSync({
    notify: false,
    port: 9000,
    server: {
      baseDir: ['dist']
    }
  });
});

gulp.task('serve:test', () => {
  browserSync({
    notify: false,
    port: 9000,
    ui: false,
    server: {
      baseDir: 'test',
      routes: {
        '/bower_components': 'bower_components'
      }
    }
  });

  gulp.watch('test/spec/**/*.js').on('change', reload);
  gulp.watch('test/spec/**/*.js', ['lint:test']);
});

// inject bower components
gulp.task('wiredep', () => {
  gulp.src(staticdir + '/styles/*.scss')
    .pipe(wiredep({
      ignorePath: /^(\.\.\/)+/
    }))
    .pipe(gulp.dest(staticdir + '/styles'));

  gulp.src(templatedir + '/**/*.html')
    .pipe(wiredep({
      exclude: ['bootstrap-sass'],
      ignorePath: /^(\.\.\/)*\.\./
    }))
    .pipe(gulp.dest(templatedir));
});

gulp.task('build', ['lint', 'html', 'images', 'fonts', 'extras'], () => {
  return gulp.src('dist/**/*').pipe($.size({title: 'build', gzip: true}));
});

gulp.task('default', ['clean'], () => {
  gulp.start('build');
});
