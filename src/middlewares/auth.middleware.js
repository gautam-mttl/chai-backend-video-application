import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";

//if the user is logged in, toh they have access token, access token ke basis par query mari database se, or user ki details ko req.user me store krdiya

export const verifyJWT = asyncHandler(async(req, _, next) => {                                                                     //res use nhi aa rha so usko underscore se replace krdo
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")                               //when in mobile app there is no accesstoken, so header also gives authorization token which is written as Authorization: Bearer <token>. We only want the token so Bearer is replaced by empty string
        

        console.log(token);
        if (!token) {
            throw new ApiError(401, "Unauthorized request, User not logged-in")
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)                                    //secret key is used to decode the token
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")                       //when jwt token we generated in user model, we gave data like _id, email, username to it
    
        if (!user) {
            //
            throw new ApiError(401, "Invalid Access Token")
        }
    
        req.user = user;
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token")
    }
    
})