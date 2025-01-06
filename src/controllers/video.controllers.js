import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.models.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// Get all videos based on query, sort, and pagination
const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query = "",
    sortBy = "createdAt",
    sortType = "desc",
    userId,
  } = req.query;

  const filter = query ? { title: { $regex: query, $options: "i" } } : {};
  if (userId) filter.author = userId;

  const videos = await Video.find(filter)
    .sort({ [sortBy]: sortType === "asc" ? 1 : -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Video.countDocuments(filter);

  res.status(200).json(
    new ApiResponse(200, true, {
      videos,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
      },
    })
  );
});

// Publish a new video
const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const userId = req.user.id; // Assuming req.user contains authenticated user info
  const videoFile = req.file;

  if (!videoFile) {
    throw new ApiError(400, "Video file is required");
  }

  // Upload video to Cloudinary
  const uploadResult = await uploadOnCloudinary(videoFile.path, "video");

  // Create video entry in the database
  const video = await Video.create({
    title,
    description,
    videoUrl: uploadResult.secure_url,
    author: userId,
    cloudinaryId: uploadResult.public_id,
  });

  res.status(201).json(new ApiResponse(201, true, { video }));
});

// Get a video by ID
const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const video = await Video.findById(videoId).populate("author", "name");

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  res.status(200).json(new ApiResponse(200, true, { video }));
});

// Update video details
const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description, thumbnail } = req.body;
  const userId = req.user.id;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const video = await Video.findOne({ _id: videoId, author: userId });

  if (!video) {
    throw new ApiError(404, "Video not found or unauthorized");
  }

  if (title) video.title = title;
  if (description) video.description = description;
  if (thumbnail) video.thumbnail = thumbnail;

  await video.save();

  res.status(200).json(new ApiResponse(200, true, { video }));
});

// Delete a video
const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user.id;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const video = await Video.findOne({ _id: videoId, author: userId });

  if (!video) {
    throw new ApiError(404, "Video not found or unauthorized");
  }

  // Remove video from Cloudinary
  await uploadOnCloudinary(video.cloudinaryId, "destroy");

  await video.remove();

  res
    .status(200)
    .json(new ApiResponse(200, true, "Video deleted successfully"));
});

// Toggle video publish status
const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user.id;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const video = await Video.findOne({ _id: videoId, author: userId });

  if (!video) {
    throw new ApiError(404, "Video not found or unauthorized");
  }

  video.isPublished = !video.isPublished;
  await video.save();

  res.status(200).json(new ApiResponse(200, true, { video }));
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
