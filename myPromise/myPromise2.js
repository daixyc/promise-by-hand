/**
 * 这个promise除了基本功能，还实现链式调用
 * 加上catch finally功能
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
}

