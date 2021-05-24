/**
 * 这个promise除了基本功能，还实现链式调用
 * 加上catch finally功能
 * 实现all resolve reject race等功能
 */
 class myPromise {
    static pending = "pending"
    static fulfilled = "fulfilled"
    static rejected = "rejected"

    constructor(executor) {
        this.status = myPromise.pending
        this.value = null
        this.reason = null
        // 存储then中传的参数
        this.callbacks = []
        executor(this._resolve.bind(this), this._reject.bind(this))
    }

    _resolve(data) {
        if(this.status !== myPromise.pending) return
        // 如果then中返回的就是个promise，那这里的data就是promise，需要处理
        // 要获取真正返回的值，那一定是在promise.then中得到的，所以这里需要执行
        // then的入参一直都是promise对象中的resolve和reject方法
        if(data instanceof myPromise) {
            data.then(this._resolve.bind(this), this._reject.bind(this))
            return
        }
        this.value = data
        this.status = myPromise.fulfilled;

        // 通知事件执行
        this.callbacks.forEach(cb => this._handler(cb))
    }

    _reject(data) {
        if(this.status !== myPromise.pending) return
        // 如果then中返回的就是个promise，那这里的data就是promise，需要处理
        if(data instanceof myPromise) {
            data.then(this._resolve.bind(this), this._reject.bind(this))
            return
        }
        this.reason = data
        this.status = myPromise.rejected;

        // 通知事件执行
        this.callbacks.forEach(cb => this._handler(cb))
    }

    then(onResolve, onReject) {
        // 注册事件，等到需要执行的时候会执行
        // this.callbacks.push({onResolve, onReject})

        // 为了链式调用，这里要返回promise
        return new myPromise((nextResolve, nextReject) => {
            // 如果有需要链式调用，在_handler函数进行回调函数的收集
            this._handler({nextResolve, nextReject, onResolve, onReject})
        })
    }

    catch(onReject) {
        // catch中只有失败情况
        return this.then(null, onReject)
    }

    finally(onFinally) {
        // finally中 不关系是否成功，所以调用then时 入参相同，都是finally中的入参
        return this.then(onFinally, onFinally)
    }

    // 运行逻辑统一放这里
    _handler(callback) {
        // let { onResolve, onReject } = callback;
        // if(this.status === Promise.fulfilled && onResolve) {
        //     onResolve(this.value)
        // }
        // if(this.status === Promise.rejected && onReject) {
        //     onReject(this.reason)
        // }

        // 为了链式调用，这里需要处理promise
        let { nextResolve, nextReject, onResolve, onReject } = callback
        if(this.status === myPromise.pending) {
            // 如果还未处理的
            this.callbacks.push(callback)
            return
        }

        if(this.status === myPromise.fulfilled) {
            let nextValue = onResolve ? onResolve(this.value) : undefined
            // 如果没有链式调用，这里传进去undefined
            nextResolve(nextValue)
            return
        }

        if(this.status === myPromise.rejected) {
            let nextValue = onReject ? onReject(this.reason) : undefined
            nextReject(nextValue)
            return
        }
    }

    //#region  这里实现
    // 先看下用法：Promise.resolve(2).then(data => console.log(data))    // 2
    //Promise.resolve(new Promise(resolve => resolve(3))).then(data => console.log(data))  // 3
    // 可以看出来，其实Promise.resolve和Promise.reject也就是返回了一个Promise对象
    static resolve(value) {
        // 如果value是Promise，那就直接返回value
        if(value instanceof myPromise || ((typeof value === 'object') && 'then' in value)) {
            return value
        }
        return new myPromise(resolve => resolve(value));
    }
    static reject(value) {
        // 如果value是Promise，那就直接返回value
        if(value instanceof myPromise || ((typeof value === 'object') && 'then' in value)) {
            return value
        }
        return new myPromise(reject => reject(value));
    }

    // Promise.all([]).then()
    // 入参是数组，数组中每一项都返回了fulfilled，最后结果才返回fulfilled和resolve数组，否则返回rejected，结果是第一个rejected的结果
    static all(arr) {
        return new myPromise((resolve, reject) => {
            let ret = []
            let count = 0

            Array.from(arr).forEach((item, index) => {
                myPromise.resolve(item).then(data => {
                    ret[index] = data
                    count++

                    if(count === arr.length) {
                        // 所有的都成功了
                        resolve(ret)
                    }
                }, reject)
            })
        })
    }
    // 传入promise数组，只要有一个promise解决或拒绝，就返回  
    static race(arr) {
        return new myPromise((resolve, reject) => {
            Array.from(arr).forEach(item => {
                myPromise.resolve(item).then(resolve, reject)
            })
        })
    }
    //#endregion
}

