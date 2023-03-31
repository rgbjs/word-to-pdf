const path = require('path');
const fs = require('fs').promises;
const DataStream = require('../lib/data-stream')
const toPDF = require('../lib/to-pdf')
const color = require('console-color-node')
console.color = color.log;

const docPath = path.join(__dirname, '../local/doc') // 输入路径
const pdfPath = path.join(__dirname, '../local/pdf') // 输出路径

const dataStream = new DataStream({
    docPath,
    pdfPath
});

// 传入初始化参数
dataStream.use((data, context) => {
    context.setMaster('maxTask', 6); // 任务同时最大数(进程)
    context.next();
})

// 检测 doc输入目录是否存在
dataStream.use(async (data, context) => {
    try {
        console.color('yellow', '正在检测doc目录!', 'end');
        await fs.stat(data.docPath);
        console.color('green', '检测doc目录成功!', 'end');
    } catch (error) {
        throw new Error('red', 'doc目录不存在 => ' + data.docPath, 'end')
    }

    context.next()
})

// 删除 pdf目录, 为接下来生成新的文件提供位置
dataStream.use(async (data, context) => {
    console.color('yellow', '正在删除pdf存储目录!', 'end');
    await fs.rm(data.pdfPath, {
        force: true,
        recursive: true
    })
    console.color('green', '删除pdf存储目录成功!', 'end');
    context.next()
})

// 重新创建 pdf输出目录
dataStream.use(async (data, context) => {
    try {
        console.color('yellow', 'pdf存储目录重新创建中!', 'end');
        await fs.mkdir(data.pdfPath);
        console.color('yellow', 'pdf存储目录创建成功!', 'end');

    } catch (error) {
        throw new Error('red', 'pdf存储目录创建失败!', 'end');
    }

    context.next()
})

// 处理 doc目录信息, 将其数据化
dataStream.use(async (data, context) => {
    const docDir = await fs.readdir(data.docPath);
    const docArr = [];
    const dirArr = []; // 需要创建文件夹的路径

    const handle = async (docPath, docDir, containerArr) => {
        const _originFile = docDir; // 当前文件(原始文件名)
        const filePath = path.join(docPath, _originFile); // 当前文件路径
        const fileInfo = await fs.stat(filePath); // 当前文件信息
        const isDir = fileInfo.isDirectory(); // 是否是文件夹
        const isFile = fileInfo.isFile(); // 是否是文件
        if (isDir) {
            dirArr.push(filePath.replace(data.docPath, data.pdfPath));
            const dir = await fs.readdir(filePath);
            const container = [];
            for (let i = 0; i < dir.length; i++) {
                await handle(filePath, dir[i], container);
            }
            containerArr.push(container)
        }
        else if (isFile) {
            const typeIndex = _originFile.lastIndexOf('.'); // 文件后缀的起始下标
            const fileName = typeIndex >= 0 ? _originFile.slice(0, typeIndex) : _originFile; // 文件名
            const fileType = typeIndex >= 0 ? _originFile.slice(typeIndex) : ''; // 文件后缀, 包含小数点
            containerArr.push({ filePath, isDir, isFile, typeIndex, fileName, fileType, _originFile, fileInfo });
        }
    }

    for (let i = 0; i < docDir.length; i++) {
        await handle(data.docPath, docDir[i], docArr);
    }

    context.setMaster('files', docArr);
    context.setMaster('dirArr', dirArr);
    context.next();
})

// 扁平化 doc目录信息
dataStream.use(async (data, context) => {
    const toStr = (type) => {
        return Object.prototype.toString.call(type);
    }
    const { files } = context.master;
    const queue = [];

    const loop = (data) => {
        for (let i = 0; i < data.length; i++) {
            if (toStr(data[i]) === '[object Object]') {
                queue.push(data[i]);
            } else {
                loop(data[i]);
            }
        }
    }
    loop(files)
    context.setMaster('queue', queue);
    context.next();
})

// 为doc目录下每项数据添加目标路径字段(targetPath)
dataStream.use(async (data, context) => {
    const { queue } = context.master;
    for (let i = 0; i < queue.length; i++) {
        const fileURL = queue[i].filePath.replace(data.docPath, '');
        // 是word文件
        if (queue[i].fileType === '.doc' || queue[i].fileType === '.docx') {
            const index = fileURL.lastIndexOf('.');
            const name = fileURL.slice(0, index);
            const targetPath = path.join(data.pdfPath, name + '.pdf');
            queue[i].targetPath = targetPath;
        }
        else {
            const targetPath = path.join(data.pdfPath, fileURL);
            queue[i].targetPath = targetPath;
        }

    }
    context.next();
})

// 创建doc目录下相对应的文件夹
dataStream.use(async (data, context) => {
    const { dirArr } = context.master;
    for (let i = 0; i < dirArr.length; i++) {
        await fs.mkdir(dirArr[i]);
    }
    context.next();
})

// loop 运行转换任务
dataStream.use(async (data, context) => {
    const { maxTask, queue } = context.master;
    let count = 0;
    let index = 0;
    const loop = async (fileInfo) => {
        const { filePath, targetPath, fileType } = fileInfo;
        if (fileType === '.doc' || fileType === '.docx') {
            count++;
            toPDF(filePath, targetPath, () => {
                count--;
                console.color('green', targetPath, '文件转换成功!', 'end');
                index++;
                queue[index] && loop(queue[index]);
            }).catch((err) => {
                console.color('red', '转换过程中发生了错误: ' + filePath, err, 'end');
                throw new Error(err)
            });
        } else {
            console.color('yellow', filePath, '文件不是word文档, 正在为其复制一份!', 'end');
            await fs.copyFile(filePath, targetPath);
            console.color('green', filePath, '复制成功!', 'end');
            index++;
            // queue[index] && loop(queue[index]); // 错误
        }
        if (count < maxTask && queue[index]) {
            loop(queue[index]);
        }
    }
    loop(queue[index]);
})

dataStream.start()
