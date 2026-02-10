import { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";

export const verifyVideoOwnership = async (req, res, next) => {
  const { videoId } = req.params;

  // Validate ID
  if (!videoId) {
    throw new ApiError(400, "Video id is required");
  }

  if (isValidObjectId(videoId) === false) {
    throw new ApiError(400, "Invalid video id");
  }

  // Fetch video
  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  // Ownership check
  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to perform this action");
  }

  //attach video to req
  req.video = video;

  next();
};
