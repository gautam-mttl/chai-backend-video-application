import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary, deleteFromCloudinary} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"

const CookieOptions = {
  httpOnly: true,                                   
  secure: true,                                     //can only be changed from server
};

const generateAccessAndRefereshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })                                      //save is mongoDB method, also when we save then jo required fields woh bhi check hote hai ki if value is given or not so to avoid this Validate ko false krdo                                      

        return {accessToken, refreshToken}


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
};


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

    const existingUser = await User.findOne({                                  //find first entry that matches the criteria in user Schema
        $or: [{ username },{ email }]                                   //dollar sign indicate krte h ki mongodb ka operator use kr rhe h
    
    })

    if (existingUser){
        throw new ApiError(409, "User already exists with this username or email");
    }
    //console.log(req.files);

    // ? mtlb optionally, acess ho skta ya nhi bhi
    console.log(req.files);                                                     //JUST TO STUDY the incoming request files, here 2 files are uploded together, later on in the controller whhile updating only 1 file will be uploaded so directly path we can take
    const avatarLocalPath = req.files?.avatar[0]?.path;                        //.files ka access multer deta, jo middleware routes m use kiya tha or uploading image, that adds data to the request
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;                                     //idhr optionally nahi kyuki we have confirmed that array mila hai
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }

    //create new user
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        avatar_publicId: avatar.public_id,
        coverImage: coverImage?.url || "",                                          //cover image optionally thi so path bhi shyd hi milega, so otherwise empty value bhejo database mei
        coverImage_publicId: coverImage?.public_id || "",
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
        new ApiResponse(200, createdUser, "User registered Successfully lol")                       //Json mei object behjte hai, so ApiResponse naam ka ek object bna ke bhej rhe hain, and ApiRepsonse utils m defined h
    )


});

const loginUser = asyncHandler(async (req, res) =>{
    // req body se-> data we'll take
    // username or email
    //find the user in database
    //password check
    //access and referesh token (generate krke-> already in user.model) user ko send krna
    //send the tokens in cookies

    const {email, username, password} = req.body
    console.log(req.body)

    if (!username && !email) {
        throw new ApiError(400, "username or email is required")
    }

    if (!password) {
        throw new ApiError(400, "password is required");
    }

    const user = await User.findOne({                                       //db in another continent so takes time so await
        $or: [{email}, {username}]                                          //mongoDB ke operator can be accessed using $
    })                                                                      //query from mongoDB database to find a user with given email or username

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

    //IMPORTANT                                                                                             //User mongoDb ka mongoose ka object, so mongoose ke through jo methods available h woh milenge | user mei our own created methods are available, user is-> jo database se wapis liya hai, ek instance liya hai
    const isPasswordValid = await user.isPasswordCorrect(password)                                           //we made method for user isPassCorr in user.model

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")                        //firse user (new ref)isliye liya hai, kyuki the ref of user we have doesn't have the inserted value of refresh token


    return res
    .status(200)
    .cookie("accessToken", accessToken, CookieOptionsoptions)
    .cookie("refreshToken", refreshToken, CookieOptionsoptions) 
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully!!"
        )
    )

});

const logoutUser = asyncHandler(async(req, res) => {
    //clear access and refresh tokens 
    //clear cookies
    await User.findByIdAndUpdate(
        //in routes logout user run hone se phele auth middleware run hoga, from which we get access to req.user 
        req.user._id,
        {
            $set: {                                                                 //mongoDb ka operator hai set
                refreshToken: undefined
            }
        },
        {
            new: true                                       //return mei jo response milega that will have the new value for refreshtoken
        }
    )

    return res
    .status(200)
    .clearCookie("accessToken", CookieOptions)                            //database se remove hogya, so user ke browser se bhi remove krdo
    .clearCookie("refreshToken", CookieOptions)
    .json(new ApiResponse(200, {}, "User logged Out"))
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")    
        }
        //if the refreshtoken that is incoming(front-end se ek  request ayegi) and the one saved in database are same, we will again generate new access and refresh tokens
        
        const {accessToken, newRefreshToken} = await generateAccessAndRefereshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, CookieOptions)
        .cookie("refreshToken", newRefreshToken, CookieOptions)
        .json(
            new ApiResponse(
                200, 
                {accessToken, refreshToken: newRefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})

const changeCurrentPassword = asyncHandler(async(req, res) => {                                     //we need not to worry about if the user is logged in, or cookies over here, as when we will make the route, there we will added the verifyJWT middleware(Auth) to check that
    const {oldPassword, newPassword} = req.body

    

    const user = await User.findById(req.user?._id)                                                 //auth middleware jo route m use krnege that will give us req.user
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)                             //we made a method in user.model isPasswordCorrect, returns true/false

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})                                                    //pre hook is defined in user.model that runs before the save operation

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"))
})


