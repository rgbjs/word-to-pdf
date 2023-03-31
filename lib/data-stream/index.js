const color = require('console-color-node');

class DataStream {
    data; // 数据源
    tasks; // 任务队列
    tasksIndex; // 任务队列指针
    master; // 提供长期的数据挂载
    params; // 提供临时的数据挂载

    constructor(data) {
        this.data = data;
        this.tasks = [];
        this.tasksIndex = -1;
        this.master = {};
        this.params = {};
    }

    // 上下文
    context() {
        return {
            master: this.master,
            params: this.params,
            setMaster: this.setMaster,
            setParams: this.setParams,
            next: this.next(),
        }
    }

    // 设置 master 参数
    setMaster = (key, value) => {
        this.master[key] = value
    }

    // 设置 params 参数
    setParams = (key, value) => {
        this.params[key] = value
    }

    // 添加一个任务
    use(callback) {
        if (typeof callback !== 'function') {
            throw new TypeError(color('red', 'use() 方法传入的回调类型应当为函数!', 'end'));
        }
        this.tasks.push(callback)
        return true
    }

    // 执行下一个任务
    next() {
        let f = (key, value) => {
            if (typeof this.tasks[this.tasksIndex + 1] === 'function') {
                this.tasksIndex++;
                this.params = {};
                key && value && this.setParams(key, value)
                this.tasks[this.tasksIndex](this.data, this.context());
            }
        }

        return (key, value) => {
            if (f) {
                f(key, value);
                f = null;
            } else {
                throw new SyntaxError(color('red', 'next() 方法不可重复调用!', 'end'))
            }
        }
    }

    // 启动任务执行栈
    start(key, value) {
        this.next()(key, value);
    }
}

module.exports = DataStream