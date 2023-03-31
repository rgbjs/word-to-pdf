'use strict';

const path = require('path');
const fs = require('fs').promises;

const libre = require('libreoffice-convert');
libre.convertAsync = require('util').promisify(libre.convert);

/**
 * doc转pdf
 * @param {path} inputPath 输入的文件路径
 * @param {path} outputPath 输出的文件路径
 * @param {path} callback 成功的回调
 */
module.exports = async function main(inputPath, outputPath, callback) {
    const ext = '.pdf'; // 转换的目标格式

    // Read file 读取文件
    const docxBuf = await fs.readFile(inputPath);

    // Convert it to pdf format with undefined filter (see Libreoffice docs about filter)
    // 调用接口转换
    let pdfBuf = await libre.convertAsync(docxBuf, ext, undefined);

    // Here in done you have pdf file which you can save or transfer in another stream
    // 输出转换后的文件
    await fs.writeFile(outputPath, pdfBuf);
    typeof callback === 'function' && callback() // 成功的回调
}

// main().catch(function (err) {
//     console.log(`发生了错误: ${err}`);
// });
