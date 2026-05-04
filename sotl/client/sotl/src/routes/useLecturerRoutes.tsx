// src/routes/StudentRoutes.tsx
import { Route } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import LecturerGroupManagement from '../pages/group/LecturerGroupList';
import LecturerProjectDeliverablesManagement from '../pages/project/LecturerProjectDeliverablesManagement';
import LecturerProjectMarkingManagement from '../pages/project/LecturerProjectMarkingList';

const useLecturerRoutes = () => {
  return (
    <Route element={<AdminLayout />}>
      <Route path="/admin">
        <Route path='group-management' element={<LecturerGroupManagement />} />
        <Route path='project-deliverable' element={<LecturerProjectDeliverablesManagement />} />
        <Route path='project-marking' element={<LecturerProjectMarkingManagement />} />
      </Route>
    </Route>
  );
};

export default useLecturerRoutes;