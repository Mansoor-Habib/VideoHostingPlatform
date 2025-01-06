import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.models.js";
import { Subscription } from "../models/subscription.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Toggle subscription for a channel
const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const subscriberId = req.user.id; // Assuming `req.user` contains the authenticated user's info

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel ID");
  }

  if (subscriberId === channelId) {
    throw new ApiError(400, "You cannot subscribe to your own channel");
  }

  const existingSubscription = await Subscription.findOne({
    channel: channelId,
    subscriber: subscriberId,
  });

  if (existingSubscription) {
    await existingSubscription.remove();
    res
      .status(200)
      .json(new ApiResponse(200, true, "Unsubscribed from the channel"));
  } else {
    await Subscription.create({ channel: channelId, subscriber: subscriberId });
    res
      .status(201)
      .json(new ApiResponse(201, true, "Subscribed to the channel"));
  }
});

// Get the subscriber list for a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel ID");
  }

  const subscribers = await Subscription.find({ channel: channelId })
    .populate("subscriber", "name email")
    .exec();

  res.status(200).json(new ApiResponse(200, true, { subscribers }));
});

// Get the list of channels a user has subscribed to
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const subscriberId = req.user.id; // Assuming `req.user` contains the authenticated user's info

  const subscriptions = await Subscription.find({ subscriber: subscriberId })
    .populate("channel", "name email")
    .exec();

  res.status(200).json(new ApiResponse(200, true, { subscriptions }));
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
