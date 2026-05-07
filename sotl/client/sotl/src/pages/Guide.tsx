import { Box, Chip, Divider, List, ListItem, ListItemText, Typography } from '@mui/material';
import ContentPanel from '../components/ContentPanel';

const commandItems = [
  { command: 'projects', purpose: 'Show available projects and choose the correct project.' },
  { command: '1', purpose: 'Select project number 1 from the project list.' },
  { command: 'team', purpose: 'View all team tasks, assigned members, due dates, and status.' },
  { command: 'my', purpose: 'View only the tasks assigned to your own account.' },
  { command: 'members', purpose: 'View the team member list.' },
  { command: 'assign S10002 Build Presentation by 10 May 2026', purpose: 'Leader assigns a task to one member.' },
  { command: 'next', purpose: 'Check the next project deadline or deliverable.' },
  { command: 'deadlines', purpose: 'View upcoming deadlines.' },
  { command: 'reset', purpose: 'Clear the selected chat project and choose again.' },
];

const testFlow = [
  'Login using the student account provided for the test.',
  'Open Project and confirm the project details, team progress, task list, and attached PDF column are visible.',
  'Open the chatbox and type projects.',
  'Select the project by typing its number, for example 1.',
  'Type team and confirm everyone can see team tasks.',
  'Type my and confirm only your own assigned tasks are shown.',
  'If you are the leader, assign one task to a member using the assign command.',
  'The assigned member should mark the task as in progress, then done, and attach evidence when required.',
  'Check Quiz and complete the assigned assessment if one is available.',
  'Open Leaderboard and confirm points, badges, and ranking appear correctly.',
  'Report any wrong name, missing task, wrong status, failed upload, or confusing message to the tester.',
];

const avoidItems = [
  'Do not use another student account.',
  'Do not change another team member task unless you are instructed to test leader features.',
  'Do not upload private files. Use test PDFs or sample files only.',
  'Do not spam the same command many times if the page is loading.',
  'Do not refresh while uploading or submitting a task.',
  'Do not edit group/project information unless your test instruction asks for it.',
];

const Guide: React.FC = () => {
  return (
    <ContentPanel
      title='Guide'
      content={
        <Box textAlign='left' display='flex' flexDirection='column' gap={4}>
          <Box>
            <Typography variant='h5' fontWeight='bold' gutterBottom>
              Student Testing Guide
            </Typography>
            <Typography>
              Use this page during the 30-student test session to check the main project, quiz, leaderboard, and chat task flow.
            </Typography>
          </Box>

          <Box>
            <Typography variant='h6' fontWeight='bold' gutterBottom>
              Test Flow
            </Typography>
            <List dense>
              {testFlow.map((item, index) => (
                <ListItem key={item} disablePadding sx={{ py: 0.5 }}>
                  <ListItemText primary={`${index + 1}. ${item}`} />
                </ListItem>
              ))}
            </List>
          </Box>

          <Divider />

          <Box>
            <Typography variant='h6' fontWeight='bold' gutterBottom>
              Chatbox Commands To Try
            </Typography>
            <List dense>
              {commandItems.map((item) => (
                <ListItem key={item.command} disablePadding sx={{ py: 0.75, alignItems: 'flex-start' }}>
                  <Chip label={item.command} size='small' sx={{ mr: 2, fontFamily: 'monospace' }} />
                  <ListItemText primary={item.purpose} />
                </ListItem>
              ))}
            </List>
          </Box>

          <Divider />

          <Box>
            <Typography variant='h6' fontWeight='bold' gutterBottom>
              What To Check
            </Typography>
            <List dense>
              <ListItem disablePadding sx={{ py: 0.5 }}><ListItemText primary='Project page: project name, team progress, task status, due date, assigned member, and PDF/evidence link.' /></ListItem>
              <ListItem disablePadding sx={{ py: 0.5 }}><ListItemText primary='Chatbox: project selection, team task list, my task list, assignment command, overdue warning, and evidence upload.' /></ListItem>
              <ListItem disablePadding sx={{ py: 0.5 }}><ListItemText primary='Quiz: assessment list, quiz navigation, answer saving, and submission.' /></ListItem>
              <ListItem disablePadding sx={{ py: 0.5 }}><ListItemText primary='Leaderboard: group ranking, student ranking, badges, and points.' /></ListItem>
              <ListItem disablePadding sx={{ py: 0.5 }}><ListItemText primary='Notifications: task/deadline alerts should appear only when relevant.' /></ListItem>
            </List>
          </Box>

          <Box>
            <Typography variant='h6' fontWeight='bold' gutterBottom>
              What Not To Do
            </Typography>
            <List dense>
              {avoidItems.map((item) => (
                <ListItem key={item} disablePadding sx={{ py: 0.5 }}>
                  <ListItemText primary={item} />
                </ListItem>
              ))}
            </List>
          </Box>

        </Box>
      }
    />
  );
};

export default Guide;
