import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import {errorHandler} from './middlewares/error.middleware.js'
 
const app = express();

//app.use is used when we want to use any middleware or config settings for our express app
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true    
}));

app.use(express.json({limit: "16kb"}));        //to parse json data from request body
app.use(express.urlencoded({ extended: true , limit: "16kb" }));   //to parse urlencoded data from request body
app.use(express.static('public'));      //to serve static files from public folder 

app.use(cookieParser());      //server can read n remove cookies of the user's browser


//routes import
import userRouter from './routes/user.routes.js';              //we can give any name to the imported router only if export is default
// import healthcheckRouter from "./routes/healthcheck.routes.js"
// import tweetRouter from "./routes/tweet.routes.js"
// import subscriptionRouter from "./routes/subscription.routes.js"
import videoRouter from "./routes/video.routes.js"
// import commentRouter from "./routes/comment.routes.js"
// import likeRouter from "./routes/like.routes.js"
// import playlistRouter from "./routes/playlist.routes.js"
// import dashboardRouter from "./routes/dashboard.routes.js"

//routes declaration
// app.use("/api/v1/healthcheck", healthcheckRouter)
app.use("/api/v1/users", userRouter)
// app.use("/api/v1/tweets", tweetRouter)
// app.use("/api/v1/subscriptions", subscriptionRouter)
app.use("/api/v1/videos", videoRouter)
// app.use("/api/v1/comments", commentRouter)
// app.use("/api/v1/likes", likeRouter)
// app.use("/api/v1/playlist", playlistRouter)
// app.use("/api/v1/dashboard", dashboardRouter)

app.use(errorHandler);                                         //global error handler/middleware

//http://localhost:8000/api/v1/users/register
export { app };