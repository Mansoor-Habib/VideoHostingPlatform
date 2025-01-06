import mongoose from "mongoose";
import { Comment } from "../models/comment.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Get all comments for a video
const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const comments = await Comment.find({ video: videoId })
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .sort({ createdAt: -1 }); // Sort by newest first

  const totalComments = await Comment.countDocuments({ video: videoId });

  res.status(200).json(
    new ApiResponse(200, true, {
      comments,
      totalComments,
      currentPage: page,
      totalPages: Math.ceil(totalComments / limit),
    })
  );
});

// Add a comment to a video
const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { text } = req.body;

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  if (!text || text.trim() === "") {
    throw new ApiError(400, "Comment text is required");
  }

  const newComment = await Comment.create({
    video: videoId,
    text,
    user: req.user.id, // Assuming req.user contains authenticated user info
  });

  res.status(201).json(new ApiResponse(201, true, newComment));
});

// Update a comment
const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { text } = req.body;

  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    throw new ApiError(400, "Invalid comment ID");
  }

  if (!text || text.trim() === "") {
    throw new ApiError(400, "Updated text is required");
  }

  const updatedComment = await Comment.findOneAndUpdate(
    { _id: commentId, user: req.user.id }, // Ensuring only the author can update
    { text },
    { new: true }
  );

  if (!updatedComment) {
    throw new ApiError(404, "Comment not found or not authorized to update");
  }

  res.status(200).json(new ApiResponse(200, true, updatedComment));
});

// Delete a comment
const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    throw new ApiError(400, "Invalid comment ID");
  }

  const deletedComment = await Comment.findOneAndDelete({
    _id: commentId,
    user: req.user.id, // Ensuring only the author can delete
  });

  if (!deletedComment) {
    throw new ApiError(404, "Comment not found or not authorized to delete");
  }

  res
    .status(200)
    .json(new ApiResponse(200, true, "Comment deleted successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
