import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary, deleteFromCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination

    const pageNum = Number(page);                                                                                       //the query gives tring, so to convert into number
    const limitNum = Number(limit);

// Build match stage                                                                          
    //no query, no userId ( /videos)                                                                                    //const matchStage = {}
    const matchStage = {                                                                                                //matchStage.isPublished = true
        isPublished: true                                                                      
    };

    // if userId in req.query ( /videos?userId=abc )-----> in match with isPublished, onwer: userId will also be passed
    if (userId && isValidObjectId(userId)) {
        matchStage.owner = new mongoose.Types.ObjectId(userId);
    }

    // if query in req.query ( /videos?query=music )-----> in match with isPublished, the $or will also be passed
    if (query) {
        matchStage.$or = [                                                                                              //from isPublsihed documents, Match documents where ANY ONE of the conditions is true: title matches query or desc matches query
        { title: { $regex: query, $options: "i" } },                                                                    //$regex Used to match strings based on a pattern instead of exact value.
        { description: { $regex: query, $options: "i" } }                                                               //$options is Used to modify how $regex behaves. i-> case-insensitive search
        ];
    }


// Sort stage
    const sortStage = {
        [sortBy]: sortType === "asc" ? 1 : -1
    };

    const aggregate = Video.aggregate([
        { $match: matchStage },

        {
        $lookup: {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "channel"
        }
        },

        {
        $unwind: {
            path: "$channel",
            preserveNullAndEmptyArrays: true
        }
        },

        {
        $project: {
            title: 1,
            description: 1,
            thumbnail: 1,
            videoFile: 1,
            duration: 1,
            views: 1,
            createdAt: 1,
            isPublished: 1,
            channel: {
            _id: 1,
            username: 1,
            avatar: 1
            }
        }
        },

        { $sort: sortStage }
    ]);

    const videos = await Video.aggregatePaginate(aggregate, {
        page : pageNum,
        limit : limitNum
    });

    return res.status(200).json(
        new ApiResponse(200, videos, "Videos fetched successfully")
    );
})


const publishAVideo = asyncHandler(async (req, res) => {    
    //publish user video
    const { title, description} = req.body
    if(!title || !description){
        throw new ApiError(400, "Title and Description are required");
    }
    //get video, upload to cloudinary, create video

    console.log(req.files);
    const videoFileLocalPath = req.files?.videoFile[0]?.path; 
    const thumbnailFileLocalPath = req.files?.thumbnail[0]?.path; 

    if(!videoFileLocalPath || !thumbnailFileLocalPath){
        throw new ApiError(400, "Video and thumbnail are required")
    }

    const video = await uploadOnCloudinary(videoFileLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailFileLocalPath)

    if (!video) {
        throw new ApiError(500, 'Error while uploading video file');
    }

    if (!thumbnail) {
        throw new ApiError(500, 'Error while uploading thumbnail file');
    }

    //create new video
    try {
        const newVideo = await Video.create({
            thumbnail: thumbnail.url,
            videoFile: video.url,
            thumbnail_publicId: thumbnail.public_id,
            videoFile_publicId: video.public_id,
            title,                                                              ///from req.body
            description,
            views: 0,
            duration: video.duration,
            isPublished: true,
            owner: req.user._id                                                 //auth middleware in route
        });
        
        const user = await User.findById(req.user._id).select("username avatar");

        return res
            .status(201)
            .json(new ApiResponse(201, {newVideo, channel: user},  "Video published successfully"))
    } 
    catch (error) {
        console.log(error)
        throw new ApiError(500, "Something went wrong while publishing the video")
    }

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    // get video by id

    if (!videoId) {
        throw new ApiError(400, 'Video id is required');
    }

    if (isValidObjectId(videoId) === false) {
        throw new ApiError(400, 'Inavlid Video id');
    }

    // const video = await Video.findById(videoId);
    const video = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId),                                  //req.params.videoId → string, _id in MongoDB → ObjectId type, Aggregation does NOT auto-cast types
            },                                                                              //but in findById(videoId) → Mongoose auto-casts string → ObjectId  ||  aggregate runs on MongoDb level, requires exact type match
        },
        {
            $lookup: {
                from: 'users',
                localField: 'owner',
                foreignField: '_id',
                as: 'channel',
            },
        },
        {
            $unwind: {
                path: '$channel',                                                            //It converts the channel    array into a single object:
                preserveNullAndEmptyArrays: true                                                //if by chance no owner is found, unwind would otherwise drop the whole video doc, which we got by match
            }
        },

        {
            $project: {
                _id: 1,
                title: 1,
                description: 1,
                thumbnail: 1,
                videoUrl: 1,
                duration: 1,
                createdAt: 1,
                isPublished: 1,
                channel: {
                    _id: 1,
                    username: 1,
                    avatar: 1,
                },
            },
        },
    ]);

    if (!video?.length) {
        throw new ApiError(404, 'Video not found');
    }

    const videoDoc = video[0];
        if (!videoDoc.isPublished && !videoDoc.channel._id.equals(req.user._id)) {
        throw new ApiError(403, "Video is private");
    }

    return res.status(200).json(new ApiResponse(200, videoDoc, 'Video found'));
});


