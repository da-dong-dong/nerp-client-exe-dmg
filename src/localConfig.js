import winConfig from "@/winConfig";
import {sha1} from "@/sha";
import log from 'electron-log';
import {ipcMain,dialog} from 'electron';
import fs from 'fs';
import { exec, spawn ,execFile} from 'child_process';
import url from 'url';
import os from "os";
import { ESRCH } from "constants";
export default class extends winConfig {
    constructor(pathStr,win,locPath) {
        super();
        this.win = win
        this.pathStr = pathStr;
        this.pathOk = this.isPathOk();
        this.locPath = locPath
        // 创建文件夹
        this.createFolder(`${this.locPath}/tasklist`)
        this.createFolder(`${this.locPath}/oneStart`)
        this.createFolder(`${this.locPath}/successFile`)
        //导入原片
        ipcMain.on('ImportOriginalFilm', (e, data) => {
            this.popUpFile(data,1)
        })
        //导出原片
        ipcMain.on('ExportOriginalFilm', (e, data) => {
            this.popOutFolder(data, 2)
        })

        //导入初修片
        ipcMain.on('ImportEarlyRepairFilm', (e, data) => {
            this.popUpFolder(data, 3)
        })

        //导出初修片
        ipcMain.on('ExportEarlyRepairFilm', (e, data) => {
            this.popOutFolder(data, 4)
        })
        //导入选修片
        ipcMain.on('ImportSelectEarlyRepairFilm', (e, data) => {
            this.writeJsonFile(data, 5)
        })
        //导出选修片
        ipcMain.on('ExportSelectEarlyRepairFilm', (e, data) => {
            this.writeJsonFile(data, 6)
        })
        //导入精修片
        ipcMain.on('ImportRefineFilm', (e, data) => {
            this.popUpFolder(data, 7)
        })
        //导出精修片
        ipcMain.on('ExportRefineFilm', (e, data) => {
            this.popOutFolder(data, 8)
        })
        //导入设计片
        ipcMain.on('ImportDesignFilm', (e, data) => {
            this.popUpFolder(data, 9)
        })
        //导出设计片
        ipcMain.on('ExportDesignFilm', (e, data) => {
            this.popOutFolder(data, 10)
        })
        //导入微视频
        ipcMain.on('ImportMicroVideoFilm', (e, data) => {
            this.writeJsonFile(data, 11)
        })
        //导出微视频
        ipcMain.on('ExportMicroVideoFilm', (e, data) => {
            this.writeJsonFile(data, 12)
        })
        //导出已选片
        ipcMain.on('ExportSelectFilm', (e, data) => {
            this.popOutFolder(data, 13)
        })
        //导出样片
        ipcMain.on('ExportSample', (e, data) => {
            this.popOutFolderSample(data, 13)
        })



        // 调用本地云储存上传下载exe/app
        ipcMain.on('run-exec', (e, data) => {
            log.debug('调用云储存上传下载工具');
            this.startExec()

        })

        //定时器获取文件
        this.setTimeFile()

        // //五秒启动客户端
        // this.fiveStartExec()
    }

     /**
     * 弹出文件选择器
     * @param {data}  erp端传过来的图片类型
     * @param {type} 类型 1导入原片 2导出原片 3导入初修片 4导出初修片 5导入选修片 6导出选修片 7导入精修片 8导出精修片 9导入设计片 10导出设计片 11导入微视频 12导出微视频 13导出已选片
     */
    popUpFile(data,type){
        let obj = JSON.parse(data);
        dialog.showOpenDialog({
            filters: [
                { name: 'Images', extensions: ['jpg', 'png', 'gif','webp','bmp','svg',"nef", "rw2", "dng", "raw", "cr2", "arw", "sr2", "orf", "pef", "raf", "x3f"] }],
                properties: ['openFile', 'multiSelections'] // 可以选择文件且可以多选
            },(files)=> {
            
            if (files){// 如果有选中
                let arrs = []
                files.map(item=>{
                    arrs.push({'filepath':item,'isOK':false})
                })
                obj['fileImg'] = arrs;
                this.writeJsonFile(obj,type)
            }
            
        })
    }
    /**
     * 弹出文件夹选择器 (上传)
     * @param {data}  erp端传过来的图片类型
     * @param {type} 类型 1导入原片 2导出原片 3导入初修片 4导出初修片 5导入选修片 6导出选修片 7导入精修片 8导出精修片 9导入设计片 10导出设计片 11导入微视频 12导出微视频 13导出已选片
     */
    popUpFolder(data,type){
        let obj = JSON.parse(data);
         dialog.showOpenDialog({
            properties: ['openFile','openDirectory'] // 可以选择文件且可以多选
            },(files)=> {
            
            if (files){// 如果有选中
                let filePathName = files[0];
                let arrs = [];
                this.getDirListFile(filePathName,arrs)
                
                console.log('递归文件数组',arrs)
                obj['fileImg'] = arrs;
                obj['filePathName'] = filePathName
                this.writeJsonFile(obj,type)
            }
            
        })
    }

