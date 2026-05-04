// src/services/QueueManager.ts
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

export const redisConnection = new Redis({
  host: process.env.REDIS_HOST || 'redis',
  port: Number(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: null,
  reconnectOnError: () => true,  // Auto-reconnect on errors
});

export const mainQueue = new Queue('mainQueue', { connection: redisConnection });