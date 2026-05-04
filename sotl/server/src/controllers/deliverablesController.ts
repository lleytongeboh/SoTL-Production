import { AuthRequest } from './../middlewares/authMiddleware';
import { Response } from "express";
import dotenv from 'dotenv';
import _ from 'lodash';
import { successResponse } from '../utils/response';
import Deliverables from '../models/Deliverables';
import Category from '../models/Category';
import Project from '../models/Project';
import { mainQueue } from '../queue/QueueManager';
import fs from 'fs';

dotenv.config();

// # Lecturer
const getDeliverable = async (req: AuthRequest, res: Response) => {
  try {
    const deliverable = await Deliverables.findById(req.params.id);
    res.json(successResponse(deliverable, "Deliverable fetched successfully"));
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

// # Student, Lecturer
const getDeliverablesList = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role === 'lecturer') {
      const list = await Deliverables.find();
      res.json(successResponse(list, "Deliverables list fetched successfully"));
    } else {
      const { batch } = req.query;
      const list = await Deliverables.find({ batch });
      res.json(successResponse(list, "Deliverables list fetched successfully"));
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// # Lecturer
const createDeliverable = async (req: AuthRequest, res: Response) => {
  try {
    const { name, batch, approve, start_at, end_at, isPublic, dependsOn } = req.body;
    const deliverableFound = await Deliverables.findOne({ batch: batch, name: name });
    if (deliverableFound) {
      throw new Error('Deliverable already exists');
    }
    const newDeliverable = new Deliverables({ name, batch, approve, start_at, end_at, isPublic, dependsOn: dependsOn || null });
    res.json(successResponse(await newDeliverable.save(), 'Deliverable created successfully'));
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// # Lecturer
const editDeliverable = async (req: AuthRequest, res: Response) => {
  try {
    const { name, batch, approve, start_at, end_at, isPublic, dependsOn } = req.body;
    const updatedDeliverable = await Deliverables.findByIdAndUpdate(req.params.id, { name, batch, approve, start_at, end_at, isPublic, dependsOn: dependsOn || null }, { new: true });
    res.json(successResponse(updatedDeliverable, 'Deliverable updated successfully'));
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// # Lecturer
const deleteDeliverable = async (req: AuthRequest, res: Response) => {
  try {
    const deliverable = await Deliverables.findById(req.params.id);
    if (deliverable) {
      const projectList = await Project.find({ deliverables: { $elemMatch: { deliverable_id: deliverable._id } } });
      projectList.map(async (project) => {
        mainQueue.add("deleteDeliverable", {
          jobType: "deleteDeliverable",
          data: {
            projectId: project._id,
            deliverableId: deliverable._id
          }
        });
      });
      await deliverable.deleteOne();
      await Deliverables.updateMany(
        { dependsOn: req.params.id },
        { $set: { dependsOn: null } }
      );
      res.json(successResponse(true, 'Deliverable deleted successfully'));
    } else {
      res.status(404).json({ message: 'Deliverable not found' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

const getDeliverableListByBatch = async (req: AuthRequest, res: Response) => {
  try {
    const list = await Category.aggregate([
      {
        $project:
        {
          _id: 1,
          name: 1,
          type: 1
        }
      },
      {
        $match:
        {
          type: 0
        }
      },
      {
        $lookup:
        {
          from: "deliverables",
          localField: "name",
          foreignField: "batch",
          as: "deliverables"
        }
      },
      {
        $unwind:
        {
          path: "$deliverables",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project:
        {
          _id: 1,
          name: 1,
          type: 1,
          deliverables: {
            _id: 1,
            name: 1,
            batch: 1
          }
        }
      },
      {
        $group:
        {
          _id: "$_id",
          name: {
            $first: "$name"
          },
          type: {
            $first: "$type"
          },
          deliverables: {
            $push: {
              _id: "$deliverables._id",
              name: "$deliverables.name",
              batch: "$deliverables.batch"
            }
          }
        }
      },
      {
        $project:
        {
          _id: 1,
          name: 1,
          deliverables: {
            $sortArray: {
              input: "$deliverables",
              sortBy: {
                _id: 1
              }
            }
          }
        }
      },
      {
        $sort:
        {
          _id: 1
        }
      }
    ]);
    res.status(200).json(successResponse(list, "Deliverables list fetched successfully"));
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const handleDeleteDeliverable = async (data: any) => {
  try {
    const project = await Project.findById(data.projectId);
    if (project) {
      // split deliverables into newDeliverables and removedDeliverables
      const { newDeliverables, removedDeliverables } = project.deliverables.reduce((acc: { newDeliverables: any[], removedDeliverables: any[] }, deliverable) => {
        if (deliverable.deliverable_id.toString() === data.deliverableId.toString()) {
          acc.removedDeliverables.push(deliverable);
        } else {
          acc.newDeliverables.push(deliverable);
        }
        return acc;
      }, { newDeliverables: [], removedDeliverables: [] });
      // remove deliverable file from public folder
      removedDeliverables.map(async (removedDeliverable) => {
        try {
          fs.unlinkSync(removedDeliverable.file_path_uri);
        } catch (error: any) {
          console.error(`Error deleting deliverable file: ${error}`);
        }
      });
      project.deliverables = newDeliverables;
      project.save();
    }
  } catch (error: any) {
    console.error(`Error deleting deliverable: ${error}`);
  }
};

export default {
  getDeliverable,
  getDeliverablesList,
  createDeliverable,
  editDeliverable,
  deleteDeliverable,
  getDeliverableListByBatch,
};