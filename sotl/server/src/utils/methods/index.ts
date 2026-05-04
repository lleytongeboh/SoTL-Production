import { faker } from "@faker-js/faker";
import { hashPassword, verifyPassword } from "./password_hashing";
export { hashPassword, verifyPassword };

export function generateRandomPassword(): string {
  return faker.internet.password({ length: 8 }); // 8-character random password
}

export const areBatchesEqual = (
  existingBatches: { batch: string }[],
  newBatches: string[]
): boolean => {
  if (existingBatches.length !== newBatches.length) return false;

  const existingBatchNames = existingBatches.map((b) => b.batch).sort();
  const newBatchNames = newBatches.sort();

  return existingBatchNames.every(
    (batch, index) => batch === newBatchNames[index]
  );
};

export const checkBatches = (
  existingBatches: { batch: string }[],
  newBatches: string[]
): {
  isAdd: boolean;
  isRemove: boolean;
  addBatchArray: string[];
  removeBatchArray: string[];
} => {
  let isAdd = false;
  let isRemove = false;
  let addBatchArray: string[] = [];
  let removeBatchArray: string[] = [];

  const existingBatchNamesSet = new Set(existingBatches.map((b) => b.batch));
  const newBatchNamesSet = new Set(newBatches);

  // Check for removed batches
  existingBatchNamesSet.forEach((batch) => {
    if (!newBatchNamesSet.has(batch)) {
      removeBatchArray.push(batch);
      isRemove = true;
    }
  });

  // Check for added batches
  newBatchNamesSet.forEach((batch) => {
    if (!existingBatchNamesSet.has(batch)) {
      addBatchArray.push(batch);
      isAdd = true;
    }
  });

  return { isAdd, isRemove, addBatchArray, removeBatchArray };
};

export const checkDifference = (
  existData: string[],
  newData: string[]
): {
  isAdd: boolean;
  isRemove: boolean;
  addArray: string[];
  removeArray: string[];
} => {
  let isAdd = false;
  let isRemove = false;
  let addArray: string[] = [];
  let removeArray: string[] = [];

  const existingSet = new Set(existData);
  const newSet = new Set(newData);

  // Check for removed batches
  existingSet.forEach((d) => {
    if (!newSet.has(d)) {
      removeArray.push(d);
      isRemove = true;
    }
  });

  // Check for added batches
  newSet.forEach((d) => {
    if (!existingSet.has(d)) {
      addArray.push(d);
      isAdd = true;
    }
  });

  return { isAdd, isRemove, addArray, removeArray };
};
