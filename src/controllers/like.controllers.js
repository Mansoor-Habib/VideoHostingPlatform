import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Toggle like on a video
const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user.id; // Assuming `req.user` contains the authenticated user's info

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const existingLike = await Like.findOne({ video: videoId, user: userId });

  if (existingLike) {
    await existingLike.remove();
    return res
      .status(200)
      .json(new ApiResponse(200, true, "Like removed from video"));
  }

  await Like.create({ video: videoId, user: userId });
  res.status(201).json(new ApiResponse(201, true, "Like added to video"));
});

// Toggle like on a comment
const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user.id;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment ID");
  }

  const existingLike = await Like.findOne({ comment: commentId, user: userId });

  if (existingLike) {
    await existingLike.remove();
    return res
      .status(200)
      .json(new ApiResponse(200, true, "Like removed from comment"));
  }

  await Like.create({ comment: commentId, user: userId });
  res.status(201).json(new ApiResponse(201, true, "Like added to comment"));
});

// Toggle like on a tweet
const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const userId = req.user.id;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet ID");
  }

  const existingLike = await Like.findOne({ tweet: tweetId, user: userId });

  if (existingLike) {
    await existingLike.remove();
    return res
      .status(200)
      .json(new ApiResponse(200, true, "Like removed from tweet"));
  }

  await Like.create({ tweet: tweetId, user: userId });
  res.status(201).json(new ApiResponse(201, true, "Like added to tweet"));
});

// Get all liked videos by a user
const getLikedVideos = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 10 } = req.query;

  const likedVideos = await Like.find({
    user: userId,
    video: { $exists: true },
  })
    .populate("video", "title views createdAt") // Assuming the `video` field is populated with relevant video info
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const totalLikedVideos = await Like.countDocuments({
    user: userId,
    video: { $exists: true },
  });

  res.status(200).json(
    new ApiResponse(200, true, {
      likedVideos,
      totalLikedVideos,
      currentPage: page,
      totalPages: Math.ceil(totalLikedVideos / limit),
    })
  );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
