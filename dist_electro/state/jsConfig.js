window.MainWindow = true
window.abs = 'aa'
let jsonIpc = {}
const ipcRenderer = require('electron').ipcRenderer;

// 导入 ****

//导入原片
jsonIpc.ImportOriginalFilm=function(data){
    ipcRenderer.send('ImportOriginalFilm', data)
}

//导入初修片
jsonIpc.ImportEarlyRepairFilm=function(data){
    ipcRenderer.send('ImportEarlyRepairFilm', data)
}

//导入精修片
jsonIpc.ImportRefineFilm=function(data){
    ipcRenderer.send('ImportRefineFilm', data)
}

//导入设计片
jsonIpc.ImportDesignFilm=function(data){
    ipcRenderer.send('ImportDesignFilm', data)
}


// 导出 ****

//导出原片
jsonIpc.ExportOriginalFilm=function(data){
    ipcRenderer.send('ExportOriginalFilm', data)
}

//导出初修片
jsonIpc.ExportEarlyRepairFilm=function(data){
    ipcRenderer.send('ExportEarlyRepairFilm', data)
}

//导出精修片
jsonIpc.ExportRefineFilm=function(data){
    ipcRenderer.send('ExportRefineFilm', data)
}

//导出设计片
jsonIpc.ExportDesignFilm=function(data){
    ipcRenderer.send('ExportDesignFilm', data)
}

//导出已选片
jsonIpc.ExportSelectFilm=function(data){
    ipcRenderer.send('ExportSelectFilm', data)
}

//导出样片
jsonIpc.ExportSample=function(data){
    ipcRenderer.send('ExportSample', data)
}

//每秒进行接收下载数量
ipcRenderer.on('file-count', (e, taskCount) => { 
    let uploadNumberID = "LYFZ_SetPictureUploadNum";
    let eleByID = document.getElementById(uploadNumberID);
    if (eleByID) {
        eleByID.innerHTML = taskCount;
        if (taskCount > 0) {
            eleByID.style.display = 'block';
        } else {
            eleByID.style.display = 'none';
        }
    } 

 })

 //按钮触发刷新
jsonIpc.OnClickRefresh=function(data){
    ipcRenderer.send('OnClickRefresh', data)
}

//接受刷新当前页面
ipcRenderer.on('location-replace', () => {
    location.reload();
})


window.MainWindow = jsonIpc