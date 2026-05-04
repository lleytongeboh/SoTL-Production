import { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Drawer, List, ListItem, ListItemText, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { DataGrid, GridRowId, GridRowsProp, GridColDef, GridActionsCellItem, GridRenderCellParams, GridComparatorFn, useGridApiRef, GridRowParams } from '@mui/x-data-grid';
import type { } from '@mui/x-data-grid/themeAugmentation';
import Button from '@mui/material/Button';
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
import { Link } from 'react-router-dom';
import { assessmentHooks } from '../../features/lecturer/assessment/hooks/assessmentHooks'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import ContentPanel from '../../components/ContentPanel';
import { AssessmentDataGrid, AssessmentDataGridCloneMenu, ExpandableCell, assessmentTypeValueGetter, dateValueFormatter, dateValueGetter, questionTypeValueGetter, sxBgLightgrey } from '../../components/AssessmentDataGrid';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import { useNavigate } from 'react-router-dom';
import ConfirmationPopup from '../../components/ConfirmationPopup';
import { LinkStyled } from '../../components/LinkStyled';
import SuccessPopup, { PopupProps } from '../../components/SuccessPopup';
import ErrorPopup from '../../components/ErrorPopup';
import { ICategory } from '@models/Category';

const AssessmentManage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [confirmationMessage, setConfirmationMessage] = useState<React.ReactNode>(null);
  const assessmentIdToDelete = useRef('');
  const selectedAction = useRef('');
  const handleEditClick = (id: GridRowParams['id']) => {
    navigate(`../${id}/edit`);
  };
  const [rows, setRows] = useState<GridRowsProp>([]);
  const { getAssessmentList, deleteAssessment, error } = assessmentHooks();
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
    assessmentIdToDelete.current = id as string;
    setConfirmationMessage(<>Are you sure you want to delete Assessment A{row['numId']}?<br /><br />ID: {id}<br />Title: {row['title']}</>);
  };

  const handleDelete = () => {
    setLoading(true);
    deleteAssessment(assessmentIdToDelete.current).then((response) => {
      setRows(rows.filter((row) => row._id !== assessmentIdToDelete.current));
      setSuccessPopupProps({
        ...successPopupProps, open: true, content: response?.message
      });
    }).catch(() => {
      setErrorPopup(true);
    }).finally(() => setLoading(false));
  };

  const columns: GridColDef[] = useMemo(() => [
    { field: 'numId', type: 'number', valueFormatter: (numId) => `A${numId}`, headerName: '#', width: 75 },
    { field: 'type', headerName: 'Type', valueGetter: assessmentTypeValueGetter, width: 150 },
    { field: 'title', headerName: 'Assessment Name', minWidth: 150, flex: 1, renderCell: (params: GridRenderCellParams) => <ExpandableCell maxChar={150} params={params} />, },
    { field: 'description', headerName: 'Assessment Description', minWidth: 150, flex: 1, renderCell: (params: GridRenderCellParams) => <ExpandableCell maxChar={50} params={params} />, },
    { field: 'quiz_assigned', headerName: 'Quiz Title', valueGetter: (quiz_assigned) => quiz_assigned['title'], width: 150 },
    { field: 'batch', headerName: 'Batch', valueGetter: (batch: ICategory) => batch?.name, width: 150 },
    { field: 'start_at', type: 'dateTime', headerName: 'Start', valueGetter: dateValueGetter, valueFormatter: dateValueFormatter, width: 150 },
    { field: 'ended_at', type: 'dateTime', headerName: 'End', valueGetter: dateValueGetter, valueFormatter: dateValueFormatter, width: 150 },
    { field: 'public', type: 'boolean', headerName: 'Public', width: 150 },
    { field: 'isPublicForReview', type: 'boolean', headerName: 'Review Enabled', width: 150 },
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
          <LinkStyled to={`../../assessment-result/list?assessmentId=${id}`}>
            <GridActionsCellItem
              sx={sxBgLightgrey}
              icon={<AnalyticsIcon />}
              size='large'
              label="Results"
              color="inherit"
            />
          </LinkStyled>,
          <GridActionsCellItem
            sx={sxBgLightgrey}
            icon={<DeleteOutlinedIcon />}
            itemProp=''
            size='large'
            label="Delete"
            onClick={() => handleDeleteClick(id, row)}
            color="inherit"
          />,
          <AssessmentDataGridCloneMenu label='Assessment' to={`../create?cloneFromId=${id}`} />
        ];
      },
      width: 200
    },
  ], []);

  const getAllAssessments = () => {
    setLoading(true);
    getAssessmentList().then((assessments) => {
      if (assessments) {
        setRows(assessments);
      }
    }).catch((err) => {
      setErrorPopup(true);
      console.error('Error:', err);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    getAllAssessments();
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
    <ContentPanel title="Assessment Management / Assessment"
      content={
        <>
          <Box sx={{ display: 'flex', columnGap: 4, alignItems: 'center', justifyContent: 'flex-end', marginBottom: 4 }}>
            <Button sx={{ borderRadius: 5, py: 1.2 }} component={Link} to="../create" variant="contained" startIcon={<AddBoxOutlinedIcon />}>Create Assessment</Button>
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

export default AssessmentManage;
