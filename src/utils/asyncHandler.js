const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next))
        .catch((err) => next(err))                      //next(err) passes the error to next middleware running, so we need a global error middleware
    }                                                   //where ever we will throw error the catch block here will catch it and pass to next
}


export { asyncHandler }














//cosnt asyncHandler = () => {}
//const asyncHandler = (func) => {() => {}}
//const asyncHandler = (func) => async{() => {}}   bss curly braces remove krdo (this was all to understand arrow function syntax)

//try catch wala version
// const asyncHandler = (fn) => async (req, res, next) => {
//     try {
//         await fn(req, res, next);
//     } catch (error) {
//         res.status(err.code || 500).json({
//             success: false,
//             message: err.message
//         });
//     }
// }