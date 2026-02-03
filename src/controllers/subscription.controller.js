import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription
    if(!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel id")
    }
    
    if (channelId === req.user._id.toString()) {
        throw new ApiError(400, "You cannot subscribe to yourself");
    }
    const existing = await Subscription.findOne({                                               //we get the existing doc
        channel : channelId,
        subscriber : req.user._id
    })

    if(existing){                                                                      //if we already have the document, we can remove it using deleteOne, no need to find byId an delete and then again pas those conditon of video and likeBY
        await existing.deleteOne()
        return res.json(new ApiResponse(200, {}, "Channel unsubscribed"))
    }

    await Subscription.create({
        channel : channelId,
        subscriber : req.user._id
    })

    return res.status(201).json(new ApiResponse(201, {}, "Subscribed!"))
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel id");
    }

    const subscribers = await Subscription.find({ channel: channelId })                                                       //no error in case of no matching docs, as subscribers can be 0
        .populate("subscriber", "username avatar");
                
    return res
        .status(200)
        .json(new ApiResponse(200, subscribers, "Subscribers fetched"));

});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid subscriber id");
    }

    const subscribedTo = await Subscription.find({subscriber: subscriberId})                                                   //no error in case of no matching docs, as subscribed channels can be 0
        .populate("channel", "username avatar");

    
    return res
        .status(200)
        .json(new ApiResponse(200, subscribedTo, "Subscribed channels fetched"));
});

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}