    /**
     * 弹出文件夹选择器 (导出)
     * @param {data}  erp端传过来的图片类型
     * @param {type} 类型 1导入原片 2导出原片 3导入初修片 4导出初修片 5导入选修片 6导出选修片 7导入精修片 8导出精修片 9导入设计片 10导出设计片 11导入微视频 12导出微视频 13导出已选片
     */
    popOutFolder(data,type){
        let obj = JSON.parse(data);
         dialog.showOpenDialog({
            properties: ['openFile','openDirectory'] // 可以选择目录
            },(files)=> {
            
            if (files){// 如果有选中
                let filePathName = files[0];
                obj['filePathName'] = filePathName
                obj['out'] = '导出'
                this.writeJsonFile(obj,type)
            }
            
        })
    }

    /**
     * 弹出文件夹选择器 (导出样片)直接写入文件
     * @param {data}  erp端传过来的图片类型
     * @param {type} 类型 1导入原片 2导出原片 3导入初修片 4导出初修片 5导入选修片 6导出选修片 7导入精修片 8导出精修片 9导入设计片 10导出设计片 11导入微视频 12导出微视频 13导出已选片
     */
     popOutFolderSample(data,type){
        let obj = JSON.parse(data);
         dialog.showOpenDialog({
            properties: ['openFile','openDirectory'] // 可以选择目录
            },(files)=> {
            
            if (files){// 如果有选中
                let filePathName = files[0];
                const time = new Date().getTime();
                obj['filePathName'] = filePathName
                obj['out'] = '导出'
                obj['downType'] = type;
                obj['fileID'] = time+'.json';
                obj['httpOK'] = 1;
                fs.writeFile(`${this.locPath}/tasklist/${time}.json`, JSON.stringify(obj), (err) => {
                    if (err) {
                        log.debug(err)
                    }
                })
            }
            
        })
    }

    /**
     * 写入json数据
     * @param {data}  erp端传过来的json数据
     * @param {type} 类型 1导入原片 2导出原片 3导入初修片 4导出初修片 5导入选修片 6导出选修片 7导入精修片 8导出精修片 9导入设计片 10导出设计片 11导入微视频 12导出微视频 13导出已选片
     */
    async writeJsonFile(data, type) {
        let obj = data;
       
        let {ccId,ticket,ImportStoreID} = data;

        this.getImgHttp('base/picture/config/list','get',{"Accept-Language":"zh-CN,zh;q=0.9","ccId":ccId,"ticket":ticket},ImportStoreID).then(res=>{
            let {httpPath,httpOK,serverKey,serverName} = res
            const time = new Date().getTime();
            obj['jsonCreateTime'] = time * 1000;
            obj['downType'] = type;
            obj['httpPath'] = httpPath;//请求地址
            obj['httpOK'] = httpOK;
            obj['serverKey'] = serverKey;
            obj['serverName'] = serverName;
            obj['fileID'] = time+'.json';
            // let pasthOk= '';
            // if (os.type() == 'Windows_NT') {
            //     pasthOk = `${this.pathStr}/lyfz-erp`;
            // }
            // if (os.type() == 'Darwin') {
            //     pasthOk = `${this.pathStr}/lyfz-erp.app/Contents`;
            // }
            
            if(obj.out == '导出'){
                this.getImgContent(obj).then(res=>{
                    let fileImg = res;
                    let arrs = [];
                    fileImg.map(item=>{
                        arrs.push({'filepath':`${obj.httpPath}/fserver/IDownloadFile?keypath=${item}`,'isOK':false})
                    })
                    obj['fileImg'] = [...arrs]
                   
                    if(type == 13){
                        //进行选片
                        this.getImgSelect(obj).then(res=>{
                            let {newImg,make,idImg,makeJson} = res
                            obj['fileImg'] = [...newImg]
                            obj['make'] = make
                            obj['idImg'] = idImg
                            obj['makeJson'] = makeJson;
                            fs.writeFile(`${this.locPath}/tasklist/${time}.json`, JSON.stringify(obj), (err) => {
                                if (err) {
                                    log.debug(err)
                                }
                            })
                        })
                    }else{
                        
                        fs.writeFile(`${this.locPath}/tasklist/${time}.json`, JSON.stringify(obj), (err) => {
                            if (err) {
                                log.debug(err)
                            }
                        })
                    }
                    
                })
            }else{
                
                fs.writeFile(`${this.locPath}/tasklist/${time}.json`, JSON.stringify(obj), (err) => {
                    if (err) {
                        log.debug(err)
                    }
                })
            }
            
        }).catch((error) =>{
            log.debug("error: " + error.message);
          });
        
    }

