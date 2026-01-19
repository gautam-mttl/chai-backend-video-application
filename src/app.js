import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
 
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


export { app };