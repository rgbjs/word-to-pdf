## word-to-pdf

> word(doc, docx) 转换 PDF



**安装:**

*npm*

下载完后请进行解压

```cmd
npm pack word-to-pdf
```



*git*

通过 git 工具克隆本项目

```git
git clone https://github.com/rgbjs/word-to-pdf
```



*github下载代码*

https://github.com/rgbjs/word-to-pdf





**下载依赖:**

*npm*

```cmd
npm i
```





**使用:**

将需要转换的 word文件放入 local 中的 *doc* 文件夹中

随后启动任务

*命令:*

*npm*

```cmd
npm run local
```





**使用步骤:**

*下载项目*  => *下载依赖(npm i)* => *安装依赖软件 libreoffice*

 => *将需要转换的文件放入相对应的文件目录下*

 => *启动命令(npm run local)* => *等待转换* => **转换完成**





## 注意事项

本程序依赖于 `libreoffice` , 请在你的电脑上提前安装该软件

官网地址: 

https://zh-cn.libreoffice.org/





## 关于参数

word-to-pdf 默认最大同时任务为 `6` 个, 每启动一个任务将会新建一个进程, 直到任务完成即销毁

当你的电脑性能充足时可增大最大任务数, 反之则减小



最大任务参数在 `src/index` 下第一个函数 [传入初始化参数] 中修改

字段为: `maxTask`