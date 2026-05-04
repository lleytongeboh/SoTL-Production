import { stderr } from "process";
import Group from "../models/Group";
import { ObjectId } from "mongoose";

export const getGroupId = async (student_id: ObjectId) : Promise<ObjectId> => {
    try {
        const group = await Group.findOne({ team_members: { $elemMatch: { student_id } }});  
        if (!group) {
            throw new Error('Group not found');
        }
        return group._id as ObjectId;
    } catch (err) {
        throw err;
    }
}