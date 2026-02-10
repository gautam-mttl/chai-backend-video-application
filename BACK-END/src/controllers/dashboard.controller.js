import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

    const userId = req.user._id;
    let videoStats;

    try {
        videoStats = await Video.aggregate([
            { 
                $match: { owner: userId } 
            },
            {
                $lookup: {
                    from: "likes",
                    localField: "_id",
                    foreignField: "video",
                    as: "likes"
                }
            },
    
            {                                                                                   // convert likes array → number
                $addFields: {
                    likesCount: { $size: "$likes" }                                             //add a field likesCount to each document of videos
                }
            },
            
            {
                $group: {
                    _id: null,
                    totalVideos: { $sum: 1 },                                                   //sum of total documents we got from match, +1 for each document
                    totalViews: { $sum: "$views" },                                             //sum of views field from each document 
                    totalLikes: { $sum: "$likesCount" }                                         //sum of likesCount field from each document will give total likes for all videos of the channel
                }
            }
        ]);
    } catch (error) {
        throw new ApiError(500, "Error while getting video stats ")
    }

    const stats = videoStats[0] || {
        totalVideos: 0,
        totalViews: 0,
        totalLikes: 0
    };


    //Subscriber count
    let totalSubscribers = 0;

    try {
        totalSubscribers = await Subscription.countDocuments({
            channel: userId
        });
    } catch (error) {
        throw new ApiError(500, "Error while counting subscribers")
    }


    return res.status(200).json(new ApiResponse(200, 
    {
      totalVideos: stats.totalVideos,
      totalViews: stats.totalViews,
      totalLikes: stats.totalLikes,
      totalSubscribers,
    }, "Channel stats fetched")
  );

})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const { page = 1, limit = 10 } = req.query;

    const pageNum = Number(page);
    const limitNum = Number(limit);

    const videos = await Video.aggregatePaginate(
        Video.aggregate([
        {
            $match: { owner: new mongoose.Types.ObjectId(req.user._id) }
        },
        {
            $project: {
                title: 1,
                thumbnail: 1,
                views: 1,
                isPublished: 1,
                createdAt: 1
            }
        },
        { 
            $sort: { createdAt: -1 } 
        }
        ]),

        {
            page: pageNum,
            limit: limitNum
        }
    );

    return res.status(200).json(
        new ApiResponse(200, videos, "Channel videos fetched")
    );
})

export {
    getChannelStats, 
    getChannelVideos
    }