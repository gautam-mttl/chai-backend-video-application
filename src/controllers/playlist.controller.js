import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import { Video } from "../models/video.model.js";
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const checkOwner = (playlist, userId) => {
    if (!playlist.owner.equals(userId)) {
        throw new ApiError(403, "Not authorized");
    }
};

const createPlaylist = asyncHandler(async (req, res) => {
    //TODO: create playlist
    const {name, description} = req.body

    if(!name?.trim() || !description?.trim()){
        throw new ApiError(400, "Name and description are required")
    }

    const existing = await Playlist.findOne({
        name: name.trim(),
        owner: req.user._id
    })
    if (existing) {
        throw new ApiError(400, "Playlist with this name already exists");
    }

    try {
        const playlist = await Playlist.create({
            name: name.trim(),
            description: description.trim(),
            owner: req.user._id
        })

        return res.status(201).json(new ApiResponse(201, playlist, "Playlist created"));

    } catch (error) {
        throw new ApiError(500, "Server side error in creating playlist");
    }
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user id");
    }

    const playlists = await Playlist.find({ owner: userId })
        .sort({ createdAt: -1 });

    return res.status(200).json(
        new ApiResponse(200, playlists, "Playlists fetched")
    );
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist id");
    }

    const playlist = await Playlist.findById(playlistId)
        .populate("videos", "title thumbnail duration");

    if (!playlist) throw new ApiError(404, "Playlist not found");

    //checkOwner(playlist, req.user._id);                                           //there are public playlists too

    return res.status(200).json(
        new ApiResponse(200, playlist, "Playlist fetched")
    );
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid ids");
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) throw new ApiError(404, "Playlist not found");

    checkOwner(playlist, req.user._id);
    
    const videoExist = await Video.findById(videoId);
    if (!videoExist) throw new ApiError(404, "Video not found");

    // if (playlist.videos.includes(videoId)) {
    //     throw new ApiError(400, "Video already added");
    // }

    // playlist.videos.push(videoId);
    // await playlist.save();

    const updatedPlaylist = await Playlist.findByIdAndUpdate( playlistId,
        { $addToSet: { videos: videoId } },                         // prevents duplicates
        { new: true }
    ).populate("videos", "title thumbnail");

    return res.status(200).json(
        new ApiResponse(200, updatedPlaylist, "Video added")
    );
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid ids");
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) throw new ApiError(404, "Playlist not found");

    checkOwner(playlist, req.user._id);

    const updatedPlaylist = await Playlist.findByIdAndUpdate( playlistId,
        { $pull: { videos: videoId } },                                     // removes if exists
        { new: true }
    ).populate("videos", "title thumbnail");

    return res.status(200).json(
        new ApiResponse(200, updatedPlaylist, "Video removed from playlist")
    );
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) throw new ApiError(404, "Playlist not found");

    checkOwner(playlist, req.user._id);

    await playlist.deleteOne();

    return res.status(200).json(
        new ApiResponse(200, {}, "Playlist deleted")
    );
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) throw new ApiError(404, "Playlist not found");

    checkOwner(playlist, req.user._id);

    if (!name && !description) {
        throw new ApiError(400, "Name or description required");
    }

    if (name) {playlist.name = name.trim()};
    if (description) {playlist.description = description.trim()};

    await playlist.save();

    return res.status(200).json(
        new ApiResponse(200, playlist, "Playlist updated")
    );
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}