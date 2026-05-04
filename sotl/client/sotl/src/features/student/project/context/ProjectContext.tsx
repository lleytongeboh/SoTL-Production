import React, { createContext, useState, useContext, ReactNode } from 'react';
import { Project } from '../models';

// Create the context
const ProjectContext = createContext<any>(null);

// Custom hook to use the ProjectContext
export const useProject = () => useContext(ProjectContext);

// Provider component
export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  return (
    <ProjectContext.Provider value={{ selectedProject, setSelectedProject }}>
      {children}
    </ProjectContext.Provider>
  );
};