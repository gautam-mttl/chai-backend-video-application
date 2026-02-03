import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video

    if(!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }

    //                                                                                    //can also use findOneandDelete, it will save the 2 queries, but won't get the older like data if needed later
    const existing = await Like.findOne({                                                 //we get the existing doc
        video : videoId,
        likedBy : req.user._id
    })

    if(existing){                                                                         //if we already have the document, we can remove it using deleteOne, no need to find byId an delete and then again pas those conditon of video and likeBY
        await existing.deleteOne()
        return res.json(new ApiResponse(200, {}, "Video unliked"))
    }

    await Like.create({
        video : videoId,
        likedBy : req.user._id
    })

    return res.status(201).json(new ApiResponse(201, {}, "Video liked!"))
    
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    if(!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment id")
    }

    const existing = await Like.findOne({                                               //we get the existing doc
        comment : commentId,
        likedBy : req.user._id
    })

    if(existing){                                                                      //if we already have the document, we can remove it using deleteOne, no need to find byId an delete and then again pas those conditon of video and likeBY
        await existing.deleteOne()
        return res.json(new ApiResponse(200, {}, "Comment unliked"))
    }

    await Like.create({
        comment : commentId,
        likedBy : req.user._id
    })

    return res.status(201).json(new ApiResponse(201, {}, "Comment liked!"))

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    if(!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid tweet id")
    }

    const existing = await Like.findOne({                                               //we get the existing doc
        tweet : tweetId,
        likedBy : req.user._id
    })

    if(existing){                                                                      //if we already have the document, we can remove it using deleteOne, no need to find byId an delete and then again pas those conditon of video and likeBY
        await existing.deleteOne()
        return res.json(new ApiResponse(200, {}, "Tweet unliked"))
    }

    await Like.create({
        tweet : tweetId,
        likedBy : req.user._id
    })

    return res.status(201).json(new ApiResponse(201, {}, "Tweet liked!"))
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const likedVideos = await Like.find({
        likedBy : req.user._id,
        video: { $ne: null }                                                            //we want only the likedVideos, when video like is filled....rest 2 are null, so if we don't do this, we will get likes on comment and tweets also, which has the video value as null
    }).populate("video")                                                                //Mongoose Replace the ObjectId with the actual document data from the referenced collection.......the video object will be expanded, instead of just the videoId being returned

    return res
        .status(200)
        .json(new ApiResponse(200, likedVideos, "Liked videos fetched successfully"))
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}