import mongoose, {isValidObjectId} from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }

    const pageNum = Number(page);
    const limitNum = Number(limit);

    const aggregate = Comment.aggregate([
        {
            $match: { video: new mongoose.Types.ObjectId(videoId) }
        },
        {
            $lookup: {                                                         //lookup returns an array of objects(here stored in owner)
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },
        // {                                                                    //this can also be used, uniwnd coverts all object in array to separate documents
        //     $unwind: {
        //         path: "$owner",
        //         preserveNullAndEmptyArrays: true
        //     }
        // },
        {                                                                       //first give first element(object) of owner array to owner field(to convert array to object)
            $addFields: {
                owner: { $first: "$owner" }
            }
        },                                                        
        {
            $project: {
                content: 1,
                createdAt: 1,
                owner: {
                _id: 1,
                username: 1,
                avatar: 1
                }
            }
        },
        {
            $sort: { createdAt: -1 }
        }
    ]);
    
    const comments = await Comment.aggregatePaginate(aggregate, {                                           //the aggregate paginate response contains total number of docs, which can be used to display number of comments
        page: pageNum,
        limit: limitNum
    });

    return res
        .status(200)
        .json(new ApiResponse(200, comments, "Comments fetched successfully"));
});


const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {content} = req.body
    const {videoId} = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }

    if (!content || !content.trim()) {
        throw new ApiError(400, "Comment content required");
    }
    
    const newComment = await Comment.create({
        content,
        owner: req.user._id,
        video: videoId
    })

    return res
    .status(201)
    .json(new ApiResponse(201, newComment, "Comment added"));
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const { commentId } = req.params;
    const { content } = req.body;

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment id");
    }

    const comment = await Comment.findById(commentId);
    if (!comment) throw new ApiError(404, "Comment not found");

    if (!comment.owner.equals(req.user._id)) {
        throw new ApiError(403, "Not authorized");
    }

    if (!content || !content.trim()) {
        throw new ApiError(400, "Comment content required");
    }


    comment.content = content;
    await comment.save();

    return res
        .status(200)
        .json(new ApiResponse(200, comment, "Comment updated"));
});


const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const { commentId } = req.params;

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment id");
    }

    const comment = await Comment.findById(commentId);
    if (!comment) throw new ApiError(404, "Comment not found");

    if (!comment.owner.equals(req.user._id)) {
        throw new ApiError(403, "Not authorized");
    }

    await Comment.findByIdAndDelete(commentId);

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Comment deleted"));
});


export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
}