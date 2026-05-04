import React, { createContext, useState, useContext, ReactNode } from 'react';
import { Group } from '../models';

// Create the context
const GroupContext = createContext<any>(null);

// Custom hook to use the GroupContext
export const useGroup = () => useContext(GroupContext);

// Provider component
export const GroupProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  return (
    <GroupContext.Provider value={{ selectedGroup, setSelectedGroup }}>
      {children}
    </GroupContext.Provider>
  );
};