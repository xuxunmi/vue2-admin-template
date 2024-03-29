const webpack = require('webpack');
const path = require('path');
// 压缩插件
const CompressionWebpackPlugin = require('compression-webpack-plugin');
// 代码压缩
const UglifyJsWebpackPlugin = require('uglifyjs-webpack-plugin');
// 复制文件/文件夹插件
// const CopyWebpackPlugin = require('copy-webpack-plugin');

// 开启中间缓存
const HardSourceWebpackPlugin = require('hard-source-webpack-plugin');

const resolve = dir => {
    return path.join(__dirname, dir);
};

module.exports = {
    // 静态文件基本路径
    publicPath: './',
    // 构建输出文件目录
    outputDir: 'dist',
    // 放置静态资源的目录
    assetsDir: './vue-static',
    // html输出路径，Default: 'index.html'
    indexPath: 'index.html',
    // 文件哈希名
    filenameHashing: false,
    // 保存时是否使用`eslint-loader`进行检查
    lintOnSave: true,
    // 生产环境是否要生成 sourceMap
    productionSourceMap: false,
    // webpack-dev-server 相关配置
    devServer: {
        https: false,
        open: false, // 是否自动启动浏览器
        host: '0.0.0.0', // 允许任意电脑ip访问
        port: 9527,
        proxy: {
            '/api': {
                // 请求前添加的路径，会代替target网址请求
                target: 'http://192.168.11.46:8085/', // 代理服务器地址
                changeOrigin: true, // 是否跨域
                ws: true, // 是否启用websockets
                secure: false, // 使用的是http协议设为false，https协议设为true
                pathRewrite: {
                    // 路径重写
                    '^/api': '/'
                }
            }
        }
    },
    css: {
        loaderOptions: {
            sass: {
                // 配置全局样式变量
                implementation: require('sass'),
                additionalData: `@import "@/styles/variables.scss";`
            }
        }
    },
    chainWebpack: config => {
        // 路径重命名
        config.resolve.alias
            .set('@', resolve('src'))
            .set('@components', resolve('src/components'))
            .set('@views', resolve('src/views'))
            .set('@assets', resolve('src/assets'))
            .set('@router', resolve('src/router'))
            .set('@store', resolve('src/store'))
            .set('@api', resolve('src/api'));

        // 生产环境配置
        if (process.env.NODE_ENV === 'production') {
            // 生产环境下，删除console和debugger
            config.optimization
                .minimize(true)
                .minimizer('terser')
                .tap(args => {
                    const { terserOptions } = args[0];
                    terserOptions.compress.drop_console = true;
                    terserOptions.compress.drop_debugger = true;
                    return args;
                });

            config.module
                .rule('images')
                .test(/\.(png|jpe?g|jpg|gif)(\?.*)?$/)
                .use('image-webpack-loader')
                .loader('image-webpack-loader')
                .options({
                    // 此处为ture的时候不会启用压缩处理,目的是为了开发模式下调试速度更快
                    disable: process.env.NODE_ENV == 'development' ? true : false
                })
                .end();

            // 开启js\css压缩
            config.plugin('compressionPlugin').use(
                new CompressionWebpackPlugin({
                    filename: '[path][base].gz', // 压缩后文件名
                    algorithm: 'gzip', //开启gzip
                    test: /\.(js|css|less|scss)$/, // 匹配文件名
                    threshold: 10240, // 对超过10k的数据压缩
                    minRatio: 0.8, // 只有压缩率比这个值小的资源才会被处理
                    deleteOriginalAssets: false // 不删除源文件
                })
            );

            config.optimization.splitChunks({
                cacheGroups: {
                    vendor: {
                        name: 'chunk-libs',
                        chunks: 'all',
                        test: /[\\/]node_modules[\\/]/,
                        priority: 100
                    },
                    common: {
                        name: 'common',
                        chunks: 'all',
                        minSize: 1,
                        minChunks: 2, // 表示会把使用2次及以上的包抽离出来，放进公共依赖文件
                        priority: 1
                    },
                    styles: {
                        name: 'styles',
                        test: /\.(sa|sc|c|le)ss$/,
                        chunks: 'all',
                        enforce: true
                    }
                }
            });

            config
                .plugin('webpackOptimize')
                .use(
                    webpack.optimize.LimitChunkCountPlugin,
                    // 限制生成的代码块(chunks)的数量
                    [{ maxChunks: 10 }]
                )
                .use(
                    webpack.optimize.MinChunkSizePlugin,
                    // 指定代码块的最小字节数
                    [{ minChunkSize: 50000 }]
                );
        }

        // 解决postcss-px-to-viewport插件无法将行内样式转vw问题
        config.module
            .rule('vue')
            .test(/\.vue$/)
            .use('style-vw-loader')
            .loader('style-vw-loader')
            .options({
                unitToConvert: 'px', // 要转化的单位
                viewportWidth: 1920, // 视窗的宽度，对应的是我们设计稿的宽度，一般是750
                unitPrecision: 5, // 指定px转换为视窗单位指的小数位数
                viewportUnit: 'vw', // 指定需要转换成的视窗单位
                fontViewportUnit: 'vw',
                minPixelValue: 1, // 小于或等于1px不转换为视窗单位，可以设置想要的值
                mediaQuery: false, // 允许在媒体查询中转化px
                selectorBlackList: [] // 指定不转换为视窗单位的类，可自定义，可无限添加，建议定一至两个通用类
            })
            .end();

        // 编译vxe-table包里的es6代码，解决IE11兼容问题
        config.module
            .rule('vxe')
            .test(/\.js$/)
            .include.add(resolve('node_modules/vxe-table'))
            .add(resolve('node_modules/vxe-table-plugin-antd'))
            .end()
            .use()
            .loader('babel-loader')
            .options({
                cacheDirectory: true // 开启缓存
            })
            .end();
        // 删除需要预先加载(当前页面)的资源，当需要这些资源的时候，页面会自动加载
        config.plugins.delete('preload');
        // 删除需要预先获取(将来的页面)的资源
        config.plugins.delete('prefetch');
    },
    configureWebpack: {
        // 重定义build后js输出路径
        // output: {
        //     filename: 'Windchill/netmarkets/javascript/technologyNotice/[name].js',
        //     chunkFilename: 'Windchill/netmarkets/javascript/technologyNotice/[name].js'
        // },
        plugins: [
            // 复制文件夹
            // new CopyWebpackPlugin({
            //     patterns: [
            //         {
            //             from: resolve('public/tinymce'),
            //             to: 'Windchill/netmarkets/javascript/tinymce'
            //             // ignore: publicCopyIgnore
            //         }
            //     ]
            // })
            new HardSourceWebpackPlugin()
        ],
        optimization: {
            minimizer: [
                new UglifyJsWebpackPlugin({
                    uglifyOptions: {
                        output: {
                            comments: false // 删除注释
                        }
                    },
                    sourceMap: false,
                    parallel: true
                })
            ]
        }
    }
};
