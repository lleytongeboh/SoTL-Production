import { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Checkbox, Drawer, FormControlLabel, IconButton, List, ListItem, ListItemText, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { DataGrid, GridRowId, GridRowsProp, GridColDef, GridActionsCellItem, GridRenderCellParams, GridComparatorFn, useGridApiRef, GridRowParams, GridRowSelectionModel, GridRowModesModel } from '@mui/x-data-grid';
import type { } from '@mui/x-data-grid/themeAugmentation';
import Button from '@mui/material/Button';
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import { assessmentResultHooks } from '../../features/lecturer/assessment/hooks/assessmentResultHooks'
import { IQuiz, QuizItem, RewardType } from '../../models/Quiz';
import Link from '@mui/material/Link';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import ContentPanel, { SuccessPopupProps } from '../../components/ContentPanel';
import RHFAutocomplete from '../../components/ReactHookForm/RHFAutocomplete';
import { AssessmentDataGrid, ExpandableCell, assessmentTypeValueGetter, dateValueFormatter, dateValueGetter } from '../../components/AssessmentDataGrid';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import { useNavigate } from 'react-router-dom';
import ConfirmationPopup from '../../components/ConfirmationPopup';
import ErrorPopup from '../../components/ErrorPopup';
import { IAssessmentResult } from '../../models/AssessmentResult';
import { AssessmentType, AssessmentTypeStr, IAssessment } from '../../models/Assessment';
import { Student } from '@models/Student';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import GradeOutlinedIcon from '@mui/icons-material/GradeOutlined';
import { Refresh } from '@mui/icons-material';
import { debounce } from '@mui/material/utils';
import { assessmentHooks } from '../../features/lecturer/assessment/hooks/assessmentHooks';
import { AssessmentResultService } from '../../features/lecturer/services/assessmentResultService';
import { Controller, DefaultValues, FieldValues, FormProvider, SubmitHandler, useForm, useWatch } from 'react-hook-form';
import LoadingPopup, { LoadingPopupProps } from '../../components/LoadingPopup';
import SuccessPopup, { PopupProps } from '../../components/SuccessPopup';
import { AssessmentService } from 'src/features/lecturer/services/assessmentService';
import { DataGridPropsWithoutDefaultValue } from '@mui/x-data-grid/internals';
import { ApiResponse } from '@models/index';
import { LinkStyled } from '../../components/LinkStyled';
import { JobStatus } from '../../models/Job';

interface IAssessmentFilterResult {
  _id: string;
  concatLabel: string;
}

function LinkCell({ params: { value } }: { params: GridRenderCellParams }) {
  return (value === '-' ? '-' : <Box>
    <a rel="noopener noreferrer" target='_blank' href={value}>{value}</a>
    <br />
    <Button variant="contained" size='small' startIcon={<ContentCopyIcon />} onClick={() => { navigator.clipboard.writeText(value); }}>Copy</Button>
  </Box>
  );
}

const getReviewLink = (row: IAssessmentResult) => {
  let reviewURL = `../${row.assessment}/review`;
  if (row.evaluator) {
    if (row.evaluator.access_code) {
      reviewURL += '?clientAccessCode=' + row.evaluator.access_code;
    } else if (row.evaluator.evaluator_id) {
      reviewURL += '?evaluatorId=' + row.evaluator.evaluator_id;
      if (row.evaluatee) {
        reviewURL += '&evaluateeId=' + row.evaluatee;
      }
    }
  }
  return reviewURL;
};

const getEmailJobStatus = (emailJob: IAssessmentResult['emailJob']) => {
  if (!emailJob) {
    return 'Never sent';
  }
  const jobStatus = emailJob.status === JobStatus.COMPLETED ? 'Sent' : (emailJob.status[0].toUpperCase() + emailJob.status.slice(1));
  const jobDateTerm = emailJob.status === JobStatus.PENDING ? 'since' : 'at';
  return `${jobStatus} ${jobDateTerm} ${dateValueFormatter(dateValueGetter(emailJob.updatedAt as string))}`
}

const AssessmentResultManage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [confirmationMessage, setConfirmationMessage] = useState<React.ReactNode>(null);
  const loadingPopupProps: LoadingPopupProps = {
    open: loading
  };
  const [errorPopup, setErrorPopup] = useState(false);
  const [bulkEmailEnabled, setBulkEmailEnabled] = useState(false);
  const assessmentIdToDelete = useRef('');
  const assessmentIdsToDeleteMany = useRef<string[]>([]);
  const selectedAction = useRef('');

  const firstEmailAssessmentResultIds = useRef<string[]>([]);
  const resendEmailAssessmentResultIds = useRef<string[]>([]);
  const shouldResendEmail = useRef(false);
  const understandDeleteMany = useRef(false);
  const getClientListItem = (result: IAssessmentResult) => {
    return <li>{`[A${assessments?.[result.assessment as string]?.numId}] ${result.evaluator?.evaluator?.name}`}</li>;
  }
  const handleEmailSelectedClick = (selectedRows: Map<string, IAssessmentResult>) => {
    const firstEmailRows = [];
    const resendEmailRows = [];
    firstEmailAssessmentResultIds.current = [];
    resendEmailAssessmentResultIds.current = [];
    for (let [key, value] of selectedRows) {
      if (assessments?.[value.assessment as string].type !== AssessmentType.ClientEvaluation) {
        continue;
      }
      if (value.emailJob) {
        resendEmailRows.push(getClientListItem(value));
        resendEmailAssessmentResultIds.current.push(key as string);
      } else {
        firstEmailRows.push(getClientListItem(value));
        firstEmailAssessmentResultIds.current.push(key as string);
      }
    }
    if (selectedRows.size === 0) {
      setError('No row selected. Please select at least one row of client evaluation assessment type by checking the checkbox at the left of the table.');
      setErrorPopup(true);
    } else if (firstEmailRows.length === 0 && resendEmailRows.length === 0) {
      setError('No client to send email to for the selected rows. Note that sending email feature is only available for client evaluation assessment type.');
      setErrorPopup(true);
    } else {
      selectedAction.current = 'Email';
      setConfirmationMessage(
        <Box sx={{ '& label span': { fontSize: '1.25rem', userSelect: 'none' }, '& span, & ol': { fontSize: '1rem' }, '& ol': { listStyleType: 'decimal', textAlign: 'start', paddingX: 2 } }}>Are you sure you want to send email to clients in selected rows?<br />
          <Typography component="span">This feature is only available to client evaluation assessment type. For assessment number, it is labelled in square bracket.</Typography>
          <br />
          <FormControlLabel control={<Checkbox checked={true} readOnly={true} />} label='Send emails to clients for the first time:' />
          {firstEmailRows.length >= 1 ? <ol>{firstEmailRows}</ol> : <span>Empty data. There is no client in the selected rows whose email has never been sent.</span>}
          <FormControlLabel control={<Checkbox defaultChecked={shouldResendEmail.current} onChange={(_, checked: boolean) => { shouldResendEmail.current = checked; }} />} label={`Resend emails to clients again:`} />
          {resendEmailRows.length >= 1 ? <ol>{resendEmailRows}</ol> : <span>Empty data. There is no client in the selected rows whose email has been sent before.</span>}
        </Box>);
    }
  };

  const handleRemarkSelectedClick = async (selectedRows: Map<string, IAssessmentResult>) => {
    setLoading(true);
    if (selectedRows.size === 0) {
      setError('No row selected. Please select at least one row of result to calculate rewards again.');
      setErrorPopup(true);
    } else {
      try {
        const response: ApiResponse<any> = await remarkAssessmentResults(Array.from(selectedRows.keys()));
        if(response?.result?.errMsg) {
          console.error(response?.message, response.result.errMsg);
        }
        setSuccessPopupProps({ ...successPopupProps, content: response?.message ?? '', open: true });
        onFilter();
      } catch (error) {
        console.error(error);
        setErrorPopup(true);
      }
    }
    setLoading(false);
  };
  
  const handleDeleteSelectedClick = async (selectedRows: Map<string, IAssessmentResult>) => {
    if (selectedRows.size === 0) {
      setError('No row selected. Please select at least one row of result to delete.');
      setErrorPopup(true);
    } else {
      assessmentIdsToDeleteMany.current = [];
      selectedAction.current = 'delete_many';
      const assessmentResultCountMap = new Map();
      for (const [id, result] of selectedRows) {
        assessmentIdsToDeleteMany.current.push(id);
        assessmentResultCountMap.set(result.assessment, (assessmentResultCountMap.get(result.assessment) ?? 0) + 1);
      }
      understandDeleteMany.current = assessmentIdsToDeleteMany.current.length <= 1;
      const deleteRows = Array.from(assessmentResultCountMap, ([id, count]) => <li>{`${count} result${count <= 1 ? '': 's'} from A${assessments[id]?.numId}. ${assessments[id]?.title}`}</li>);
      setConfirmationMessage(<Box sx={{ '& label > span': { fontSize: '1.25rem', userSelect: 'none' }, '& ul': { fontSize: '1.25rem', listStyleType: 'disc', textAlign: 'start', paddingX: 2 } }}>Are you sure you want to PERMANENTLY DELETE:<br />
      <ul>{deleteRows}</ul>
      <br/>
      Any answered responses and rewards will be LOST FOREVER.<br/>
      {reassignmentWarning}
      {!understandDeleteMany.current && <FormControlLabel control={<Checkbox defaultChecked={understandDeleteMany.current} onChange={(_, checked: boolean) => { understandDeleteMany.current = checked; }} />} label={`I understand:`} />}
    </Box>);
    }
  };

  const handleDeleteSelectedConfirm = async () => {
    setLoading(true);
    if (!understandDeleteMany.current || assessmentIdsToDeleteMany.current.length === 0) {
      setError(!understandDeleteMany.current ? 'Must check "I understand" statement to delete multiple results.' : 'Nothing to delete.');
      setErrorPopup(true);
    } else {
      try {
        const response: ApiResponse<any> = await deleteManyAssessmentResult(assessmentIdsToDeleteMany.current);
        setSuccessPopupProps({ ...successPopupProps, content: response?.message ?? '', open: true });
        onFilter();
      } catch (error) {
        console.error(error);
        setErrorPopup(true);
      }
    }
    assessmentIdsToDeleteMany.current = [];
    setLoading(false);
  };

  const EmailCell = ({ params: { id, row, value } }: { params: GridRenderCellParams }) => {
    return (
      <Box>
        <span>{value ?? '-'}</span>
        {value && <>
          <br />
          <Button onClick={() => { handleEmailSelectedClick(new Map([[id as string, row]])); }} variant="contained" size='small' startIcon={<EmailOutlinedIcon />}>Email</Button>
        </>}
      </Box>
    );
  };

  const [rows, setRows] = useState<GridRowsProp>([]);
  const newRows = useRef<GridRowsProp<IAssessmentResult>>([]);
  const [assessments, setAssessments] = useState<{ [key: string]: IAssessment }>({});
  const { getAssessmentResultList, deleteAssessmentResult, deleteManyAssessmentResult, sendClientEmail, remarkAssessmentResults, error } = assessmentResultHooks();
  const { getAssessmentList, error: a_error, setError } = assessmentHooks();

  const [successPopupProps, setSuccessPopupProps] = useState<PopupProps>({
    open: false,
    content: '',
    onClose: () => {
      setSuccessPopupProps({ ...successPopupProps, open: false });
    }
  });
  const errorPopupProps: PopupProps = {
    open: errorPopup,
    content: a_error ?? error ?? 'Unknown Error',
    onClose: () => {
      setError(null);
      setErrorPopup(false);
    }
  };

  const reassignmentWarning = <Typography component="span">If not excluded, editing and saving the assessment will re-assign the assessment to the student/group/client.</Typography>;

  const handleDeleteClick = (id: GridRowParams['id'], row: GridRowParams['row']) => {
    selectedAction.current = "Delete";
    assessmentIdToDelete.current = id as string;
    const studentOrGroupLabel = assessments[row.assessment]?.type === AssessmentType.ClientEvaluation ? 'Group' : 'Student';
    setConfirmationMessage(
      <>Are you sure you want to delete Assessment Result {row._id}?<br />Assessment: A{assessments[row.assessment]?.numId}. {assessments[row.assessment]?.title} ({AssessmentTypeStr[assessments[row.assessment]?.type as number]})
        <FormControlLabel disabled control={<Checkbox />} label={`Exclude ${studentOrGroupLabel} from this assessment`} />
        <br />
        {reassignmentWarning}
      </>);
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteAssessmentResult(assessmentIdToDelete.current);
      setRows(rows.filter((row) => row._id !== assessmentIdToDelete.current));
    } catch (error) {
      setErrorPopup(true);
    }
    setLoading(false);
  };
  const handleSendClientEmail = async () => {
    setLoading(true);
    setBulkEmailEnabled(false);
    try {
      const response: ApiResponse<any> = await sendClientEmail({ firstEmailAssessmentResultIds: firstEmailAssessmentResultIds.current, resendEmailAssessmentResultIds: shouldResendEmail.current ? resendEmailAssessmentResultIds.current : [] } as AssessmentResultService.IAssessmentResultEmailList);
      setSuccessPopupProps({ ...successPopupProps, content: response?.message ?? '', open: true });
      onFilter();
    } catch (error) {
      console.error(error);
      setErrorPopup(true);
      setBulkEmailEnabled(true);
    }
    setLoading(false);
  }

  const columns: GridColDef[] = useMemo(() => [
    { field: 'type', valueGetter: (_, row) => assessmentTypeValueGetter(assessments[row.assessment]?.type as number), headerName: 'Assessment Type', filterable: false, width: 150 },
    { field: 'title', valueGetter: (_, row) => `A${assessments[row.assessment]?.numId}. ${assessments[row.assessment]?.title}`, headerName: 'Assessment', minWidth: 150, flex: 1, filterable: false, renderCell: (params: GridRenderCellParams) => <ExpandableCell maxChar={150} params={params} />, },
    { field: `evaluator`, valueGetter: (v: IAssessmentResult['evaluator']) => `${(v.evaluator as unknown as Student)?.matricNumber ?? ''} ${v.evaluator?.name}`, headerName: 'Evaluator', width: 150 },
    {
      field: 'accessCode', headerName: 'Access Link', valueGetter: (_, row) => {
        return (row as IAssessmentResult).evaluator?.access_code ? `${window.location.origin}/client/evaluation/${(row as IAssessmentResult).evaluator?.access_code}` : '-';
      }, renderCell: (params: GridRenderCellParams) => <LinkCell params={params} />, width: 150
    },
    {
      field: 'emailJob', headerName: 'Email Status', valueGetter: (v: IAssessmentResult['emailJob'], row) => {
        if (assessments[row.assessment]?.type !== AssessmentType.ClientEvaluation) { return; }
        return getEmailJobStatus(v);
      }, renderCell: (params: GridRenderCellParams) => <EmailCell params={params} />, width: 150
    },
    { field: `evaluatee`, valueGetter: (_, row) => row.evaluateeStudent ? `${row.evaluateeStudent.matricNumber} ${row.evaluateeStudent.name}` : (row.evaluateeGroup ? row.evaluateeGroup.name : '-'), headerName: 'Evaluatee', width: 150 },
    { field: 'startedAt', type: 'dateTime', headerName: 'Started', valueGetter: dateValueGetter, valueFormatter: dateValueFormatter, width: 150 },
    { field: 'endedAt', type: 'dateTime', headerName: 'Submitted', valueGetter: dateValueGetter, valueFormatter: dateValueFormatter, width: 150 },
    { field: 'completed', type: 'boolean', headerName: 'Complete Required', width: 150 },
    { field: `rewards.${RewardType.POINT}`, type: 'number', headerName: 'Points', valueGetter: (_, row: IAssessmentResult) => (assessments[row.assessment as string]?.quiz_assigned as IQuiz)?.rewards?.[RewardType.POINT] ? row.totalRewards?.[RewardType.POINT] : undefined, valueFormatter: (_, row: IAssessmentResult) => (assessments[row.assessment as string]?.quiz_assigned as IQuiz)?.rewards?.[RewardType.POINT] ? (isNaN(row.totalRewards?.[RewardType.POINT]) ? '-' : row.totalRewards?.[RewardType.POINT]) : 'Disabled', width: 150 },
    { field: `rewards.${RewardType.SCORE}`, type: 'number', headerName: 'Score', valueGetter: (_, row: IAssessmentResult) => (assessments[row.assessment as string]?.quiz_assigned as IQuiz)?.rewards?.[RewardType.SCORE] ? row.totalRewards?.[RewardType.SCORE] : undefined, valueFormatter: (_, row: IAssessmentResult) => (assessments[row.assessment as string]?.quiz_assigned as IQuiz)?.rewards?.[RewardType.SCORE] ? (isNaN(row.totalRewards?.[RewardType.SCORE]) ? '-' : row.totalRewards?.[RewardType.SCORE]) : 'Disabled', width: 150 },
    {
      field: 'action', headerName: 'Action', type: 'actions',
      getActions: ({ id, row }) => {
        return [
          <LinkStyled to={getReviewLink(row)} target='_blank' rel='opener'>
            <GridActionsCellItem
              icon={<EditOutlinedIcon />}
              label="Edit"
              color="inherit"
            />
          </LinkStyled>,
          <GridActionsCellItem
            icon={<DeleteOutlinedIcon />}
            label="Delete"
            onClick={() => handleDeleteClick(id, row)}
            color="inherit"
          />,
        ];
      },
      width: 150
    },
  ], [assessments]);

  const [searchParams] = useSearchParams();
  // react hook form
  const defaultValues: DefaultValues<AssessmentResultService.IAssessmentResultFilter> = {
    filter: {
      assessment_types: { [AssessmentType.SelfAssessment]: true, [AssessmentType.PeerEvaluation]: true, [AssessmentType.ClientEvaluation]: true },
      assessment_ids: [],
    }
  };
  const form = useForm({
    defaultValues
  });
  const { control, formState: { errors }, handleSubmit, register, watch, getValues, setFocus, setValue, reset } = form;

  const getAllAssessmentResults = async (filter: AssessmentResultService.IAssessmentResultFilter) => {
    try {
      const results = await getAssessmentResultList(filter);
      if (results) {
        newRows.current = results.results;
        setAssessments(results.assessments);
      }
    } catch (err) {
      console.error('Error:', err);
      setErrorPopup(true);
    }
    setLoading(false);
    setBulkEmailEnabled(true);
  };

  const gridApiRef = useGridApiRef();

  const isInitialPageLoad = useRef(true);
  useEffect(() => {
    setRows(newRows.current);
    if (isInitialPageLoad.current && newRows.current.length >= 1 && searchParams.get('assessmentId')) {
      isInitialPageLoad.current = false;
      const rowSelectionModel = newRows.current.map(result => result._id) as any[];
      gridApiRef.current.setRowSelectionModel(rowSelectionModel);
    }
  }, [assessments]);

  const getAssessmentOptionLabel = (o: any) => o.concatLabel;
  const FILTER_DEBOUNUCE_WAIT_DURATION = 800;
  const [assessmentList, setAssessmentList] = useState<IAssessmentFilterResult[]>([]);
  const initialAssessmentList = useRef<IAssessmentFilterResult[]>([]);
  const shouldResetInitialAssessmentList = useRef(false); // set to true when filter assessment types has changed to refetch assessmentlist from server without any text/search filter
  const filterAssessmentList = useMemo(
    () => debounce(
      (inputValue: string | null) => {
        if (!inputValue || inputValue.trim() === '') {
          setAssessmentList(initialAssessmentList.current);
          return;
        }
        getAssessmentList(getAssessmentFilter(inputValue)).then((assessmentList) => {
          if (assessmentList) {
            setAssessmentList(assessmentList);
          }
        });
      },
      FILTER_DEBOUNUCE_WAIT_DURATION,
    ),
    [],
  );

  const onSubmit: SubmitHandler<typeof defaultValues> = (data) => {
    data.filter!.assessment_ids = (data.filter!.assessment_ids as IAssessment[])!.map((a) => a._id);
    getAllAssessmentResults(data as AssessmentResultService.IAssessmentResultFilter);
  }

  const getAssessmentFilter = (filterConcatLabel?: string, filterId?: string) => {
    const filter: AssessmentService.IAssessmentFilter = {
      assessmentTypes: getValues('filter.assessment_types') as AssessmentService.IAssessmentFilter['assessmentTypes'],
      concatLabel: filterConcatLabel,
      assessmentId: filterId
    };
    return filter;
  }

  const fetchData = async (initial?: boolean) => {
    if(!initial) {
      const assessmentIds = getValues('filter.assessment_ids');
      if(!Array.isArray(assessmentIds) || assessmentIds.length === 0) {
        setError('Please filter at least one assessment.');
        setErrorPopup(true);
        return;
      }
    }
    setLoading(true);
    const assessmentList = await getAssessmentList(getAssessmentFilter('', initial ? (searchParams.get('assessmentId') ?? undefined) : undefined));
    if (assessmentList) {
      initialAssessmentList.current = assessmentList;
      if (initial && searchParams.get('assessmentId')) {
        const assessmentFound = assessmentList.find((a: any) => a._id === searchParams.get('assessmentId'));
        if (assessmentFound) {
          setValue('filter.assessment_ids', [assessmentFound]);
        }
      }
    }
    handleSubmit(onSubmit)();
  }

  useEffect(() => {
    fetchData(true);
  }, []);

  const onFilter = debounce(
    () => {
      handleSubmit(onSubmit)();
      if (shouldResetInitialAssessmentList.current) {
        shouldResetInitialAssessmentList.current = false;
        getAssessmentList(getAssessmentFilter()).then((assessmentList) => {
          if (assessmentList) {
            initialAssessmentList.current = assessmentList;
            setAssessmentList(initialAssessmentList.current);
          }
        });
      }
    },
    FILTER_DEBOUNUCE_WAIT_DURATION,
  );

  const watchAssessmentIds = useWatch({ control, name: 'filter.assessment_ids' });
  useEffect(() => {
    onFilter();
  }, [watchAssessmentIds]);

  return <>
    {loadingPopupProps && <LoadingPopup
      open={loadingPopupProps.open}
      onClose={loadingPopupProps.onClose}
      content={loadingPopupProps.content}
    />}
    {successPopupProps && <SuccessPopup
      open={successPopupProps.open}
      onClose={successPopupProps.onClose}
      content={successPopupProps.content}
    />}
    <ConfirmationPopup
      open={confirmationMessage !== null}
      onClose={() => {
        setConfirmationMessage(null);
        selectedAction.current = '';
      }}
      onConfirm={() => {
        if (selectedAction.current === "Delete") {
          handleDelete();
        } else if (selectedAction.current === "Email") {
          handleSendClientEmail();
        } else if (selectedAction.current === "delete_many") {
          handleDeleteSelectedConfirm();
        }
        selectedAction.current = '';
        setConfirmationMessage(null);
      }}
      content={confirmationMessage}
    />
    {errorPopupProps && <ErrorPopup
      open={errorPopupProps.open}
      onClose={errorPopupProps.onClose}
      content={errorPopupProps.content}
    />}
    <ContentPanel title="Assessment Management / Assessment Result"
      customActions={
        <IconButton sx={{ backgroundColor: 'lightgray' }} onClick={() => { fetchData(); }}><Refresh /></IconButton>
      }
      content={
        <>
          <Box sx={{ textAlign: 'left', userSelect: 'none' }}>
            <Typography component="span" sx={{ mr: 2 }}><b>Filter Assessment Types:</b></Typography>
            <Controller name={`filter.assessment_types.${AssessmentType.SelfAssessment}`} control={control} render={({ field: { value, onChange, ...field } }) => <FormControlLabel control={<Checkbox {...field} checked={value as any} onChange={(e, checked: boolean) => { onChange(e); shouldResetInitialAssessmentList.current = true; onFilter(); }} />} label={AssessmentTypeStr[AssessmentType.SelfAssessment]} />} />
            <Controller name={`filter.assessment_types.${AssessmentType.PeerEvaluation}`} control={control} render={({ field: { value, onChange, ...field } }) => <FormControlLabel control={<Checkbox {...field} checked={value as any} onChange={(e, checked: boolean) => { onChange(e); shouldResetInitialAssessmentList.current = true; onFilter(); }} />} label={AssessmentTypeStr[AssessmentType.PeerEvaluation]} />} />
            <Controller name={`filter.assessment_types.${AssessmentType.ClientEvaluation}`} control={control} render={({ field: { value, onChange, ...field } }) => <FormControlLabel control={<Checkbox {...field} checked={value as any} onChange={(e, checked: boolean) => { onChange(e); shouldResetInitialAssessmentList.current = true; onFilter(); }} />} label={AssessmentTypeStr[AssessmentType.ClientEvaluation]} />} />
          </Box>
          <Box sx={{ textAlign: 'left', marginY: 2 }}>
            <FormProvider {...form}>
              <Typography component='span'><b>Filter Assessments:</b></Typography>
              <RHFAutocomplete sx={{ mt: 1, maxWidth: 600 }} fieldName='filter.assessment_ids' options={assessmentList} filterOptions={filterAssessmentList} getOptionLabel={getAssessmentOptionLabel} textFieldLabel='Assessments' noOptionsText='No result. Ensure you filtered the correct assessment type above.' />
              <Typography component='span'>Date range displayed in this filter box are the assessment start and end dates based on UTC+8 (MYT) time zone.</Typography>
            </FormProvider>
          </Box>
          <Box sx={{ display: 'flex', columnGap: 4, alignItems: 'center', justifyContent: 'flex-end', marginBottom: 4 }}>
            <Button sx={{ borderRadius: 5, py: 1.2 }} disabled={!bulkEmailEnabled} onClick={() => handleEmailSelectedClick(gridApiRef.current.getSelectedRows() as any)} variant="contained" startIcon={<EmailOutlinedIcon />}>Email Selected</Button>
            <Button sx={{ borderRadius: 5, py: 1.2 }} onClick={() => handleRemarkSelectedClick(gridApiRef.current.getSelectedRows() as any)} variant="contained" startIcon={<GradeOutlinedIcon />}>Remark Selected</Button>
            <Button sx={{ borderRadius: 5, py: 1.2 }} onClick={() => handleDeleteSelectedClick(gridApiRef.current.getSelectedRows() as any)} variant="contained" startIcon={<DeleteOutlinedIcon />}>Delete Selected</Button>
            <Button sx={{ borderRadius: 5, py: 1.2 }} onClick={() => gridApiRef.current.exportDataAsCsv()} variant="contained" startIcon={<FileDownloadOutlinedIcon />}>Export CSV</Button>
          </Box>
          <div style={{  display: 'flex', flexDirection: 'column', height: '80vh' }}>
            <AssessmentDataGrid apiRef={gridApiRef} loading={loading} rows={rows} columns={columns} checkboxSelection disableRowSelectionOnClick />
          </div>
        </>
      }
    />
  </>;
};

export default AssessmentResultManage;
