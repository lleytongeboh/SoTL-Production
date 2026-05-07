import { Avatar, Box, Button, Chip, Collapse, IconButton, LinearProgress, List, ListItemAvatar, ListItemButton, ListItemText, TableCell, TableRow, Tooltip } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useGroup } from '../../features/student/group/context/GroupContext';
import { useProject } from '../../features/student/project/context/ProjectContext';
import { Project } from '../../features/student/project/models';
import { Group, TeamMember } from '../../features/student/group/models';
import { DownloadOutlined, Edit, ExpandLess, ExpandMore, WorkspacePremium } from '@mui/icons-material';
import ContentPanel from '../../components/ContentPanel';
import { deliverablesHooks } from '../../features/lecturer/deliverables/hooks/deliverablesHooks';
import { Deliverable } from '../../features/lecturer/deliverables/models';
import { useGamificationHooks } from '../../features/lecturer/gamification/hooks/useGamificationHooks';
import { Badge } from '../../features/lecturer/gamification/models';
import { useFeedbackDialog, SET_LOADING_STATUS_FALSE } from '../../context/FeedbackDialog';
import { projectHooks } from '../../features/student/project/hooks/projectHooks';
import GeneralTable, { HeaderProperties } from '../../components/GeneralTable';
import moment from 'moment';
import { fetchTeamTasks } from '../../services/chatTasks.service';
import { getJWToken } from '../../utils/getJWToken';

type ChatTask = {
  id: string;
  title: string;
  status: 'assigned' | 'in_progress' | 'done' | 'cancelled';
  dueAt?: string;
  evidenceLink?: string;
  assignedTo?: {
    name?: string;
    matricNumber?: string;
  } | null;
};