const getCurrentUser = asyncHandler(async(req, res) => {                                            //the auth middleware will be used in route, which gives us req.user
    return res          
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"))
})

const updateAccountDetails = asyncHandler(async(req, res) => {                                      //the auth middleware will be used in route, which gives us req.user      
    const {fullName, email} = req.body

    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required")
    }

    // const existingUser = await User.findOne({ email, _id: { $ne: req.user._id } });

    // if (existingUser) {
    //     throw new ApiError(409, "User with this email already exists")
    // }

    const user = await User.findByIdAndUpdate(req.user?._id ,
        {
            $set: {
                fullName,                                   //fullname: fullName is also correct, but in ES6 single fullName is considered as same
                email: email                                //sirf email likhte then also same/correct
            }
        },
        {new: true}                                         //if new is true then update hone ke baad jo info hai woh return hogi

    ).select("-password")                                    //don't want password field in the user instance that we get from querying the database

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"))           
});

const updateUserAvatar = asyncHandler(async(req, res) => {                                          //2 middleware use krnege in routing, first multer then auth wala to check the logged in user
    const avatarLocalPath = req.file?.path                                                          //req.file milega multer middleware ke through

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)                                        //uploadOnCloudinary returns a response from cloudinary which is object, which has method of url, check in utils

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar")
        
    }

    const avatarPublicId = req.user?.avatar_publicId
    await deleteFromCloudinary(avatarPublicId)

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url,
                avatar_publicId: avatar.public_id
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar image updated successfully")
    )
})

const updateUserCoverImage = asyncHandler(async(req, res) => {
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on avatar")
        
    }

    const coverImagePublicId = req.user?.coverImage_publicId
    if (req.user && req.user.coverImage !== '') {
        await deleteFromCloudinary(coverImagePublicId)
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.url,
                coverImage_publicId: coverImage.public_id
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Cover image updated successfully")
    )
})

const getUserChannelProfile = asyncHandler(async(req, res) => {                                     //the route for going on a channel will have username like youtube/chaiaurcode
    console.log(req.params)                                                                         //req.params (express.js) is an object containing URL route parameter(key-value pairs)
    const {username} = req.params

    if (!username?.trim()) {
        throw new ApiError(400, "username is missing")
    }

    const channel = await User.aggregate([                                                          //aggregate takes an array, inside array each object is a pipeline stage 
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {                                                                                           //lookup se we perform left join, so jo criteria matching docs hai their data is added as new field in(jo match se ek user a doc mila hai)
            $lookup: {                                                                              //lookup ke bhi fixed param hote hai from(which doc), local field , foreign field, as(result ko store as)
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {                                      
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {                                                                           //condition, iske 3 param hote hai if, then, else
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},                         //jo doc aaya subscribers usmei user hai ya nhi, we will return true ya false value to front-end dev
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {                                                                                 //what all to project on the channel
                fullName: 1,                                                                            //jo krna hai display uska flag 1
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1

            }
        }
    ])

    console.log(channel)                                                                            //LOG TO STUDY: Aggregation pipeline returns an array, our match returns only 1 value, so the returned array also will have 1 value
    if (!channel?.length) {
        throw new ApiError(404, "channel does not exists")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "User channel fetched successfully")
    )
})


export { 
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile
 };