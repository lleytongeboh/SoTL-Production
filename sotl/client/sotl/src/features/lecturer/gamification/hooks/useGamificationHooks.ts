import React from "react";
import { API_BASE_URL } from "../../../../configs/sotl-config";
import { standardApi } from "../../../../utils/standardApi";
import { BadgeList, Badge, Deliverable, EditBadgePayload, BadgeCreated, EditBadgeOrderingRemovePayload, LeaderboardProps } from "../models";

export const useGamificationHooks = () => {
  const getBadgeList = async (): Promise<BadgeList[]> => {
    try {
      const result = await standardApi(
        `${API_BASE_URL}/api/gamification/badge-list`,
        "GET",
        true
      );
      return result.result as BadgeList[];
    } catch (error: any) {
      throw new Error(error.response.data?.message);
    }
  };

  const getBadge = async (id: string): Promise<Badge> => {
    try {
      const result = await standardApi(
        `${API_BASE_URL}/api/gamification/badge/${id}`,
        "GET",
        true
      );
      return result.result as Badge;
    } catch (error: any) {
      throw new Error(error.response.data?.message);
    }
  };

  const getDeliverableList = async (): Promise<Deliverable[]> => {
    try {
      const result = await standardApi(
        `${API_BASE_URL}/api/deliverables/getDeliverablesList`,
        "GET",
        true
      );
      return result.result as Deliverable[];
    } catch (error: any) {
      throw new Error(error.response.data?.message);
    }
  };

  const saveBadge = async (
    badgeId: string,
    payload: EditBadgePayload
  ): Promise<boolean> => {
    try {
      const result = await standardApi(
        `${API_BASE_URL}/api/gamification/badge/${badgeId}`,
        "PUT",
        true,
        payload
      );
      return result.result as boolean;
    } catch (error: any) {
      throw new Error(error.response.data?.message);
    }
  };

  const createBadge = async (payload: BadgeCreated): Promise<boolean> => {
    try {
      const result = await standardApi(
        `${API_BASE_URL}/api/gamification/badge`,
        "POST",
        true,
        payload
      );
      return result.result as boolean;
    } catch (error: any) {
      throw new Error(error.response.data?.message);
    }
  };

  const updateBadgeOrderingAndRemove = async (payload: EditBadgeOrderingRemovePayload): Promise<boolean> => {
    try {
      const result = await standardApi(
        `${API_BASE_URL}/api/gamification/badge-order`,
        "PUT",
        true,
        payload
      );
      return result.result as boolean;
    } catch (error: any) {
      throw new Error(error.response.data?.message);
    }
  };

  const getLeaderboard = async (): Promise<LeaderboardProps[]> => {
    try {
      const result = await standardApi(
        `${API_BASE_URL}/api/gamification/leaderboard`,
        "GET",
        true
      );
      return result.result as LeaderboardProps[];
    } catch (error: any) {
      throw new Error(error.response.data?.message);
    } 
  };

  return {
    getBadgeList,
    getBadge,
    getDeliverableList,
    saveBadge,
    createBadge,
    updateBadgeOrderingAndRemove,
    getLeaderboard
  };
};