const updateVideo = asyncHandler(async (req, res) => {
    const video = req.video;                                                            //req.video from middleware videoOwnership, video is instance of Video.findById
    //update video details like title, description, thumbnail

    const {title, description} = req.body;
    const thumbnailLocalPath = req.file?.path;

    if (thumbnailLocalPath) {

        const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
        if (!thumbnail) {
            throw new ApiError(500, 'Error while uploading thumbnail file');
        }
        
        await deleteFromCloudinary(video.thumbnail_publicId);

        video.thumbnail = thumbnail.url;
        video.thumbnail_publicId = thumbnail.public_id;
    }

    if(title !== undefined) { video.title = title }
    if(description !== undefined){ video.description = description }
    await video.save(); 

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Video updated successfully"));
})

const deleteVideo = asyncHandler(async (req, res) => {
    // delete video
    const video = req.video;                                                            //req.video from middleware videoOwnership, video is instance of Video.findById

    await deleteFromCloudinary(video.thumbnail_publicId)
    await deleteFromCloudinary(video.videoFile_publicId)

    await Video.findByIdAndDelete(video._id);

    return res.status(200).json(
    new ApiResponse(200, {}, "Video deleted successfully")
  );

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const video = req.video;                                                            //req.video from middleware videoOwnership, video is instance of Video.findById

    video.isPublished = !video.isPublished;                                          //in rare case cn cause race condition
    const publishStatus = await video.save();

    // const publishStatus = await Video.findByIdAndUpdate(video._id,
    //     [{ $set: { isPublished: { $not: "$isPublished"}} }],                              //$not is atomic 
    //     { new: true }
    // );
    //console.log(publishStatus);

    if (!publishStatus) {
        throw new ApiError(404, "Video not found");
    }
    return res.status(200).json(
      new ApiResponse(200, publishStatus, "Publish status toggled successfully")
    );

})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}















/*const getAllVideos = asyncHandler(async (req, res) => {
  let {
    page = 1,
    limit = 10,
    query,
    sortBy = "createdAt",
    sortType = "desc",
    userId
  } = req.query;

  page = parseInt(page);
  limit = parseInt(limit);

  const aggregate = Video.aggregate();

  // Always show only published videos (public feed)
  aggregate.match({
    isPublished: true
  });

  // Search filter
  if (query) {
    aggregate.match({
      $or: [
        { title: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } }
      ]
    });
  }

  // Channel filter
  if (userId && isValidObjectId(userId)) {
    aggregate.match({
      owner: new mongoose.Types.ObjectId(userId)
    });
  }

  // Lookup channel info
  aggregate.lookup({
    from: "users",
    localField: "owner",
    foreignField: "_id",
    as: "channel"
  });

  // Unwind channel array
  aggregate.unwind({
    path: "$channel",
    preserveNullAndEmptyArrays: true
  });

  // Sorting
  aggregate.sort({
    [sortBy]: sortType === "asc" ? 1 : -1
  });

  // Projection
  aggregate.project({
    _id: 1,
    title: 1,
    description: 1,
    thumbnail: 1,
    videoFile: 1,
    duration: 1,
    views: 1,
    createdAt: 1,
    isPublished: 1,
    channel: {
      _id: 1,
      username: 1,
      avatar: 1,
      coverImage: 1
    }
  });

  // Pagination
  const videos = await Video.aggregatePaginate(aggregate, {
    page,
    limit,
    customLabels: {
      docs: "videos",
      totalDocs: "totalVideos"
    }
  });

  return res.status(200).json(
    new ApiResponse(200, videos, "Videos fetched successfully")
  );
});
*/