const ProjectDetails: React.FC = () => {
  const { selectedGroup }: { selectedGroup: Group | null } = useGroup();
  const { selectedProject }: { selectedProject: Project | null } = useProject();
  const { getBadgeList } = useGamificationHooks();
  const { getDeliverablesList, error, loading } = deliverablesHooks();
  const { error: projectError, loading: projectLoading } = projectHooks();

  const [deliverablesList, setDeliverablesList] = useState<Deliverable[]>([]);
  const [taskList, setTaskList] = useState<ChatTask[]>([]);
  const [errorPopup, setErrorPopup] = useState<boolean>(false);
  const [badgeList, setBadgeList] = useState<Badge[] | null>(null);
  const hasGroup: boolean = selectedGroup !== null;
  const hasProject: boolean = selectedProject !== null;
  const { setLoadingPane } = useFeedbackDialog();

  const taskTableHeader: HeaderProperties[] = [
    { name: 'Task', center: false },
    { name: 'Member', center: false },
    { name: 'Due Date', center: false },
    { name: 'Status', center: false },
    { name: 'PDF Attached', center: true },
  ];

  const taskStatusLabel = (task: ChatTask): string => {
    if (task.status !== 'done' && task.dueAt && moment(task.dueAt).isBefore(moment(), 'day')) {
      return 'Overdue';
    }

    switch (task.status) {
      case 'assigned':
        return 'Assigned';
      case 'in_progress':
        return 'In Progress';
      case 'done':
        return 'Done';
      default:
        return 'Unknown';
    }
  };

  const taskStatusColor = (task: ChatTask): 'default' | 'primary' | 'success' | 'error' => {
    if (task.status !== 'done' && task.dueAt && moment(task.dueAt).isBefore(moment(), 'day')) {
      return 'error';
    }

    switch (task.status) {
      case 'in_progress':
        return 'primary';
      case 'done':
        return 'success';
      default:
        return 'default';
    }
  };

  const getTaskProgress = (task: ChatTask): number => {
    if (task.status === 'done') {
      return 100;
    }

    if (task.status === 'in_progress') {
      return 50;
    }

    return 0;
  };

  const getProjectProgress = (): number => {
    const totalDeliverables: number = deliverablesList.length;
    if (totalDeliverables === 0) {
      return 0;
    }

    const completedDeliverables: number = deliverablesList.filter((deliverable) => selectedProject?.deliverables?.some(e => {
      if (e.deliverable_id === deliverable._id) {
        if (deliverable.approve) {
          return e.status === 1;
        }
        return true;
      }
      return false;
    })).length;
    return completedDeliverables / totalDeliverables * 100;
  };

  const getTeamProgress = (): number => {
    if (taskList.length === 0) {
      return getProjectProgress();
    }

    const totalProgress = taskList.reduce((total, task) => total + getTaskProgress(task), 0);
    return totalProgress / taskList.length;
  };

  const withoutGroupContent = (): React.ReactNode => {
    return (
      <React.Fragment>
        <div>
          <p>You dont have a group.</p>
          <p>Please join a group or create a group to access.</p>
          <br />
          <div className='flex justify-center'>
            <div className='flex flex-col w-1/2'>
              <Button variant='contained' component={Link} to='/student/group/list'>
                JOIN GROUP
              </Button>
              <Button variant='outlined' component={Link} to='/student/group/create' sx={{ mt: '10px' }}>
                CREATE GROUP
              </Button>
            </div>
          </div>
        </div>
      </React.Fragment>
    );
  };

  const withoutProjectContent = (): React.ReactNode => {
    return (
      <React.Fragment>
        <div>
          <p>You dont have a project.</p>
          <p>Please create a project.</p>
          <br />
          <Button variant='contained' className='w-1/2' component={Link} to='/student/project/create'>
            CREATE PROJECT
          </Button>
        </div>
      </React.Fragment>
    );
  };

  function GroupMemberRow(props: { member: TeamMember }) {
    const { member } = props;
    const [expand, setExpand] = useState(false);
    return (
      <>
        <ListItemButton onClick={() => setExpand(!expand)}>
          <ListItemAvatar>
            <Avatar>
            </Avatar>
          </ListItemAvatar>
          <ListItemText primary={`${member.name} ${member.group_role === 'Leader' ? "*" : ""}`} />
          {expand ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>
        <Collapse in={expand} timeout='auto' unmountOnExit>
          <Box sx={{ marginX: 5, marginY: 3 }}>
            <p>Role: {member.project_role?.join(', ') ?? "Undefined"}</p>
          </Box>
        </Collapse>
      </>
    );
  }

  const projectDetails = (): React.ReactNode => {
    const badges: Badge[] = (selectedProject?.badges ?? []).map((id) => badgeList?.find(e => e._id === id)!).sort((a, b) => a.order - b.order);

    return (
      <Box textAlign={'left'}>
        <div className='flex items-center justify-between mb-8'>
          <p className="title">{selectedProject?.title}</p>
          <IconButton component={Link} to='edit'><Edit fontSize='large' /></IconButton>
        </div>
        <p className='mb-8'>{selectedProject?.description}</p>
        <div className='mb-8'>
          <div className='flex justify-between title mb-4'>
            <p>Project Progress</p>
            <p>{getProjectProgress().toFixed(2)}%</p>
          </div>
          <LinearProgress sx={{ height: '15px', borderRadius: '8px' }} variant='determinate' value={getProjectProgress()} />
        </div>
        <div className='mb-8'>
          <div className='flex justify-between title mb-4'>
            <p>Team Progress</p>
            <p>{getTeamProgress().toFixed(2)}%</p>
          </div>
          <LinearProgress sx={{ height: '15px', borderRadius: '8px' }} variant='determinate' value={getTeamProgress()} />
        </div>
        <div className='mb-8'>
          <p className='title mb-4'>Project Name</p>
          <p>{selectedProject?.title}</p>
        </div>
        <div className='mb-8'>
          <p className='mb-4'><b>Team Tasks:</b></p>
          <GeneralTable
            tableHeader={taskTableHeader}
            size='small'
            tableBody={
              taskList.length > 0 ?
                taskList.map((task) => {
                  const assignee = task.assignedTo?.name ?
                    `${task.assignedTo.name}${task.assignedTo.matricNumber ? ` (${task.assignedTo.matricNumber})` : ''}` :
                    'Unassigned';
                  return (
                    <TableRow key={task.id}>
                      <TableCell>{task.title}</TableCell>
                      <TableCell>{assignee}</TableCell>
                      <TableCell>{task.dueAt ? moment(task.dueAt).format('DD/MM/YYYY') : 'N/A'}</TableCell>
                      <TableCell><Chip size='small' label={taskStatusLabel(task)} color={taskStatusColor(task)} /></TableCell>
                      <TableCell align='center'>
                        {task.evidenceLink ?
                          <Tooltip title='Open PDF / evidence'>
                            <IconButton component='a' href={task.evidenceLink} target='_blank' rel='noreferrer'>
                              <DownloadOutlined />
                            </IconButton>
                          </Tooltip> :
                          '-'
                        }
                      </TableCell>
                    </TableRow>
                  );
                }) :
                <TableRow>
                  <TableCell colSpan={taskTableHeader.length}>No tasks have been assigned yet.</TableCell>
                </TableRow>
            }
          />
        </div>
        {badgeList && <div className='mb-8'>
          <div className='flex justify-between title mb-4'>
            <p>Milestone Badges</p>
            <p>{selectedProject?.badges?.length ?? 0}/{badgeList.length} Received</p>
          </div>
          <div className='flex gap-5'>{badges.map((badge, i) => (<Tooltip key={i} title={badge.name}><WorkspacePremium sx={{ fontSize: 60, color: badge.color }} /></Tooltip>))}</div>
        </div>
        }
        <>
          <div className='flex justify-between title mb-4'>
            <p>Group Members</p>
            <Button variant='text' component={Link} to='editRole'>Edit Role</Button>
          </div>
          <List>
            {selectedGroup?.team_members.map((member) => <GroupMemberRow key={member.student_id} member={member} />)}
          </List>
        </>
      </Box>
    );
  };

  const fetchData = async () => {
    try {
      if (selectedGroup) {
        const deliverables = await getDeliverablesList(selectedGroup!.batch);
        const badges = await getBadgeList();
        const token = getJWToken();
        const teamTasks = selectedProject?._id && token ? await fetchTeamTasks(selectedProject._id, token) : { results: [] };
        setBadgeList(badges.find(e => e.batch === selectedGroup!.batch)?.badges ?? []);
        setDeliverablesList(deliverables);
        setTaskList(teamTasks.results ?? []);
      }
    } catch (error) {
      console.error(error);
      setErrorPopup(true);
    } finally {
      setLoadingPane(SET_LOADING_STATUS_FALSE);
    }
  };

  useEffect(() => {
    setBadgeList(null);
    setTaskList([]);
    fetchData();
  }, [selectedGroup, selectedProject]);

  return (
    <ContentPanel
      title='Project Details'
      removeTitleRow={true}
      loadingPopup={
        { open: loading || projectLoading }
      }
      errorPopup={{
        open: errorPopup,
        content: error ?? projectError ?? 'An error occurred',
        onClose: () => { setErrorPopup(false); }
      }}
      content={
        hasGroup ?
          /* Has Group */
          hasProject ?
            /* Has Project */
            projectDetails() :
            /* No Project */
            withoutProjectContent() :
          /* No Group */
          withoutGroupContent()
      }
    />
  );
};

export default ProjectDetails;
