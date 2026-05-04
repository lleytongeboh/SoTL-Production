// src/routes/AppRoutes.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginLayout from '../layouts/LoginLayout';
import Login from '../pages/Login';
import ForgetPassword from '../pages/ForgetPassword';
import StudentLayout from '../layouts/StudentLayout';
import ProjectDetails from '../pages/project/ProjectDetails';
import Todos from '../pages/project/Todos';
import Forum from '../pages/project/Forum';
import Submission from '../pages/project/Submission';
import Missing from '../pages/Missing';
import RequireAuth from '../features/auth/components/RequireAuth'
import Unauthorized from '../pages/Unauthorized';
import GroupList from '../pages/group/GroupList';
import GroupCreate from '../pages/group/GroupCreate';
import GroupManage from '../pages/group/GroupManage';
import { GroupProvider } from '../features/student/group/context/GroupContext';
import ProjectCreate from '../pages/project/ProjectCreate';
import { ProjectProvider } from '../features/student/project/context/ProjectContext';
import ProjectDetailsEdit from '../pages/project/ProjectDetailsEdit';
import ProjectRoleEdit from '../pages/project/ProjectRoleEdit';
import GroupJoin from '../pages/group/GroupJoin';
import AdminLayout from '../layouts/AdminLayout';
import LecturerProjectDeliverablesManagement from '../pages/project/LecturerProjectDeliverablesManagement';
import LecturerGroupList from '../pages/group/LecturerGroupList';
import LecturerProjectDeliverablesCreate from '../pages/project/LecturerProjectDeliverablesCreate';
import LecturerGroupManage from '../pages/group/LecturerGroupManage';
import LecturerGroupEdit from '../pages/group/LecturerGroupEdit';
import LecturerProjectEdit from '../pages/project/LecturerProjectEdit';
import GroupEdit from '../pages/group/GroupEdit';
import LecturerMarkEdit from '../pages/project/LecturerMarkEdit';
import LoadingPopup from '../components/LoadingPopup';
import React, { Suspense } from 'react';
import GanttChart from '../pages/project/todos/GanttChart';
import BatchManagement from '../features/lecturer/user/pages/BatchManagement';
import AddBatch from '../features/lecturer/user/pages/AddBatch';
import EditBatch from '../features/lecturer/user/pages/EditBatch';
import StudentManagement from '../features/lecturer/user/pages/StudentManagement';
import AddStudent from '../features/lecturer/user/pages/AddStudent';
import BulkImportStudent from '../features/lecturer/user/pages/BulkImportStudent';
import { BatchStudentProvider } from '../features/lecturer/user/contexts/BatchStudentContext';
import UserManagementLayout from '../features/lecturer/user/layout/UserManagementLayout';
import ClientManagement from '../features/lecturer/user/pages/ClientManagement';
import AddClient from '../features/lecturer/user/pages/AddClient';
import ClientProfile from '../features/lecturer/user/pages/ClientProfile';
import StudentProfile from '../features/lecturer/user/pages/StudentProfile';
import UserProfile from '../features/profile/pages/UserProfile';
import StudentViewProfile from '../features/profile/pages/StudentViewProfile';
import BadgeManagement from '../features/lecturer/gamification/pages/BadgeManagement';
import BadgeProfile from '../features/lecturer/gamification/pages/BadgeProfile';
import AddBadge from '../features/lecturer/gamification/pages/AddBadge';
import LeaderBoard from '../features/lecturer/gamification/pages/Leaderboard';
import { FeedbackDialogProvider } from '../context/FeedbackDialog';
import { LoginProvider } from '../features/auth/context/LoginContext';
import ResettingPassword from '../pages/ResettingPassword';

// evaluation module
import ClientLayout from '../layouts/ClientLayout';
import QuizManage from '../pages/evaluation/quiz/QuizManage';
import QuizEdit from '../pages/evaluation/quiz/QuizEdit';
import AssessmentManage from '../pages/evaluation/AssessmentManage';
import AssessmentEdit from '../pages/evaluation/AssessmentEdit';
import AssessmentList from '../features/student/quiz/pages/AssessmentList';
import AssessmentQuiz from '../features/student/quiz/pages/AssessmentQuiz';
import AssessmentResultManage from '../pages/evaluation/AssessmentResultManage';

