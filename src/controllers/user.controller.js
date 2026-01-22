import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";


 const registerUser = asyncHandler(async (req, res) => {
    // get user details from frontend
    // validations - not empty
    // check if user already exists: from username, email
    // check for images, check for avatar
    // upload images to cloudinary, check if avatar uploaded successfully
    // create user object (MongoDB is Nosql database, so mostly object uploade krte h), then create entry in db
    // remove password and refresh token field from response
    // (response aya ya nhi, and if aya then)check for user creation
    // return response

    const {fullName, email, username, password}= req.body;                         //form ya json se data .body me aata h, but url se data ke liye 
    console.log(req.body);                                 //JUST TO STUDY the incoming request body  

    
    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")                     //separate if for all fields krke bhi check kr skte h
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({                                  //find first entry that matches the criteria in user Schema
        $or: [{ username },{ email }]                                   //dollar sign indicate krte h ki mongodb ka operator use kr rhe h
    
    })

    if (existedUser){
        throw new ApiError(409, "User already exists with this username or email");
    }
    //console.log(req.files);

    // ? mtlb optionally, acess ho skta ya nhi bhi
    console.log(req.files);                                                     //JUST TO STUDY the incoming request files
    const avatarLocalPath = req.files?.avatar[0]?.path                          //.files ka access multer deta, jo middleware routes m use kiya tha or uploading image, that adds data to the request
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",                      //cover image optionally thi so path bhi shyd hi milega, so otherwise empty value bhejo database mei
        email, 
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"                          //- sign indicates exclude these fields from the response
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")                       //Json mei object behjte hai, so ApiResponse naam ka ek object bna ke bhej rhe hain, and ApiRepsonse utils m defined h
    )


})

export { registerUser };