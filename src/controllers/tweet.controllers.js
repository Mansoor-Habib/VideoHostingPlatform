import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.models.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Create a new Tweet
const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const userId = req.user.id; // Assuming `req.user` contains authenticated user info

  if (!content || content.trim().length === 0) {
    throw new ApiError(400, "Tweet content cannot be empty");
  }

  const tweet = await Tweet.create({ content, author: userId });

  res.status(201).json(new ApiResponse(201, true, { tweet }));
});

// Get Tweets by a User
const getUserTweets = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  const tweets = await Tweet.find({ author: userId })
    .sort({ createdAt: -1 })
    .exec();

  res.status(200).json(new ApiResponse(200, true, { tweets }));
});

// Update a Tweet
const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const { content } = req.body;
  const userId = req.user.id;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet ID");
  }

  const tweet = await Tweet.findOne({ _id: tweetId, author: userId });

  if (!tweet) {
    throw new ApiError(404, "Tweet not found or unauthorized");
  }

  if (!content || content.trim().length === 0) {
    throw new ApiError(400, "Tweet content cannot be empty");
  }

  tweet.content = content;
  await tweet.save();

  res.status(200).json(new ApiResponse(200, true, { tweet }));
});

// Delete a Tweet
const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const userId = req.user.id;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet ID");
  }

  const tweet = await Tweet.findOne({ _id: tweetId, author: userId });

  if (!tweet) {
    throw new ApiError(404, "Tweet not found or unauthorized");
  }

  await tweet.remove();

  res
    .status(200)
    .json(new ApiResponse(200, true, "Tweet deleted successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
