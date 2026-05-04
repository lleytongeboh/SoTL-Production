import { BatchStudents, BatchStudentAction } from "../models";
import _ from "lodash";

export const batchStudentReducer = (state: BatchStudents, action: BatchStudentAction) => {
    switch(action.type) {
        case "INIT":
            return [...action.payload];
        case "ADD_STUDENT":
            return state.map(b => {
                if (b._id === action.payload.batch._id) {
                    console.log('add student Reducer', action.payload.student);
                    return {
                        ...b,
                        belonged: [...b.belonged, action.payload.student]
                    };
                }
                return b;
            });
        case "EDIT_STUDENT":
            return state.map(b => {
                if (b._id === action.payload.batch._id) {
                    return {
                        ...b,
                        belonged: b.belonged.map(s => {
                            if (s._id === action.payload.student._id) {
                                return action.payload.student;
                            }
                            return s;
                        })
                    };
                }
                return b;
            });
        case "DELETE_STUDENT":
            return state.map(b => {
                if (b._id === action.payload.batch._id) {
                    const filtered = b.belonged.filter(s => s._id !== action.payload.student._id);
                    return {
                        ...b,
                        belonged: filtered
                    };
                }
                return b;
            });
        case "ADD_BATCH":
            return [...state, action.payload.BatchStudent];
        case "EDIT_BATCH":
            return state.map(b => {
                if (b._id === action.payload.batch._id) {
                    return {
                        ...b,
                        batch: action.payload.batch.name
                    };
                }
                return b;
            });
        case "DELETE_BATCH":
            return state.filter(b => b._id !== action.payload.batch._id);
        case "TOGGLE_MARK":
            return state.map(b => {
                if (b._id === action.payload.batch._id) {
                    return {
                        ...b,
                        visibleMark: action.payload.visible
                    };
                }
                return b;
            });
        case "BULK_IMPORT_STUDENTS":
            return state.map(b => {
                if (b._id === action.payload.batch._id) {
                    return {
                        ...b,
                        belonged: [...b.belonged, ...action.payload.students]
                    };
                }
                return b;
            });
        default:
            return state;
    }
};