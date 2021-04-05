'use strict'

import { app, protocol, BrowserWindow, ipcMain, globalShortcut, Menu, remote } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib';

import log from 'electron-log';
const isDevelopment = process.env.NODE_ENV !== 'production';
import path from 'path';
import AppUpdate from './update.js';
import winConfig from './winConfig.js';
import localConfig from './localConfig'
import os from "os";
import fs from "fs";

export default class Background extends winConfig {
  constructor() {
    super();
    this.win = null;
    this.pathStr = ''; //安装目录路径
    this.locPath = ''; //本机软件路径
    this.animationWin = '';
    // 注册自定义本地请求协议
    protocol.registerSchemesAsPrivileged([
      { scheme: 'app', privileges: { secure: true, standard: true } }
    ])
    // 创建窗口


    // app.on('activate', () => {
    //   if (this.win === null) {
    //     this.createWindow();
    //   }
    // })

    app.on('ready', async () => {

      log.debug('ready')
      

      if (app.getAppPath().indexOf('lyfz-erp') >= 0) {
        this.pathStr = app.getAppPath().slice(0, app.getAppPath().indexOf('lyfz-erp'));
      } else {
        this.pathStr = app.getAppPath().slice(0, app.getAppPath().indexOf('lyfz-erp'));
      }

      //本地路径：
      
      log.debug(`安装目录路径：${app.getPath('appData')}`)

      this.locPath = `${app.getPath('appData')}/lyfz-erp/actionJsonFile`
      //创建json文件夹
      this.createFolder(this.locPath)

      // 本地文件协议
      protocol.interceptFileProtocol('file',(request, callback) => {
            const url = request.url.substr(6)
            log.debug(`本地文件协议:${this.pathStr}/${url}`)
            callback({ path: path.normalize(`${this.pathStr}/${url}`) })
            // callback(fs.createReadStream(path.normalize(`${__dirname}/${url}`)))
          },
          error => {
            console.log(error)
          },
      )




      log.debug(`本地路径：${this.pathStr}`)

      this.loadingWin();
      this.createWindow();
      // 调用本地生成json数据类
      const local = new localConfig(this.pathStr,this.win,this.locPath);




    })

    // Quit when all windows are closed.
    app.on('window-all-closed', () => {
      // On macOS it is common for applications and their menu bar
      // to stay active until the user quits explicitly with Cmd + Q
      //判断杀死子进程
      if (os.type() == 'Darwin') {
        //let parthStr = `${this.pathStr}/lyfz-erp.app/Contents/killChilder`
        let parthStr = `${this.locPath}/killChilder`
        //创建文件夹
        this.createFolder(parthStr).then(res=>{
          fs.writeFile(`${res}/killChilder.json`, JSON.stringify('true'), (err) => {
            if (err) {
                console.log(err)
            }
            app.quit()
          })
        })

      }else{
        app.quit()
      }
    });

    // 获取是否全屏
    ipcMain.on('isFullScreen' , (e) => {
      e.returnValue = this.win.isFullScreen() || this.win.isSimpleFullScreen();
    });
    // 设置全屏/不全屏
    ipcMain.on('setFullScreen' , (e, n) => {
      if (n === 1) {
        this.win.setFullScreen(true);
        this.win.setSimpleFullScreen(true);
      } else {
        this.win.setFullScreen(false);
        this.win.setSimpleFullScreen(false);
      }
    });




    // 渲染进程的一些配置
    ipcMain.on('config', (e, data) => {

    });

    ipcMain.on('reload', () => {
      app.relaunch();
      app.exit(0);
    })

    //接受前端触发更新
    ipcMain.on('OnClickRefresh', (e,data) => {
      if(data == '1'){
        this.win.webContents.send('location-replace');
      }else{
        this.win.webContents.session.clearStorageData();
        this.win.reload();
      }
    })
    
  }
  createWindow() {
    Menu.setApplicationMenu(null);
    // Create the browser window.
    let localPathFileJs = ''
    if (os.type() == 'Windows_NT') {
      localPathFileJs = process.cwd()
    }
    if (os.type() == 'Darwin') {
      localPathFileJs = `${this.pathStr}/lyfz-erp.app/Contents`
    }
    this.win = new BrowserWindow({
      minWidth: 1000,
      minHeight: 800,
      width: 1600,
      height: 1000,
      fullscreen: false,
      show: false, // 先隐藏
      webPreferences: {
        // Use pluginOptions.nodeIntegration, leave this alone
        // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
        nodeIntegration: true,
        nodeIntegrationInWorker: true,
        webSecurity: false,
        preload: localPathFileJs+'/state/jsConfig.js'
      },
    })

    const clearObj = {
      storages: ['appcache', 'filesystem', 'indexdb', 'shadercache', 'websql', 'serviceworkers', 'cachestorage'],
    };

    // 注册打开调试快捷键
    globalShortcut.register('ctrl+d+b+n', () => {
      this.win.webContents.openDevTools();
    })

    // 注册刷新
    globalShortcut.register('ctrl+F5', () => {
      this.win.webContents.session.clearStorageData();
      this.win.reload();
    })
    // 清除缓存
    this.win.webContents.session.clearStorageData(clearObj);

    // 全屏
    globalShortcut.register('ctrl+F10', () => {
      if (this.win.isFullScreen() || this.win.isSimpleFullScreen()) {
        this.win.setFullScreen(false);
        this.win.setSimpleFullScreen(false);
      } else {
        this.win.setFullScreen(true);
        this.win.setSimpleFullScreen(true);
      }
    })


    // 退出全屏
    globalShortcut.register('ctrl+ESC', () => {
      if (this.win.isFullScreen() || this.win.isSimpleFullScreen()) {
        this.win.setFullScreen(false);
        this.win.setSimpleFullScreen(false);
      } else {
        // win.webContents.send('esc');
      }

    })


    if (process.env.BABEL_ENV === 'development') {
      //this.win.loadURL(`https://login.27yn.cn/?service=http%3A%2F%2Fi.27yn.cn&app=qyzx`);
      this.win.loadURL(`http://192.168.5.38:8800/home?ccId=00000000737f5b5a01737fbfce600000&ticket=69e7j07TqJ7u5V33NQ4YT8abS19mB2s10y9kX5z597v6H9380PG61fK3DWE9ukiM`);
      //this.win.loadURL(`http://web.erp.27yn.cn/home?ccId=00000000737f5b5a01737fbfce600000&ticket=6G9R0f4P05g7c3Qw5PKz839L8u68L8Y0D7J96J5K6Zbe8n7G1OBS23o2Xr4QW6oC`);
      this.win.webContents.openDevTools();
    } else {
      //this.win.loadURL(`https://login.27yn.cn/?service=http%3A%2F%2Fi.27yn.cn&app=qyzx`);
      this.win.loadURL('https://login.lyfz.net/?service=http%3A%2F%2Fi.lyfz.net&app=qyzx');
      // win.loadURL('app://./index.html')
    }

    this.win.on('closed', () => {
      this.win = null
    })

    this.win.on('ready-to-show', () => {
      log.debug('隐藏加载窗口，显示主窗口')
      if (this.animationWin) {
        this.animationWin.destroy();
        this.animationWin = null;
      }
      this.win.show() // 初始化后再显示
    })
    
    // 调用自动更新
    const feedUrl = "http://update.lyfz.net:8200/update/";
    const appupdate = new AppUpdate(this.win, feedUrl,this.pathStr);
    appupdate.fileUpdataState()

    
  }
  /**
   * 创建一个启动窗口
   */
  loadingWin() {
    this.animationWin = new BrowserWindow({
      width: 800,
      height: 800,
      frame: false,
      transparent: true,
      webPreferences: {
        nodeIntegration: true
      }
    })

    log.debug(`当前系统类型${os.type}`)
    if (os.type() == 'Windows_NT') {
      // this.animationWin.loadURL(`file://loading/index.html`)
      this.animationWin.loadURL(`file://lyfz-erp/loading/index.html`);
    }

    if (os.type() == 'Darwin') {
      this.animationWin.loadURL(`file://lyfz-erp.app/Contents/loading/index.html`)
    }

    // animationWin.webContents.openDevTools();
    this.animationWin.setMenu(null)
  }
}

log.debug('启动')
new Background()