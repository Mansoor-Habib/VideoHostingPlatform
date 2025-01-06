import mongoose from "mongoose";
import { Video } from "../models/video.models.js";
import { Subscription } from "../models/subscription.models.js";
import { Like } from "../models/like.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Get channel statistics
const getChannelStats = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(channelId)) {
    throw new ApiError(400, "Invalid channel ID");
  }

  const totalVideos = await Video.countDocuments({ channel: channelId });
  const totalViews = await Video.aggregate([
    { $match: { channel: mongoose.Types.ObjectId(channelId) } },
    { $group: { _id: null, totalViews: { $sum: "$views" } } },
  ]);

  const totalSubscribers = await Subscription.countDocuments({
    channel: channelId,
  });

  const totalLikes = await Like.aggregate([
    { $match: { channel: mongoose.Types.ObjectId(channelId) } },
    { $group: { _id: null, totalLikes: { $sum: 1 } } },
  ]);

  res.status(200).json(
    new ApiResponse(200, true, {
      totalVideos,
      totalViews: totalViews[0]?.totalViews || 0,
      totalSubscribers,
      totalLikes: totalLikes[0]?.totalLikes || 0,
    })
  );
});

// Get all videos uploaded by the channel
const getChannelVideos = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!mongoose.Types.ObjectId.isValid(channelId)) {
    throw new ApiError(400, "Invalid channel ID");
  }

  const videos = await Video.find({ channel: channelId })
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .sort({ createdAt: -1 }); // Sort videos by newest first

  const totalVideos = await Video.countDocuments({ channel: channelId });

  res.status(200).json(
    new ApiResponse(200, true, {
      videos,
      totalVideos,
      currentPage: page,
      totalPages: Math.ceil(totalVideos / limit),
    })
  );
});

export { getChannelStats, getChannelVideos };