const AppRoutes = () => {
  const LazyMarkList = React.lazy(() => import('../pages/project/LecturerProjectMarkingList'));

  return (
    <Router>
      <Routes>
        {/* Redirect / to /login */}
        <Route element={<FeedbackDialogProvider />}>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="login" element={<LoginProvider><LoginLayout /></LoginProvider>}>
            <Route index element={<Login />} />
            <Route path="change-password" element={<ForgetPassword />} />
            <Route path='reset-password' element={<ResettingPassword />} />
          </Route>

          {/* student routes */}
          <Route element={<RequireAuth allowedRoles={['student']} />}>
            <Route path='student/*' element={<GroupProvider><ProjectProvider><StudentLayout /></ProjectProvider></GroupProvider>}>
              {/* Default redirect to project details if visiting /student/* directly */}
              <Route path="*" element={<Navigate to="project/details" replace />} />
              <Route path="project/*">
                <Route path="details" element={<ProjectDetails />} />
                <Route path='details'>
                  <Route path='edit' element={<ProjectDetailsEdit />} />
                  <Route path='editRole' element={<ProjectRoleEdit />} />
                </Route>
                <Route path="todos" element={<Todos readonly={false} />} />
                <Route path='todos/gantt-chart' element={<GanttChart />} />
                <Route path="forum" element={<Forum />} />
                <Route path="submission" element={<Submission />} />
                <Route path="create" element={<ProjectCreate />} />
              </Route>
              <Route path="group/*">
                <Route path="list" element={<GroupList />} />
                <Route path='join/:groupId' element={<GroupJoin />}></Route>
                <Route path="create" element={<GroupCreate />} />
                <Route path="manage" element={<GroupManage />} />
                <Route path="edit" element={<GroupEdit />} />
              </Route>
              <Route path='assessment'>
                <Route path='list' element={<AssessmentList />} />
                <Route path=':assessmentIdParam' element={<AssessmentQuiz />} />
                <Route path=':assessmentIdParam/page/:pageNum' element={<AssessmentQuiz />} />
              </Route>
              <Route path="leaderboard" element={<LeaderBoard />} />
              <Route path='profile' element={<UserProfile />} />
              <Route path='student-profile/:studentId' element={<StudentViewProfile />} />
            </Route>
          </Route>

          {/* lecturer routes */}
          <Route element={<RequireAuth allowedRoles={['lecturer']} />}>
            <Route path="lecturer/*" element={<AdminLayout />}>
              {/* Default redirect to project details if visiting /student/* directly */}
              <Route path="*" element={<Navigate to="user-management/batch" replace />} />
              <Route path="group/*">
                <Route path='list' element={<LecturerGroupList />} />
                <Route path='manage/:groupId' element={<LecturerGroupManage />} />
                <Route path='edit/:groupId' element={<LecturerGroupEdit />}></Route>
              </Route>
              <Route path='project/*'>
                <Route path='edit/:projectId' element={<LecturerProjectEdit />} />
                <Route path='todos/*'>
                  <Route path=':projectId/:groupId' element={<Todos readonly />} />
                  <Route path='gantt-chart/:projectId' element={<GanttChart />}></Route>
                </Route>
              </Route>
              <Route path='project-deliverables' element={<LecturerProjectDeliverablesManagement />} />
              <Route path='project-deliverables'>
                <Route path='create' element={<LecturerProjectDeliverablesCreate isEdit={false} />} />
                <Route path='edit/:deliverableId' element={<LecturerProjectDeliverablesCreate isEdit />} />
              </Route>
              <Route path='project-marking/*' >
                <Route path='list' element={
                  <Suspense fallback={<LoadingPopup open />}>
                    <LazyMarkList />
                  </Suspense>
                } />
                <Route path='edit/:groupId' element={<LecturerMarkEdit />} />
              </Route>
              <Route path='user-management' element={<Suspense fallback={<LoadingPopup open />}><BatchStudentProvider><UserManagementLayout /></BatchStudentProvider></Suspense>}>
                <Route path='batch' element={<BatchManagement />} />
                <Route path='batch/addBatch' element={<AddBatch />} />
                <Route path='batch/:batchId/edit' element={<EditBatch />} />
                <Route path='batch/:batchId/student' element={<StudentManagement />} />
                <Route path='batch/:batchId/student/addStudent' element={<AddStudent />} />
                <Route path='batch/:batchId/student/bulkImport' element={<BulkImportStudent />} />
                <Route path='client' element={<ClientManagement />} />
                <Route path='client/add' element={<AddClient />} />
                <Route path='client/:clientId' element={<ClientProfile />} />
                <Route path='student/:studentId' element={<StudentProfile />} />
              </Route>
              <Route path='profile' element={<UserProfile />} />
              <Route path='badge-management'>
                <Route index element={<BadgeManagement />} />
                <Route path='badge/:badgeId' element={<BadgeProfile />} />
                <Route path="badge/:batch/add" element={<AddBadge />} />
              </Route>
              <Route path="leaderboard" element={<LeaderBoard />} />
              <Route path='quiz'>
                <Route path='list' element={<QuizManage />} />
                <Route path='create' element={<QuizEdit createMode />} />
                <Route path=':quizId/edit' element={<QuizEdit />} />
              </ Route>
              <Route path='assessment'>
                <Route path='list' element={<AssessmentManage />} />
                <Route path='create' element={<AssessmentEdit createMode />} />
                <Route path=':assessmentId/edit' element={<AssessmentEdit />} />
              </Route>
              <Route path='assessment-result'>
                <Route path='list' element={<AssessmentResultManage />} />
                <Route path=':assessmentIdParam/review' element={<AssessmentQuiz reviewMode />} />
              </ Route>
            </Route>
          </Route>

          {/* client routes */}
          <Route path="client/*" element={<ClientLayout />}>
            <Route path='evaluation/:accessCodeParam' element={<AssessmentQuiz />} />
          </Route>

          {/* unauthorized */}
          <Route path="unauthorized" element={<Unauthorized />} />

          {/* catch all */}
          <Route path="*" element={<Missing />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default AppRoutes;