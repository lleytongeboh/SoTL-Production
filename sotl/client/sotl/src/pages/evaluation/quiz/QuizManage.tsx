import { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Drawer, List, ListItem, ListItemText } from '@mui/material';
import { DataGrid, GridRowId, GridRowsProp, GridColDef, GridActionsCellItem, GridRenderCellParams, GridRowParams, useGridApiRef } from '@mui/x-data-grid';
import type { } from '@mui/x-data-grid/themeAugmentation';
import Button from '@mui/material/Button';
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
import { Link as RouterLink } from 'react-router-dom';
import { quizHooks } from '../../../features/lecturer/assessment/hooks/quizHooks'
import Link from '@mui/material/Link';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import ContentPanel from '../../../components/ContentPanel';
import { AssessmentDataGrid, AssessmentDataGridCloneMenu, dateValueFormatter, dateValueGetter, numIdComparator, sxBgLightgrey } from '../../../components/AssessmentDataGrid';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import ConfirmationPopup from '../../../components/ConfirmationPopup';
import { useNavigate } from 'react-router-dom';
import { LinkStyled } from '../../../components/LinkStyled';
import ErrorPopup from '../../../components/ErrorPopup';
import SuccessPopup, { PopupProps } from '../../../components/SuccessPopup';

// https://mui.com/x/react-data-grid/row-height/#dynamic-row-height
function ExpandableCell({ maxChar, params: { value } }: { maxChar: number; params: GridRenderCellParams }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      {expanded ? value : (value.slice(0, maxChar) + (value.length > maxChar ? '...' : ''))}&nbsp;
      {value.length > maxChar && (
        // eslint-disable-next-line jsx-a11y/anchor-is-valid
        <Link
          type="button"
          component="button"
          sx={{ fontSize: 'inherit', letterSpacing: 'inherit' }}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'View less' : 'View more'}
        </Link>
      )}
    </div>
  );
}

const QuizManage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [confirmationMessage, setConfirmationMessage] = useState<React.ReactNode>(null);
  const quizIdToDelete = useRef('');
  const selectedAction = useRef('');
  const [rows, setRows] = useState<GridRowsProp>([]);
  const { getQuizList, deleteQuiz, error } = quizHooks();
  const [errorPopup, setErrorPopup] = useState(false);

  const [successPopupProps, setSuccessPopupProps] = useState<PopupProps>({
    open: false,
    content: '',
    onClose: () => {
      setSuccessPopupProps({ ...successPopupProps, open: false });
    }
  });

  const errorPopupProps: PopupProps = {
    open: errorPopup,
    content: error!,
    onClose: () => {
      setErrorPopup(false);
    }
  };

  const handleDeleteClick = (id: GridRowParams['id'], row: GridRowParams['row']) => {
    selectedAction.current = "Delete";
    quizIdToDelete.current = id as string;
    setConfirmationMessage(<>Are you sure you want to delete Quiz Q{row['numId']}?<br /><br />ID: {id}<br />Title: {row['title']}</>);
  };

  const handleDelete = () => {
    setLoading(true);
    deleteQuiz(quizIdToDelete.current).then((response) => {
      setRows(rows.filter((row) => row._id !== quizIdToDelete.current));
      setSuccessPopupProps({
        ...successPopupProps, open: true, content: response?.message
      });
    }).catch(() => {
      setErrorPopup(true);
    }).finally(() => setLoading(false));
  };

  const columns: GridColDef[] = useMemo(() => [
    { field: 'numId', type: 'number', valueFormatter: (numId) => `Q${numId}`, headerName: '#', width: 75 },
    { field: 'title', headerName: 'Quiz Title', minWidth: 150, flex: 1, renderCell: (params: GridRenderCellParams) => <ExpandableCell maxChar={150} params={params} />, },
    { field: 'description', headerName: 'Quiz Description', minWidth: 150, flex: 1, renderCell: (params: GridRenderCellParams) => <ExpandableCell maxChar={50} params={params} />, },
    { field: 'questionCount', type: 'number', headerName: 'Total Question(s)', width: 150 },
    { field: 'createdAt', type: 'dateTime', headerName: 'Created', valueGetter: dateValueGetter, valueFormatter: dateValueFormatter, width: 150 },
    { field: 'updatedAt', type: 'dateTime', headerName: 'Updated', valueGetter: dateValueGetter, valueFormatter: dateValueFormatter, width: 150 },
    {
      field: 'action', headerName: 'Action', type: 'actions',
      getActions: ({ id, row }) => {
        return [
          <LinkStyled to={`../${id}/edit`}>
            <GridActionsCellItem
              sx={sxBgLightgrey}
              icon={<EditOutlinedIcon />}
              size='large'
              label="Edit"
              color="inherit"
            />
          </LinkStyled>,
          <GridActionsCellItem
            sx={sxBgLightgrey}
            icon={<DeleteOutlinedIcon />}
            size='large'
            label="Delete"
            onClick={() => handleDeleteClick(id, row)}
            color="inherit"
          />,
          <AssessmentDataGridCloneMenu label='Quiz' to={`../create?cloneFromId=${id}`}/>
        ];
      },
      width: 150
    },
  ], []);

  const getAllQuizzes = () => {
    setLoading(true);
    getQuizList().then((quizzes) => {
      if (quizzes) {
        setRows(quizzes);
      }
    }).catch((err) => {
      setErrorPopup(true);
      console.error('Error:', err);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    getAllQuizzes();
  }, []);

  const gridApiRef = useGridApiRef();

  return <>
    <ConfirmationPopup
      open={confirmationMessage !== null}
      onClose={() => setConfirmationMessage(null)}
      onConfirm={() => {
        if (selectedAction.current === "Delete") {
          handleDelete();
        }
        setConfirmationMessage(null);
      }}
      content={confirmationMessage}
    />
    {successPopupProps && <SuccessPopup
      open={successPopupProps.open}
      onClose={successPopupProps.onClose}
      content={successPopupProps.content}
    />}
    {errorPopupProps && <ErrorPopup
      open={errorPopupProps.open}
      onClose={errorPopupProps.onClose}
      content={errorPopupProps.content}
    />}
    <ContentPanel title="Assessment Management / Quiz"
      content={
        <>
          <Box sx={{ display: 'flex', columnGap: 4, alignItems: 'center', justifyContent: 'flex-end', marginBottom: 4 }}>
            <Button sx={{ borderRadius: 5, py: 1.2 }} component={RouterLink} to="../create" variant="contained" startIcon={<AddBoxOutlinedIcon />}>Create Quiz</Button>
            <Button sx={{ borderRadius: 5, py: 1.2 }} onClick={() => gridApiRef.current.exportDataAsCsv()} variant="contained" startIcon={<FileDownloadOutlinedIcon />}>Export CSV</Button>
          </Box>
          <div style={{  display: 'flex', flexDirection: 'column', height: '80vh' }}>
            <AssessmentDataGrid apiRef={gridApiRef} loading={loading} rows={rows} columns={columns} />
          </div>
        </>
      }
    />
  </>;
};

export default QuizManage;
