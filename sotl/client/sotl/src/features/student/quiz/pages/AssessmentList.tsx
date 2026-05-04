import React, { useEffect, useState } from 'react';
import ContentPanel from '../../../../components/ContentPanel';
import { useNavigate } from 'react-router-dom';
import { DataGrid, GridActionsCellItem, GridColDef, GridRenderCellParams, GridRowsProp, useGridApiRef } from "@mui/x-data-grid";
import { LoadingPopupProps } from '../../../../components/LoadingPopup';
import { PopupProps } from '../../../../components/SuccessPopup';
import Button from '@mui/material/Button';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { assessmentResultHooks } from '../hooks/assessmentResultHooks';
import { AssessmentDataGrid, ExpandableCell, assessmentTypeValueGetter, dateValueFormatter, dateValueGetter, questionTypeValueGetter } from '../../../../components/AssessmentDataGrid';
import { IAssessmentResult } from '@models/AssessmentResult';
import { IAssessment } from '@models/Assessment';
import { Link } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';
import { RewardType } from '../../../../models/Quiz';
import { AssessmentResultService } from '../services/assessmentResultService';
import { IconButton } from '@mui/material';
import { Refresh } from '@mui/icons-material';
import { StudentProps, useAuth } from '../../../auth/context/AuthContext';

const AssessmentList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const { getMyAssessmentList, error } = assessmentResultHooks(searchParams);
  // const { getGroupList, error, loading } = groupHooks();
  // const [groupList, setGroupList] = useState<GroupWithNo[]>([]);
  const [errorPopup, setErrorPopup] = useState(false);
  const { identity } = useAuth();

  const navigate = useNavigate();
  const apiRef = useGridApiRef();

  const loadingPopupProps: LoadingPopupProps = {
    open: loading
  };

  const [rows, setRows] = useState<GridRowsProp>([]);

  const errorPopupProps: PopupProps = {
    open: errorPopup,
    content: error!,
    onClose: () => {
      setErrorPopup(false);
    }
  };

  const columns: GridColDef[] = [
    { field: 'assessment.numId', type: 'number', valueGetter: (_, row) => (row.assessment as IAssessment).numId, valueFormatter: (numId) => `A${numId}`, headerName: '#', width: 75 },
    { field: 'assessment.type', headerName: 'Type', valueGetter: (_, row) => assessmentTypeValueGetter((row.assessment as IAssessment).type as number), width: 150 },
    { field: 'assessment.title', headerName: 'Assessment Name', valueGetter: (_, row) => (row.assessment as IAssessment).title, minWidth: 150, flex: 1, renderCell: (params: GridRenderCellParams) => <ExpandableCell maxChar={150} params={params} />, },
    { field: 'assessment.description', headerName: 'Assessment Description', valueGetter: (_, row) => (row.assessment as IAssessment).description, minWidth: 150, flex: 1, renderCell: (params: GridRenderCellParams) => <ExpandableCell maxChar={50} params={params} />, },
    // { field: 'quiz_assigned', headerName: 'Quiz Title', valueGetter: (quiz_assigned) => quiz_assigned['title'], width: 150 },
    { field: 'questionCount', type: 'number', headerName: 'Total Question(s)', width: 150 },
    { field: 'assessment.start_at', type: 'dateTime', headerName: 'Start', valueGetter: (_, row) => dateValueGetter((row.assessment as IAssessment).start_at as string), valueFormatter: dateValueFormatter, width: 150 },
    { field: 'assessment.ended_at', type: 'dateTime', headerName: 'End', valueGetter: (_, row) => dateValueGetter((row.assessment as IAssessment).ended_at as string), valueFormatter: dateValueFormatter, width: 150 },
    { field: 'endedAt', type: 'dateTime', headerName: 'Submitted', valueGetter: (v) => dateValueGetter(v as string), valueFormatter: dateValueFormatter, width: 150 },
    { field: `totalRewards.${RewardType.POINT}`, type: 'number', headerName: 'Points', valueGetter: (_, row) => AssessmentResultService.rewardValueGetter(row, RewardType.POINT), valueFormatter: (v, row) => AssessmentResultService.rewardValueFormatter(v, row, RewardType.POINT), width: 150 },
    { field: `totalRewards.${RewardType.SCORE}`, type: 'number', headerName: 'Score', valueGetter: (_, row) => AssessmentResultService.rewardValueGetter(row, RewardType.SCORE), valueFormatter: (v, row) => AssessmentResultService.rewardValueFormatter(v, row, RewardType.SCORE), width: 150 },
    {
      field: 'action', headerName: 'Action', type: 'actions',
      getActions: ({ id, row }) => {
        return [<Button component={Link} to={"../" + row.assessment._id as string} variant="contained">Open</Button>];
      },
      width: 150
    },
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const myAssessments = await getMyAssessmentList((identity as StudentProps).loginAsBatch);
      if (myAssessments) {
        // console.log('mine', myAssessments);
        setRows(myAssessments);
      }
    } catch (error) {
      console.error('Error:', error);
      setErrorPopup(true);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <>
      <ContentPanel
        title='Assigned Assessments'
        errorPopup={errorPopupProps}
        loadingPopup={loadingPopupProps}
        customActions={
          <IconButton sx={{ backgroundColor: 'lightgray' }} onClick={() => { fetchData(); }}><Refresh /></IconButton>
        }
        content={
          <>
            <AssessmentDataGrid rows={rows} columns={columns} initialState={{
              sorting: {
                sortModel: [{ field: 'assessment.start_at', sort: 'desc' }],
              },
            }} />
          </>
        }
      >
      </ContentPanel>
    </>
  );
};

export default AssessmentList;
