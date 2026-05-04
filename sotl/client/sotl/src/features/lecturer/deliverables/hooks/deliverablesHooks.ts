import { useState } from "react";
import { Deliverable } from "../models";
import { getDeliverablesListCall } from "../services/getDeliverablesListCall";
import { createDeliverableCall } from "../services/createDeliverableCall";
import { getDeliverableCall } from "../services/getDeliverableCall";
import { editDeliverableCall } from "../services/editDeliverableCall";
import { deleteDeliverableCall } from "../services/deleteDeliverableCall";

export const deliverablesHooks = () => {
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    const getDeliverable = async (deliverableId: string): Promise<Deliverable> => {
        try {
            setLoading(true);
            const response = await getDeliverableCall(deliverableId);
            setError(null);
            setLoading(false);
            return response;
        } catch (error) {
            setError((error as Error).message);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const getDeliverablesList = async (batch?: string): Promise<Deliverable[]> => {
        try {
            const response = await getDeliverablesListCall(batch);
            setError(null);
            return response;
        } catch (error) {
            setError((error as Error).message);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const createDeliverable = async (deliverable: Deliverable): Promise<Deliverable> => {
        try {
            const response = await createDeliverableCall(deliverable);
            setError(null);
            return response;
        } catch (error) {
            setError((error as Error).message);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const editDeliverable = async (deliverable: Deliverable): Promise<Deliverable> => {
        try {
            const response = await editDeliverableCall(deliverable);
            setError(null);
            return response;
        } catch (error) {
            setError((error as Error).message);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const deleteDeliverable = async (deliverableId: string): Promise<boolean> => {
        try {
            const response = await deleteDeliverableCall(deliverableId);
            setError(null);
            return response;
        } catch (error) {
            setError((error as Error).message);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return { getDeliverable, getDeliverablesList, createDeliverable, editDeliverable, deleteDeliverable, error, loading };
}