    /**
     * 获取图片集合 
     * @param {url} 接口地址  
     * @param {method} 请求方式
     * @param {headers} 设置请求头（完整）
     * @param {tableData} obj对象
     */
    getImgContent(tableData){
        return new Promise((resolve,reject)=>{
            let {OrderNumber,SubOrderNumber,ShootingName,ShootingID,ImportType,httpPath,serverKey} = tableData
            let url = httpPath+'/fserver/FindOrderFiles'
            let newData = new Date().getTime()
            let nonce = Math.floor(Math.random(1)*10000)
            let sha1s = sha1(`lyfz.net${newData}${nonce}`)
            let headers ={
                "signature":sha1s,     
                "timestamp":newData,
                "nonce":nonce,
                "app_key":serverKey,
                'Content-Type' : 'multipart/form-data'
            }
            // 判断导出类型
            let imgType = '';
            console.log(tableData.raw)
            if(tableData.raw == false){
                imgType = 'JPG'
            }
            let formData = {
                "OrderNumber":OrderNumber,
                "SubOrderNumber":SubOrderNumber,
                "ShootingName":ShootingName?ShootingName:'',
                "ShootingID":ShootingID?ShootingID:'',
                "ImportType":ImportType,
                "recursive":'',
                "searchPattern":imgType,
                "expimg":'0',
            }
            this.httpRequest(url,'post',headers,formData).then(res=>{
                resolve(res.data)
            }).catch(err=>{
                console.log(err)
            })
        })
    }

    /**
     * 获取图片选片接口
     * @param {url} 接口地址  
     * @param {method} 请求方式
     * @param {headers} 设置请求头（完整）
     * @param {tableData} obj对象
     */
    getImgSelect(tableData){
        return new Promise((resolve,reject)=>{
            let {ItemId,ccId,ticket,fileImg} = tableData;
            let url = `store/order/item/process/choose/find/goodsChooseInfoVo?itemId=${ItemId}`
            let headers = {
                "ccId":ccId,
                "ticket":ticket
            }
            this.httpRequest(url,'get',headers).then(res=>{
                let {completeJson,orderItemGoodsVos} = res.data;
                let JsonImg = JSON.parse(completeJson).productList
                let make = JSON.parse(completeJson).customerInstructions + JSON.parse(completeJson).photoInstructions
                let idImg = {}
                let newImg = [];
                let JsonName = {};// 记录重复名字
                let name = null;//名字
                     console.log(JsonImg,fileImg)
                    for(let j=0;j<JsonImg.length;j++){
                        let arrsn = []
                        // 判断重复名累计
                        if(JsonImg[j].imgIds.length>0){
                            if(JsonName.hasOwnProperty(JsonImg[j].name)){
                                JsonName[JsonImg[j].name].push(1);
                                let numArr = JsonName[JsonImg[j].name]
                                name = JsonImg[j].name + numArr.length
                            } else {
                                name = JsonImg[j].name
                                JsonName[JsonImg[j].name]=[1]
                            }
                        }
                       
                        if(JsonImg[j].p_list.length != 0){
                            let p_list = JsonImg[j].p_list;
                            for(let q=0;q<p_list.length;q++){
                                for(let p=0;p<p_list[q].imgArr.length;p++){
                                    fileImg.map(item=>{
                                        let json = {}
                                        if(item.filepath.includes(p_list[q].imgArr[p].split('.')[0])){
                                            json.filepath =item.filepath
                                            json.isOK = false
                                            json.paths = name +"\\"+'第'+p_list[q].p +"p" + "\\"+ p_list[q].title
                                            newImg.push(json)
                                            //分割数组
                                            let imgLeng = p_list[q].imgArr[p].split('\\')[1];
                                            arrsn.push(imgLeng)
                                        }
                                    })
                                }
                            }
                            
                        }else{
                            
                            for(let k=0;k<JsonImg[j].imgIds.length;k++){
                                
                                // 循环判断索引
                                fileImg.map(item=>{
                                    let json = {}
                                    if(item.filepath.includes(JsonImg[j].imgIds[k].split('.')[0])){
                                        json.filepath = item.filepath
                                        json.isOK = false
                                        json.paths = name
                                        newImg.push(json)
                                        //分割数组
                                        let imgLeng = JsonImg[j].imgIds[k].split('\\')[1];
                                        arrsn.push(imgLeng)
                                    }
                                })
                            }
                        }
                        idImg[JsonImg[j].goodsId] = arrsn
                    }
                let jsonOk = {
                    newImg,make,idImg,
                    makeJson:orderItemGoodsVos
                }
                resolve(jsonOk)
            })
        })
       
    }

