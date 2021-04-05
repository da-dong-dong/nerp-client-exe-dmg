/**
 * Created by ludetao on 2019-02-27.
 */
const path = require('path')
const os = require('os');
function resolve(dir) {
  return path.join(__dirname, dir)
}
const fs = require('fs');




function getIPAdress() {
  let interfaces = os.networkInterfaces();
  for (let devName in interfaces) {
    let iface = interfaces[devName];
    for (let i = 0; i < iface.length; i++) {
      let alias = iface[i];
      if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
        return alias.address;
      }
    }
  }
}



module.exports = {
  outputDir: 'dist',
  publicPath: '/',
  productionSourceMap: false,
  css: {
    loaderOptions: {
      // 给 sass-loader 传递选项
      less: {
        // @/ 是 src/ 的别名
        // 所以这里假设你有 `src/variables.scss` 这个文件
        data: `@import "@/less/**";`
      }
    }
  },
  chainWebpack: config => {
    config.resolve.alias
      .set('@', resolve('src')) // key,value自行定义，比如.set('@@', resolve('src/components'))
      .set('_c', resolve('src/components')),
    config.module.rule('images')
      .test(/\.(png|jpe?g|JPG|gif|svg)(\?.*)?$/)
      .use('url-loader')
      .loader('url-loader')
  },
  pluginOptions: {
    electronBuilder: {
      builderOptions: {
        productName: 'lyfz-erp',
        win: {
          icon: './public/icon.ico',
          requestedExecutionLevel: 'highestAvailable'
        },
        mac: {
          icon: './public/app.png'
        },
        nsis: {
          oneClick: false,
          allowToChangeInstallationDirectory: true,
          shortcutName: '利亚方舟影楼ERP-${version}'
        },
        publish:[
          {
            provider: 'generic',
            url: 'http://update.lyfz.net:8200/update/'
          }
        ],
        files: [
          "**/*"
        ],
        extraFiles: [
          {
            from: "./public/state",
            to: "state",
            filter: ["**/*"]
          },
          {
            from: "./public/loading",
            to: "loading",
            filter: ["**/*"]
          },
          {
            from: "./public/cloudDownload",
            to: "cloudDownload",
            filter: ["**/*"]
          }
        ]
      }
    }
  },
  filenameHashing: process.env.NODE_ENV === 'test' ? false : true,
  devServer: {
    open: true,
    host: getIPAdress(),
    // host: 'http://192.168.1.3:8081',
    port: 8110,
    https: false,
    hotOnly: false,
    disableHostCheck: true,
    before: app => {
    },
    proxy: {
      '/api': {
        target: 'https://api.27yn.cn/', //对应服务器地址
        changeOrigin: true, //允许跨域
        ws: true,
        pathRewrite: {
          '^/api': ''
        }
      }
    }
  },
  chainWebpack(config) {
    if (process.env.NODE_ENV === 'test') {
      config.resolve.alias
        .set('style', resolve('public/style'))
        .set('api', resolve('src/api'))
        .set('tools', resolve('src/tools'))
        .set('components', resolve('src/components'))
        .set('echarts', resolve('src/echarts'))
        .set('echarts', resolve('node_modules/echarts'))
      config.resolve.alias
      config.output.chunkFilename(`js/[name].[chunkhash:8].js`)
      config.output.filename('[name].[hash].js').end();
    }
  }
}
