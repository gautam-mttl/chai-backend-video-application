import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

//we use async await becuase databae is in another continent and it may take time to connect
const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`)
    } 
    catch (error) {
        console.error("MONGODB connection FAILED: ", error);
        process.exit(1);
    }
}

export default connectDB;