     /**
     * 判断http接口，是否请求超时
     * @param {url} 接口地址  
     * @param {method} 请求方式
     * @param {headers} 设置请求头（完整）
     * @param {PhotID} 照片id
     */
    getImgHttp(url,method,headers,PhotID){
        return new Promise((resolve,reject)=>{
            let json ={}
            let _this = this
            this.httpRequest(url,method,headers).then(res=>{
                let key = PhotID
                let dataArr = res.data
                //过滤key值
                let dataOk = dataArr.map(item=>{
                    if(item.shopNo == key){
                        return item
                    }
                })
                //判断内网通不通
                let {serverName,intranetAddress,serverKey,enablePublicAddress,publicAddress} = dataOk[0]
                _this.httpRequest(intranetAddress,'head').then(res=>{
                     //成功
                     if(res=='成功'){
                        json.httpPath = intranetAddress;
                        json.httpOK = 1;
                        json.serverKey = serverKey;
                        json.serverName = serverName;
                        resolve(json);
                     }else{
                         //判断公网是否开启
                         if(!enablePublicAddress){
                             //判断公网通不通
                             _this.httpRequest(publicAddress,'head').then(re=>{
                                 if(re == '成功'){
                                    json.httpPath = publicAddress;
                                    json.httpOK = 1
                                 }else{
                                    json.httpPath = '';
                                    json.httpOK = -1
                                 }
    
                                 json.serverKey = serverKey;
                                 json.serverName = serverName;
                                 resolve(json);
    
                             }).catch((error) =>{
                                log.debug("error: " + error.message);
                              });
                            
                         }else{
                            json.httpPath = '';
                            json.httpOK = -1;
                            json.serverKey = serverKey;
                            json.serverName = serverName;
                            resolve(json);
                         }
                     }
                    
                }).catch((error) =>{
                    log.debug("error: " + error.message);
                  });
            }).catch((error) =>{
                log.debug("error: " + error.message);
              });
        })
       
    }
    
     /**
     * 判断写入文件路径
     * 
     */
    isPathOk(){
        let pasthOk = ''
        if (os.type() == 'Windows_NT') {
            pasthOk = `${this.pathStr}/lyfz-erp`;
        
           
        }
        if (os.type() == 'Darwin') {
            pasthOk = `${this.pathStr}/lyfz-erp.app/Contents`;
            
        }
        return pasthOk
    }
    
     /**
     * 每两秒计算文件个数，通知渲染进程
     * 
     */
    setTimeFile(){
        let parths = this.locPath + '/tasklist'
        setInterval(() => {
            this.getFiles(parths).then(res=>{
                //通知渲染进程
                this.win.webContents.send('file-count', res.length);
            }).catch(err=>{
                console.log(err)
            })
        }, 2000);
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
        //写入文件，判断是否点击打开
        let oneStartPath =   `${this.locPath}/oneStart/ones.json`
        fs.writeFileSync(oneStartPath,'true');
        if (os.type() == 'Windows_NT') {
            execPath = `${this.pathStr}/lyfz-erp/cloudDownload/lyfz-erp-cloud-download.exe`;
            //写入文件，判断是否点击打开
            //let oneStartPath =   this.pathOk + '/oneStart/ones.json'
            //fs.writeFileSync(oneStartPath,'true');
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
            //写入文件，判断是否点击打开
            //let oneStartPath =   this.pathOk + '/oneStart/ones.json'
            //fs.writeFileSync(oneStartPath,'true');
            execPath = `${this.pathStr}/lyfz-erp.app/Contents/cloudDownload/lyfz-erp-cloud-download.app`;
            //execPath = `${this.pathStr}/cloudDownload/lyfz-erp-cloud-download.app`;
            spawn('open', [execPath])
        }
    }
}