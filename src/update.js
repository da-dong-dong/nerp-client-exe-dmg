import {autoUpdater} from 'electron-updater';
import log from 'electron-log';
import {ipcMain,BrowserWindow} from 'electron';
import fs from 'fs';
import path from 'path';
import os from "os";
import { exec, spawn ,execFile} from 'child_process';

export default class AppUpdate {
  constructor (win, feedUrl,pathStr) {
    this.mainWindow = win;
    this.feedUrl = feedUrl;
    this.pathStr = pathStr
    this.upDateWindow = null

    //设置更新包的地址
    autoUpdater.setFeedURL(this.feedUrl);
    autoUpdater.autoDownload = false;
    log.transports.file.level = "debug";
    // autoUpdater.checkForUpdatesAndNotify((e, o) => {
    //   console.log(e);
    //   console.log(o);
    // })
    autoUpdater.logger  = log;
    this.delFile();


    //监听升级失败事件
    autoUpdater.on('error',  (error) => {
      autoUpdater.logger.debug(error);
      this.sendUpdateMessage({
        cmd: 'error',
        message: error
      })
    });
    //监听开始检测更新事件
    autoUpdater.on('checking-for-update',  (message) => {
      this.sendUpdateMessage({
        cmd: 'checking-for-update',
        message: message
      })
    });
    //监听发现可用更新事件
    autoUpdater.on('update-available',  (message) => {
      console.log(1111);
      this.sendUpdateMessage({
        cmd: 'update-available',
        message: message
      })
      autoUpdater.downloadUpdate();
      this.upDateWin()
     
    });
    //监听没有可用更新事件
    autoUpdater.on('update-not-available',  (message) => {
      console.log(333);
      this.sendUpdateMessage({
        cmd: 'update-not-available',
        message: message
      })
      //五秒启动客户端
      log.debug('启动吗？')
      this.fiveStartExec()
    });

    // 更新下载进度事件
    autoUpdater.on('download-progress',  (progressObj) => {
      console.log(444);
      this.sendUpdateMessage({
        cmd: 'download-progress',
        message: progressObj
      })
       //发送进度条
       this.upDateWindow.webContents.send('update-app', {
        cmd: 'download-progress',
        message: progressObj
      })
    });
    //监听下载完成事件
    autoUpdater.on('update-downloaded',  (event, releaseNotes, releaseName, releaseDate, updateUrl) => {
      this.sendUpdateMessage({
        cmd: 'update-downloaded',
        message: {
          releaseNotes,
          releaseName,
          releaseDate,
          updateUrl
        }
      })
      //退出并安装更新包
      autoUpdater.quitAndInstall();
    });

    //接收渲染进程消息，开始检查更新
    ipcMain.on("checkForUpdate", (e, arg) => {
      //执行自动更新检查
      autoUpdater.checkForUpdates();
    })


    ipcMain.on("start-update", (e, arg) => {
      //执行自动更新检查
      autoUpdater.downloadUpdate();
    })


  }

  /**
   * 直接触发更新
   */
  fileUpdataState(){
    autoUpdater.checkForUpdates();
  }

  /**
   * 五秒后启动下载器
   * 
   */
    fiveStartExec(){
      setTimeout(() => {
          this.startExec()
      }, 5000);
  }

  /**
   * 启动下载器
   * 
   */
  startExec(){
    let execPath = '';
    console.log(os.type())
    if (os.type() == 'Windows_NT') {
        execPath = `${this.pathStr}/lyfz-erp/cloudDownload/lyfz-erp-cloud-download.exe`;
        //判断开发环境 兼容
        if(process.env.NODE_ENV == 'production'){
            execFile(execPath, (err, data) => {
                if(err){
                    log.debug(err);
                    return;
                }
            });
        }else{
            exec(execPath, (err, data) => {
                if(err){
                    log.debug(err);
                    return;
                }
            });
        }
    }
    if (os.type() == 'Darwin') {
        execPath = `${this.pathStr}/lyfz-erp.app/Contents/cloudDownload/lyfz-erp-cloud-download.app`;
        //execPath = `${this.pathStr}/cloudDownload/lyfz-erp-cloud-download.app`;
        spawn('open', [execPath], {detached:false})
    }
  }
  /**
   * 删除本地已下载的文件
   */
  delFile() {
    let updaterCacheDirName = 'lyfz-erp-updater';
    const updatePendingPath = path.join(autoUpdater.app.baseCachePath, updaterCacheDirName, 'pending');
    log.debug(updatePendingPath)
    if (fs.existsSync(updatePendingPath)) {
      let files = fs.readdirSync(updatePendingPath);
      for (let i = 0; i < files.length; i++) {
        try {
          fs.unlinkSync(`${updatePendingPath}/${files[i]}`)
        } catch (e) {
          log.debug(e);
        }
      }
    } else {
      fs.mkdir(`${updatePendingPath}`, { recursive: true }, (err) => {
        if (err) {
          log.debug(err);
        }
      });
    }
    // try {
    //   fs.emptyDir(updatePendingPath)
    // } catch (e) {
    //   console.log(e);
    // }
  }
  //给渲染进程发送消息
  sendUpdateMessage(text) {
    console.log(text);
    this.mainWindow.webContents.send('update-app', text)
  }

  /**
   * 创建一个启动窗口
   */
  upDateWin() {
    this.upDateWindow = new BrowserWindow({
      width: 300,
      height: 300,
      frame: false,
      webPreferences: {
        nodeIntegration: true
      }
    })

    log.debug(`路径-----${this.pathStr}`)
    if (os.type() == 'Windows_NT') {
      //this.upDateWindow.loadURL(`file://loading/update.html`)
      this.upDateWindow.loadURL(`file://lyfz-erp/loading/update.html`);
    }

    if (os.type() == 'Darwin') {
      this.upDateWindow.loadURL(`file://lyfz-erp.app/Contents/loading/update.html`)
    }

    //this.upDateWindow.webContents.openDevTools();
    this.upDateWindow.setMenu(null)
    //置顶  
    this.upDateWindow.setAlwaysOnTop(true)
    this.upDateWindow.on('ready-to-show', () => {
      
      this.upDateWindow.show() // 初始化后再显示
    })
  }

}
