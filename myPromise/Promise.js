/**
 * 这里实现一个最为基础的promise
 * @param {*} executor 
 */
function Promise(executor) {
    this.promiseState = 'pendding';
    this.promiseResult = null;

    // 存放成功的回调
    this.onResolvedCallbacks = []
    // 存放失败的回调
    this.onRejectedCallbacks = []

    // 函数作用就是修改promiseState和promiseResult
    // 这里要注意this的指向问题，固定指向这里的Promise对象，所以使用箭头函数
    resolve = (data) => {
        // 对状态判断，确保状态单次修改，不可重复修改
        if(this.promiseState !== 'pendding') return

        // 这里state改为成功
        this.promiseState = 'fulfilled'

        // 结果值改成传入的值
        this.promiseResult = data

        // 成功列表里的依次执行
        // 异步之后走了resolve
        this.onResolvedCallbacks.forEach(fn => fn())
    }

    reject = (data) => {
        // 对状态判断，确保状态单次修改，不可重复修改
        if(this.promiseState !== 'pendding') return

        // 这里state改为失败
         this.promiseState = 'rejected'

         // 结果值改成传入的值
         this.promiseResult = data

         // 失败列表里的依次执行
        this.onRejectedCallbacks.forEach(fn => fn())
    }

    try{
        // 同步调用，执行器函数
        executor(resolve, reject)
    } catch(err) {
        // 修改promise为失败
        reject(err)
    }
}

Promise.prototype.then = function(onResolve, onReject) {
    if(this.promiseState === 'rejected') {
        onReject(this.promiseResult)
    }
    if(this.promiseState === 'fulfilled') {
        onResolve(this.promiseResult)
    }
    if(this.promiseState === 'pendding') {
        // 如果是异步操作，这里就是pendding，对异步之后的操作做保存
        // 将成功之后的操作保存
        this.onResolvedCallbacks.push(() => {
            onResolve(this.promiseResult)
        })

        // 将失败的操作保存
        this.onRejectedCallbacks.push(() => {
            onReject(this.promiseResult)
        })
    }
}