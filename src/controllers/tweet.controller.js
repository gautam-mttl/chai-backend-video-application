import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const { content } = req.body;

    if (!content || !content.trim()) {
        throw new ApiError(400, "Tweet content required");
    }

    const tweet = await Tweet.create({
        content,
        owner: req.user._id
    });

    return res
        .status(201)
        .json(new ApiResponse(201, tweet, "Tweet created"));
});


const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user id");
    }

    // const user = await User.findById(userId);
    // if (!user) throw new ApiError(404, "User not found");

    const tweets = await Tweet.find({ owner: userId })                                              //find returns array so !tweets.length is fine
    .populate("owner", "username avatar").sort({ createdAt: -1 });                            

    if(!tweets.length){
        throw new ApiError(404, "No tweets found for this user");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, tweets, "Tweets fetched"));
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { tweetId } = req.params;
    const { content } = req.body;

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet id");
    }

    if (!content || !content.trim()) {
        throw new ApiError(400, "Tweet content required");
    }

    const tweet = await Tweet.findById(tweetId);                                    //findbyId returns document so !tweet is fine
    if (!tweet) throw new ApiError(404, "Tweet not found");

    if (!tweet.owner.equals(req.user._id)) {
        throw new ApiError(403, "Not authorized");
    }

    tweet.content = content.trim();
    await tweet.save();

    return res
        .status(200)
        .json(new ApiResponse(200, tweet, "Tweet updated"));
});

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const { tweetId } = req.params;

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet id");
    }

    const tweet = await Tweet.findById(tweetId);
    if (!tweet) throw new ApiError(404, "Tweet not found");

    if (!tweet.owner.equals(req.user._id)) {
        throw new ApiError(403, "Not authorized");
    }

    await tweet.deleteOne();

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Tweet deleted"));
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}