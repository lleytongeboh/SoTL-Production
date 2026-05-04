import { Response } from "express";
import Badge from "../models/Badge";
import Project from "../models/Project";
import Deliverables from "../models/Deliverables";
import mongoose, { isValidObjectId } from "mongoose";
import { successResponse, errorResponse } from "../utils/response";
import { AuthRequest } from "../middlewares/authMiddleware";
import * as GamificationService from "../services/GamificationService";
import { checkDifference } from "../utils/methods";

const getBadgeList = async (req: AuthRequest, res: Response) => {
  try {
    const result = await GamificationService.getBatchListWithAndWithoutBadge();
    res
      .status(200)
      .json(successResponse(result, "Badge list retrieved successfully"));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
};

const getBadge = async (req: AuthRequest, res: Response) => {
  try {
    const { badgeId } = req.params;
    if (!isValidObjectId(badgeId)) {
      throw new Error("Invalid badge id");
    }
    const result = await GamificationService.getBadge(badgeId);
    res
      .status(200)
      .json(successResponse(result, "Badge retrieved successfully"));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
};

const updateBadge = async (req: AuthRequest, res: Response) => {
  try {
    const { badgeId } = req.params;
    const { name, description, color, deliverableCompletion } = req.body;
    let hadChanges = false;
    if (!isValidObjectId(badgeId)) {
      throw new Error("Invalid badge id");
    }
    const badgeFind = await GamificationService.getBadge(badgeId);
    const badgeUpdated = await Badge.findById(badgeId);
    if (!badgeFind || !badgeUpdated) {
      throw new Error("Badge not found");
    }

    if (name !== undefined) {
      badgeUpdated.name = name;
      hadChanges = true;
    }

    if (description !== undefined) {
      badgeUpdated.description = description;
      hadChanges = true;
    }

    if (color !== undefined) {
      badgeUpdated.color = color;
      hadChanges = true;
    }

    if (
      deliverableCompletion === undefined &&
      badgeFind.deliverable_completion.length > 0
    ) {
      badgeFind.deliverable_completion = [];
    } else if (deliverableCompletion !== undefined) {
      const { isAdd, isRemove, addArray, removeArray } = checkDifference(
        badgeFind.deliverableCompletion.map(
          (x: { _id: string; name: string }) => x.name
        ),
        deliverableCompletion
      );
      // If isAdd is true, add the deliverable to the badge
      if (isAdd) {
        const deliverables = await Deliverables.find({
          name: { $in: addArray },
        });
        for (const addItem of addArray) {
          if (!deliverables.some((x: { name: string }) => x.name === addItem)) {
            throw new Error(`Deliverable ${addItem} not found`);
          }

          const deliverable = deliverables.find(
            (x: { name: string }) => x.name === addItem
          );
          if (deliverable) {
            badgeUpdated.deliverable_completion.push(
              deliverable._id as mongoose.Types.ObjectId
            );
            hadChanges = true;
          }
        }
      }

      // If isRemove is true, remove the deliverable from the badge
      if (isRemove) {
        for (const removeItem of removeArray) {
          if (
            !badgeFind.deliverableCompletion.some(
              (x: { name: string }) => x.name === removeItem
            )
          ) {
            throw new Error(`Deliverable ${removeItem} not found`);
          }
          const deliverable = badgeFind.deliverableCompletion.find(
            (x: { name: string }) => x.name === removeItem
          );
          if (deliverable) {
            badgeUpdated.deliverable_completion =
              badgeUpdated.deliverable_completion.filter(
                (x: mongoose.Types.ObjectId) => !x.equals(deliverable._id)
              );
            hadChanges = true;
          }
        }
      }
    }

    if (!hadChanges) {
      throw new Error("No changes detected");
    }

    if (hadChanges) await badgeUpdated.save();

    res.status(200).json(successResponse(true, "Badge updated successfully"));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
};

const createBadge = async (req: AuthRequest, res: Response) => {
  try {
    const { batch, name, description, color, deliverableCompletion } = req.body;
    const missingFields = [];

    //Validator
    if (!name) missingFields.push("name");
    if (!description) missingFields.push("description");
    if (!color) missingFields.push("color");
    if (!deliverableCompletion) missingFields.push("deliverableCompletion");
    if (!batch) missingFields.push("batch");

    if (missingFields.length > 0) {
      throw new Error(`Missing fields: ${missingFields.join(", ")}`);
    }

    const badgeExists = await Badge.findOne({ name: name, batch: batch });
    if (badgeExists) {
      throw new Error("Badge already exists");
    }

    // Check if deliverables exist
    const deliverables = await Deliverables.find({
      batch: batch,
      name: { $in: deliverableCompletion },
    });
    if (deliverables.length !== deliverableCompletion.length) {
      throw new Error("Deliverables not found");
    }

    const badgeOrder =
      (await Badge.find({ batch: batch }).countDocuments()) + 1;

    const badge = new Badge({
      batch,
      name,
      description,
      color,
      order: badgeOrder,
      deliverable_completion: deliverables.map(
        (x: { _id: any }) => x._id as mongoose.Types.ObjectId
      ),
    });

    await badge.save();
    res.status(200).json(successResponse(true, "Badge created successfully"));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
};

const updateBadgeOrderAndRemoveBadge = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { batch, badges } = req.body;
    const missingFields = [];
    if (!batch) missingFields.push("batch");
    if (!badges) missingFields.push("badges");

    if (missingFields.length > 0) {
      throw new Error(`Missing fields: ${missingFields.join(", ")}`);
    }

    const badgeList = await Badge.find({ batch: batch });
    if (badgeList.length === 0) {
      throw new Error("No badges found");
    }

    // Check if all badges exist
    const { isRemove, removeArray } = checkDifference(
      badgeList.map((x: { _id: any }) => String(x._id)),
      badges.map((x: { _id: any }) => String(x._id))
    );

    // If badges need to be removed, delete them in a single batch
    if (isRemove && removeArray.length > 0) {
      const validRemoveArray = removeArray.filter(isValidObjectId);
      if (validRemoveArray.length !== removeArray.length) {
        throw new Error("One or more invalid badge IDs in the remove list");
      }

      await Badge.deleteMany({ _id: { $in: validRemoveArray } });

      const project = await Project.find({ badges: { $in: validRemoveArray } });

      for (const proj of project) {
        if (!proj.badges) {
          continue;
        }
        proj.badges = proj.badges?.filter(
          (x: mongoose.Types.ObjectId) => !validRemoveArray.includes(String(x))
        );
        await proj.save();
      }
    }

    // Prepare bulk update operations for badge ordering
    const bulkOps = badges.map((badgeItem: { _id: any, order: number }) => ({
      updateOne: {
        filter: { _id: badgeItem._id },
        update: { $set: { order: badgeItem.order } },
      },
    }));

    if (bulkOps.length > 0) {
      await Badge.bulkWrite(bulkOps);
    }

    res.status(200).json(successResponse(true, "Badge order updated successfully"));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
};

const getLeaderboard = async (req: AuthRequest, res: Response) => {
  try{
    const result = await GamificationService.getLeaderboardData();
    res.status(200).json(successResponse(result, "Leaderboard retrieved successfully"));
  } catch (error: any){
    res.status(500).json(errorResponse(error.message));
  }
};

export default {
  getBadgeList,
  getBadge,
  updateBadge,
  createBadge,
  updateBadgeOrderAndRemoveBadge,
  getLeaderboard
};
