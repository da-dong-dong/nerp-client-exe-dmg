// 公共函数方法
import fs from "fs";
import os from 'os';
import request from 'request'
import FormData  from 'form-data'
import log from 'electron-log';
import path from 'path';
export default class WinConfig {
    constructor() {
        //this.httpRequest('http://10.30.1.8:9200/fserver/IDownloadFile','get',{keypath:'5621002859025268634:\\\\原片\\\\200330011\\\\200330011-01\\\\正常(17)\\\\01.JPG',photoType:1})
        this.baseUrl = this.isDev()
    }
    
     /**
     * 判断开发环境
     */
    //判断是否开发环境
    isDev(){
        let urlHttps = null;
        if(process.env.NODE_ENV == 'production'){
            urlHttps = 'http://napi.lyfz.net/pro/api/'
            //urlHttps = 'http://192.168.5.220/dev/api/'
        }else{
            urlHttps = 'http://192.168.5.220/dev/api/'
        }
        
        return urlHttps
    }
     /**
     * 封装HTTP请求
     * @param {url} 接口地址  
     * @param {method} 请求方式
     * @param {headers} 设置请求头（完整）
     */
   async httpRequest(url,method,headers,formData){
        let requestUrl = this.baseUrl + url;
        if(method == "get"){
            return new Promise((resolve,reject)=>{
                request({
                    url:requestUrl,
                    method:"GET",
                    headers
                },(err,res,body)=>{
                    if(err) return reject(err)
                    let data = JSON.parse(body)
                    resolve(data)
                })
            })
        }else if(method == 'head'){
            return new Promise((resolve,reject)=>{
                let timer = setTimeout(function(){
                    //timeout = true;
                    console.log('失败');
                    resolve('失败')
                    return false
                },1000);
                request({
                    url:url,
                    method:"HEAD",
                    headers
                },(err,res,body)=>{
                    clearTimeout(timer);//取消等待的超时
                    if(err) return reject(err)
                    resolve('成功')
                })
            })
        }else if(method == 'post'){
            return new Promise((resolve,reject)=>{
                request({
                    url:url,
                    method:"POST",
                    headers,
                    formData
                },(err,res,body)=>{
                    if(err) return reject(err)
                    let data = JSON.parse(body)
                    resolve(data)
                })
            })
        }else if(method == 'ge'){
            return new Promise((resolve,reject)=>{
                request({
                    url:url,
                    method:"GET",
                    headers,
                },(err,res,body)=>{
                    if(err) return reject(err)
                    let data = JSON.parse(body)
                    resolve(data)
                })
            })
        }
    }

    /**
     * 获取本地ip地址
     */
    getIPAdress() {
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


    // 删除本地素材文件夹
    deleteall(path) {
        let files = [];
        if (fs.existsSync(path)) {
            files = fs.readdirSync(path);
            files.forEach(function (file) {
                let curPath = path + "/" + file;
                if (fs.statSync(curPath).isDirectory()) { // recurse
                    this.deleteall(curPath);
                } else { // delete file
                    try {
                        fs.unlinkSync(curPath);
                    } catch (e) {
                        console.log(e);
                    }
                }
            });
            try {
                fs.rmdirSync(path);
            } catch (e) {
                console.log(e);
            }

        }
    }

    /**
     * 判断文件夹是否为空
     * @param pathStr 路径
     */
    isFile(pathStr) {
        let files = fs.readdirSync(pathStr);
        return files.length >= 1;
    }

    /**
     * 递归查询文件夹所有文件
     * @param pathStr 路径
     * @param arr 文件数组
     */
    getDirListFile(pathStr, arr) {
        //同步读取
        let files = fs.readdirSync(pathStr); 
        files.forEach(filename =>{
            //获取当前文件的绝对路径
            
            let filedir = path.join(pathStr, filename);
            //同步获取文件类型
            let stats = fs.statSync(filedir);
            let isFile = stats.isFile();//是文件
            let isDir = stats.isDirectory();//是文件夹
            if(isFile){
                arr.push({'filepath':filedir,'isOK':false})
            }
            if(isDir){
                this.getDirListFile(filedir, arr);//递归，如果是文件夹，就继续遍历该文件夹下面的文件
            }
        })
    return arr
    //异步需要特殊处理
        // fs.readdir(pathStr, (err, files)=>{
        //     if(err){
        //         console.warn(err)
        //     }else{
        //         files.forEach(filename =>{
        //             //获取当前文件的绝对路径
        //             let filedir = path.join(pathStr, filename);
        //             fs.stat(filedir, (eror, stats)=>{
        //                 if(eror){
        //                     console.warn('获取文件stats失败');
        //                 }else{
        //                     let isFile = stats.isFile();//是文件
        //                     let isDir = stats.isDirectory();//是文件夹
        //                     if(isFile){
        //                         arr.push({'filepath':filedir,'isOK':false})
        //                     }
        //                     if(isDir){
        //                         this.getDirListFile(filedir, arr);//递归，如果是文件夹，就继续遍历该文件夹下面的文件
        //                     }
        //                 }
        //             })
        //         })
        //         return arr
        //     }
        // })
        
    }

    /**
     * 获取指定文件夹的全部文件
     * @param pathStr 路径
     */
    getFiles(pathStr) {
        return new Promise((resolve, reject) => {
            this.isFileIfFolder(pathStr).then((bool) => {
                if (bool) {
                    fs.readdir(pathStr, (err, files) => {
                        resolve(files)
                    });
                } else {
                    resolve([])
                }
            })

        })
    }

    /**
     * 检查文件是否存在 / 文件夹
     * @param path 路径
     * @return {Promise<unknown>}
     */
    isFileIfFolder(path) {
        return new Promise((resolve, reject) => {
            fs.access(path, fs.constants.F_OK, (err) => {
                resolve(err ? false : true)
            });
        })
    }

    /**
     * 创建文件夹，如果文件夹存在就跳过，不存在就创建
     * @param {string} path 路径
     */
    async createFolder(path) {
        return new Promise((resolve, reject) => {
            this.isFileIfFolder(`${path}`).then((bool) => {
                if (!bool) {
                    // 创建文件夹
                    fs.mkdir(`${path}`, {recursive: true, mode: '0777'}, (err) => {
                        if (!err) {
                            resolve(`${path}`);
                        } else {
                            log.error(`创建文件夹失败${JSON.stringify(err)}`)
                        }
                    });
                } else {
                    resolve(`${path}`);
                }
            });
        })
    }

    // 截取文件名
    splitFileName(text) {
        let str = text;
        let re = /(\/.*?(jpg|gif|png|bmp|mp4|jpeg|JPG|GIF|PNG|BMP|MP4|JPEG|tif|TIF|pcx|PCX|tga|THA|exif|EXIF|fpx|FPX|svg|SVG|psd|PSD|cdr|CDR|pcd|PCD|dxf|DXF|ufo|UFO|eps|EPS|ai|AI|raw|RAW|wmf|WMF))/;
        let fileName = '';
        let name = '';
        let m = str.match(re)
        if (m[0]) {
            let str1 = m[0];
            fileName = m[0].substring(str1.lastIndexOf('/') + 1);
        }
        name = str.substring(str.indexOf(fileName));
        return name;
    }

    // 截取文件后缀
    getSuffix(str) {
        let s = '';
        try {
            s = /\.[^\.]+$/.exec(str)[0];
        } catch (e) {
            console.log(e);
        }
        return s;
    }
}