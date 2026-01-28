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


//routes declaration
app.use("/api/v1/users", userRouter); 

app.use(errorHandler);                                         //global error handler/middleware

//http://localhost:8000/api/v1/users/register
export { app };