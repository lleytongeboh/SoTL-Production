import React, { ReactNode, useEffect, useRef, useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { Box, Button, FormControl, FormControlLabel, FormLabel, InputLabel, MenuItem, Radio, RadioGroup, Select, SelectChangeEvent, TextField, Typography, styled, useMediaQuery, useTheme } from '@mui/material';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AssessmentTimer, { enGBLocale } from '../components/AssessmentTimer';
import { assessmentResultHooks } from '../hooks/assessmentResultHooks';
import { isRouteErrorResponse, useLocation, useNavigate, useParams } from 'react-router-dom';
import { IAssessmentResult, IAssessmentResultMultiple, IAssessmentResultPage } from '../../../../models/AssessmentResult';
import { AssessmentType, IAssessment } from '../../../../models/Assessment';
import { dateValueFormatter } from '../../../../components/AssessmentDataGrid';
import { IQuestion, IQuiz, LikertScale, QuestionItem, QuestionType, RewardType } from '../../../../models/Quiz';
import { DoneOutlined, EditOutlined } from '@mui/icons-material';
import { Controller, DefaultValues, SubmitHandler, useForm, FormProvider, useFieldArray, useFormContext, FieldValues } from 'react-hook-form';
import ErrorPopup from "../../../../components/ErrorPopup";
import SuccessPopup, { PopupProps } from "../../../../components/SuccessPopup";
import LoadingPopup, { LoadingPopupProps } from "../../../../components/LoadingPopup";
import FormHelperText from '@mui/material/FormHelperText';
import ConfirmationPopup from '../../../../components/ConfirmationPopup';
import AssessmentNavigation from '../components/AssessmentNavigation';
import { Student } from '@models/Student';
import { useSearchParams } from 'react-router-dom';
import { Group } from '../../../../models/Group';
import { Project } from '../../../../models/Project';
import { Backdrop } from '@mui/material';

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const defaultValues: DefaultValues<IAssessmentResultPage> = {
  pageNum: 0,
  responses: [{
    quizItem: '',
    response: '',
    options: [],
    op_answer: '',
  }],
};

const dateTimeOptions: Intl.DateTimeFormatOptions = {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true
};
const AssessmentTableRow: React.FC<{ th: ReactNode, td: ReactNode }> = ({ th, td }) => (
  <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }} >
    <TableCell component="th" scope="row" align='right'>{th}</TableCell>
    <TableCell>{td}</TableCell>
  </TableRow>
);

interface LikertScaleFieldProps {
  fieldIndex: number;
  required: boolean;
  statements: LikertScale['likert_statements'];
  options?: QuestionItem[];
  reviewMode?: boolean;
}
const LikertScaleField = ({ fieldIndex, required, statements, options, reviewMode }: LikertScaleFieldProps) => {
  const { control, formState: { errors } } = useFormContext<IAssessmentResultPage>();

  return (
    <TableContainer component={Paper} sx={{ textAlign: 'left', marginBottom: 4 }}>
      <Table size="small" aria-label="likert scale">
        <TableHead sx={{ 'th': { fontWeight: 'bold' } }}>
          <TableRow>
            <TableCell></TableCell>
            {options?.map((option, i) => <TableCell align='center' key={option?._id ?? i} sx={{ whiteSpace: 'pre-line' }}>{option?.label ?? i}</TableCell>)}
          </TableRow>
        </TableHead>
        <TableBody>
          {statements?.map((statement) =>
            <TableRow key={statement._id}>
              <TableCell>{statement.label}</TableCell>
              <Controller name={`responses.${fieldIndex}.likert_response.${statement._id as string}`} rules={required ? { required: 'This question is required.' } : undefined} control={control} render={({ field: { value, onChange, ...field } }) => <>
                {options?.map((option, i) => {
                  return (
                    <TableCell align='center' key={option?._id ?? i}><Radio disabled={reviewMode} checked={value === option._id} onChange={onChange} value={option._id} /></TableCell>);
                })}
              </>
              } />
            </TableRow>)}
        </TableBody>
      </Table>
    </TableContainer>);
}

// prevent entering a text field from submitting the form
const handleTextFieldKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    return false;
  }
};
const errorBorderStyle = { borderColor: 'red', borderWidth: 1 };
interface QuizItemFieldProps {
  quizRewards?: IQuiz['rewards'];
  response: IAssessmentResultPage['responses'][number];
  reviewMode?: boolean;
  fieldIndex: number;
  isLecturerPage: boolean;
}
const QuizItemField = ({ quizRewards, response, reviewMode, fieldIndex, isLecturerPage }: QuizItemFieldProps) => {
  const { control, formState: { errors } } = useFormContext<IAssessmentResultPage>();

  return (
    <Box sx={{ m: 1, ...((errors?.responses?.[fieldIndex]?.response || errors?.responses?.[fieldIndex]?.likert_response) ? errorBorderStyle : {}) }}>
      {typeof response?.quizItem !== 'object' && <p>Error: Unable to load quiz item / question {(response.quizItem as unknown as string) ?? 'undefined'}</p>}
      <FormControl sx={{ m: 2, width: '100%' }} variant="standard">
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography sx={{ flexGrow: 1 }}>Question {response?.questionNum}</Typography>
          {reviewMode && <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', columnGap: 2, flexBasis: '250px' }}>
            {quizRewards?.[RewardType.POINT] && <Controller name={`responses.${fieldIndex}.rewards.${RewardType.POINT}` as const} control={control} rules={{ pattern: /^[0-9]*(?:\.[0-9]*)?$/ }} render={({ field }) => <TextField sx={{ flexBasis: '100px' }} InputProps={{ readOnly: true }} error={errors?.responses?.[fieldIndex]?.rewards?.[RewardType.POINT] ? true : false} helperText={errors?.responses?.[fieldIndex]?.rewards?.[RewardType.POINT] ? 'Point must be a valid positive number.' : false} size='small' type='number' inputMode='numeric' label='Point' variant="outlined" {...field} />} />}
            {quizRewards?.[RewardType.SCORE] && <Controller name={`responses.${fieldIndex}.rewards.${RewardType.SCORE}`} control={control} rules={{ pattern: /^[0-9]*(?:\.[0-9]*)?$/ }} render={({ field }) => <TextField sx={{ flexBasis: '100px' }} InputProps={{ readOnly: true }} error={errors?.responses?.[fieldIndex]?.rewards?.[RewardType.SCORE] ? true : false} helperText={errors?.responses?.[fieldIndex]?.rewards?.[RewardType.SCORE] ? 'Score must be a valid positive number.' : false} size='small' type='number' inputMode='numeric' label='Score' variant="outlined" {...field} />} />}
          </Box>}
        </Box>
        <FormLabel style={{ whiteSpace: 'pre-wrap' }}>{(response.quizItem as IQuestion)?.title ?? (response.quizItem as IQuestion)?._id}</FormLabel>
        {(response.quizItem as IQuestion).type === QuestionType.MCQ && <>
          <Controller name={`responses.${fieldIndex}.response`} rules={reviewMode ? undefined : ((response.quizItem as IQuestion)?.required ? { required: 'This question is required.' } : undefined)} control={control} render={({ field }) => <RadioGroup {...field}>
            {response?.options?.map(o =>
              <FormControlLabel key={o._id ?? o as unknown as string} value={o._id ?? o} control={<Radio disabled={reviewMode} />} label={o.label ?? o} />
            )}
          </RadioGroup>} />
        </>
        }
        {(response.quizItem as IQuestion).type === QuestionType.OEQ && <Controller name={`responses.${fieldIndex}.op_answer`} rules={reviewMode ? undefined : ((response.quizItem as IQuestion).required ? { required: true } : undefined)} control={control} render={({ field }) => <TextField sx={{ backgroundColor: 'white', marginTop: 2 }} disabled={reviewMode} required={reviewMode ? undefined : (response.quizItem as IQuestion).required} error={errors?.responses?.[fieldIndex]?.response ? true : undefined} onKeyDown={(response.quizItem as IQuestion).multiline ? undefined : handleTextFieldKeyDown} multiline={(response.quizItem as IQuestion).multiline} fullWidth label="Answer" variant="outlined" {...field} />} />}
        {(response.quizItem as IQuestion).type === QuestionType.LIKERT && <LikertScaleField fieldIndex={fieldIndex} required={reviewMode ? false : (response.quizItem as IQuestion).required} options={response?.options} statements={(response.quizItem as LikertScale).likert_statements} reviewMode={reviewMode} />}
        {(response.quizItem as IQuestion).type !== QuestionType.LIKERT && <FormHelperText error={errors?.responses?.[fieldIndex]?.response ? true : undefined}>{errors?.responses?.[fieldIndex]?.response?.message}</FormHelperText>}
        {(response.quizItem as IQuestion).type === QuestionType.LIKERT && <FormHelperText error={errors?.responses?.[fieldIndex]?.likert_response ? true : undefined}>{errors?.responses?.[fieldIndex]?.likert_response ? 'This question is required.' : undefined}</FormHelperText>}
      </FormControl>
    </Box>
  );
};


const AssessmentQuiz: React.FC<{ reviewMode?: boolean }> = ({ reviewMode = false }) => {
  const [loading, setLoading] = useState(false);
  const [drawerCollapse, setDrawerCollapse] = useState(false);
  const [successPopup, setSuccessPopup] = useState(false);
  const [errorPopup, setErrorPopup] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [onConfirm, setOnConfirm] = useState<() => void>(() => { });
  const { assessmentIdParam, accessCodeParam } = useParams();
  const [showSummary, setShowSummary] = useState(true);
  const [currentEvaluateeId, setCurrentEvaluateeId] = useState<string>('');
  const [assessmentResultMultiple, setAssessmentResultMultiple] = useState<IAssessmentResultMultiple>({ results: [], canSubmitAll: false });
  const [evaluatees, setEvaluatees] = useState<IAssessmentResult['evaluatee'][]>([]);
  const [currentAssessmentResult, setCurrentAssessmentResult] = useState<IAssessmentResult | undefined>(undefined);
  const [questionResponses, setQuestionResponses] = useState<IAssessmentResultPage['responses'] | undefined>(undefined);
  const [searchParams] = useSearchParams();
  const assessmentId = assessmentIdParam ?? 'client';
  const accessCode = accessCodeParam ?? searchParams.get('clientAccessCode') ?? null;
  const { setNewEvaluateeId, getAssessment, getAssessmentPage, startAssessment, endAssessment, saveAssessmentPage, error } = assessmentResultHooks(searchParams, accessCode!, currentEvaluateeId);
  const [isReviewMode, setIsReviewMode] = useState(reviewMode);
  const currentPageNum = useRef(1);

  const theme = useTheme();
  const smallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const navigate = useNavigate();
  const location = useLocation();
  const isLecturerPage = location.pathname.startsWith('/lecturer/assessment-result/');

  const loadingPopupProps: LoadingPopupProps = {
    open: loading
  };

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



  const refreshAllQuestionsList = (assessmentResult: IAssessmentResult) => {
    const questionResponses = [];
    if (!Array.isArray(assessmentResult.pages)) {
      return;
    }
    for (const page of assessmentResult.pages) {
      questionResponses.push(...page.responses.filter((response) => (response.quizItem as IQuestion)?.isQuestion));
    }
    setQuestionResponses(questionResponses);
  }

  const fetchData = async () => {
    try {
      const assessmentResultMultiple = await getAssessment(assessmentId);
      if (assessmentResultMultiple.results.length >= 1) {
        setAssessmentResultMultiple(assessmentResultMultiple);
        updateEvaluatees(assessmentResultMultiple.results);
        if (searchParams.get('evaluateeId')) {
          setCurrentEvaluateeId(searchParams.get('evaluateeId')!);
        } else if (assessmentResultMultiple.results[0].evaluatee) {
          setCurrentEvaluateeId((assessmentResultMultiple.results[0].evaluatee as Student)._id);
        }
        setCurrentAssessmentResult(assessmentResultMultiple.results[0]);
        refreshAllQuestionsList(assessmentResultMultiple.results[0]);
        if (assessmentResultMultiple.results[0].endedAt && (assessmentResultMultiple.results[0].assessment as IAssessment)?.public && (assessmentResultMultiple.results[0].assessment as IAssessment)?.isPublicForReview) {
          setIsReviewMode(true);
        } else if (!reviewMode) {
          const firstPageNotCompleted = assessmentResultMultiple.results[0]?.pages.find((page) => !page.completed);
          currentPageNum.current = (firstPageNotCompleted?.pageNum ?? assessmentResultMultiple.results[0]?.pages[assessmentResultMultiple.results[0]?.pages.length - 1].pageNum!);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setErrorPopup(true);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const backButtonPressed = useRef(false);

  const updateCachedAssessmentResults = (nextPageResult: IAssessmentResult) => {
    const resultIndexToUpdate = assessmentResultMultiple.results.findIndex((result) => result._id === nextPageResult._id);
    if (resultIndexToUpdate !== -1) {
      let canSubmitAll = true;
      assessmentResultMultiple.results[resultIndexToUpdate] = { ...nextPageResult, assessment: assessmentResultMultiple.results[resultIndexToUpdate].assessment, evaluator: assessmentResultMultiple.results[resultIndexToUpdate].evaluator };
      for (const result of assessmentResultMultiple.results) {
        if (!result.canSubmit) {
          canSubmitAll = false;
        }
      }
      assessmentResultMultiple.canSubmitAll = canSubmitAll;
      setAssessmentResultMultiple({ ...assessmentResultMultiple });
    } else {
      console.error(`Failed to update cached assessment results, result ${nextPageResult._id} not found.`);
    }
  };

  const onSubmit: SubmitHandler<any> & ((data: FieldValues, event?: React.BaseSyntheticEvent, callback?: Function) => Promise<unknown>) = async (data, event?: React.BaseSyntheticEvent, callback?: Function) => {
    setLoading(true);
    if (isReviewMode) {
      if (backButtonPressed.current) {
        if (currentPageNum.current > 1) {
          currentPageNum.current--;
          await handleContinue();
        } else {
          setShowSummary(true);
        }
      } else if (!isNaN(currentAssessmentResult?.lastPage!) && currentPageNum.current >= currentAssessmentResult?.lastPage!) {
        setShowSummary(true);
      } else {
        currentPageNum.current++;
        await handleContinue();
      }
    } else {
      try {
        const nextPageResult = await saveAssessmentPage(assessmentId!, data, backButtonPressed.current);
        if (nextPageResult) {
          setCurrentAssessmentResult(nextPageResult);
          updateCachedAssessmentResults(nextPageResult);
          if (nextPageResult.currentPage === -1) {
            setShowSummary(true);
          } else if (Array.isArray(nextPageResult.pages)) {
            currentPageNum.current = nextPageResult.currentPage ?? 1;
            reset(nextPageResult.pages[nextPageResult.currentPage! - 1]);
          }
        }
      } catch (error) {
        setErrorPopup(true);
        console.error('Error:', error);
      }
    }
    if (callback) {
      await callback();
    } else {
      setLoading(false);
    }
  };

  const showPage = (assessmentPageResult: IAssessmentResult) => {
    if (assessmentPageResult) {
      if (currentAssessmentResult?.duration && !assessmentPageResult.duration) {
        assessmentPageResult.duration = currentAssessmentResult?.duration;
      }
      setCurrentAssessmentResult(assessmentPageResult);
    }
    if (assessmentPageResult) {
      if (Array.isArray(assessmentPageResult.pages)) {
        reset(assessmentPageResult.pages[assessmentPageResult.currentPage! - 1]);
      }
    }
    setShowSummary(false);
  }

  const confirmStart = async () => {
    setLoading(true);
    setConfirmationMessage('');
    try {
      const result = await startAssessment(assessmentId!);
      showPage(result);
    } catch (error) {
      console.error('Error:', error);
      setErrorPopup(true);
    }
    setLoading(false);
  }

  const handleStart = async () => {
    if ((currentAssessmentResult?.assessment as IAssessment).type === AssessmentType.SelfAssessment) {
      setOnConfirm(() => confirmStart);
      setConfirmationMessage(`Start ${(assessmentResultMultiple.results[0]?.assessment as IAssessment)?.typeLabel?.toLowerCase()}? You can only attempt this once.`)
    } else {
      confirmStart();
    }
  }

  const handleContinue = async () => {
    setLoading(true);
    try {
      const assessmentPageResult = await getAssessmentPage(assessmentId!, currentPageNum.current, isReviewMode);
      showPage(assessmentPageResult);
    } catch (error) {
      console.error('Error:', error);
      setErrorPopup(true);
    }
    setLoading(false);
  }

  const confirmEnd = async () => {
    setLoading(true);
    setConfirmationMessage('');
    try {
      const response = await endAssessment(assessmentId!);
      setCurrentAssessmentResult(response.result);
    } catch (error) {
      console.error('Error:', error);
      setErrorPopup(true);
    }
    setLoading(false);
  };

  const handleEnd = async () => {
    setOnConfirm(() => confirmEnd);
    setConfirmationMessage('Submit all your answers and finish? Once you submit your answers, you won’t be able to change them.')
  }

  const handleSwitchPage = async (pageNum: number) => {
    /* if (!currentAssessmentResult || currentAssessmentResult.currentPage === pageNum) {
      return;
    }
    setLoading(true);
    if (showSummary) {

    } else {
      handleSubmit(onSubmit)();
    } */

    if (!isReviewMode) {
      return;
    }
    currentPageNum.current = pageNum;
    handleContinue();
  }

  const updateEvaluatees = (assessmentResults: IAssessmentResult[]) => {
    setEvaluatees(assessmentResults.filter((result) => result.evaluatee).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map((result) => result.evaluatee));
  }

  const onEvaluateeChange = async (event: SelectChangeEvent<typeof currentEvaluateeId>) => {
    try {
      setNewEvaluateeId(event.target.value);
      const assessmentResultMultiple = await getAssessment(assessmentId!);
      let found;
      if (assessmentResultMultiple.results.length >= 1) {
        found = assessmentResultMultiple.results.find((result) => (result.evaluatee as Student)?._id === event.target.value);
        if (found) {
          setAssessmentResultMultiple(assessmentResultMultiple);
          updateEvaluatees(assessmentResultMultiple.results);
          setCurrentAssessmentResult(found);
        }
      }
      if (!found) {
        throw new Error(`Assessment result not found for evaluatee id ${event.target.value}.`);
      }
      setCurrentEvaluateeId(event.target.value);
      currentPageNum.current = 1;
      setShowSummary(true);
    } catch (err) {
      console.error('Error:', err);
      setErrorPopup(true);
    }
    setLoading(false);
  }

  const handleEvaluateeChange = async (event: SelectChangeEvent<typeof currentEvaluateeId>) => {
    if (event.target.value === currentEvaluateeId) {
      return;
    }
    if (showSummary) {
      setLoading(true);
      await onEvaluateeChange(event);
    } else {
      handleSubmit((data) => onSubmit(data, undefined, async () => {
        await onEvaluateeChange(event);
      }))();
    }
  };

  const form = useForm<IAssessmentResultPage>({
    defaultValues
  });
  const { control, formState: { errors }, handleSubmit, register, watch, getValues, setFocus, setValue, reset } = form;
  const { fields, append: appendField, insert: insertField, swap: swapField, remove: removeField } = useFieldArray({
    control,
    name: "responses"
  });

  const AssessmentControlPanel: React.FC = () => {
    return <>
      {!isLecturerPage && (currentAssessmentResult?.assessment as IAssessment)?.public && !currentAssessmentResult?.startedAt && !currentAssessmentResult?.endedAt && <Box><Button sx={{ mb: 2 }} onClick={handleStart} variant="contained" startIcon={<EditOutlined />}>Start</Button></Box>}
      {currentAssessmentResult?.endedAt && <p>No more attempt is allowed.</p>}
      {!(currentAssessmentResult?.assessment as IAssessment)?.public && <p>Assessment is hidden.</p>}
      {!isLecturerPage && (currentAssessmentResult?.assessment as IAssessment)?.public && currentAssessmentResult?.startedAt && !currentAssessmentResult?.endedAt && <Button onClick={handleContinue} variant="contained" startIcon={<EditOutlined />}>Continue Attempt</Button>}
      <br />
      <br />
      {!isLecturerPage && (currentAssessmentResult?.assessment as IAssessment)?.public && assessmentResultMultiple.canSubmitAll && !currentAssessmentResult?.endedAt && <Button onClick={handleEnd} variant="contained" startIcon={<DoneOutlined />}>Submit and End</Button>}
    </>
  }

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
    {errorPopupProps && <ErrorPopup
      open={errorPopupProps.open}
      onClose={errorPopupProps.onClose}
      content={errorPopupProps.content}
    />}
    <ConfirmationPopup
      open={confirmationMessage !== ''}
      onClose={() => setConfirmationMessage('')}
      onConfirm={onConfirm}
      content={confirmationMessage}
    />
        <Box sx={{  mx: '-20px' }}>
    <Box sx={{ backgroundColor: '#f5f5f5', columnGap: drawerCollapse ? 0 : 4, display: 'inline-flex' }}>
      <Box sx={{ flexShrink: 0, ...(drawerCollapse ? {} : { flexBasis: '300px', minWidth: '300px', maxWidth: '400px', flexGrow: 1 }) }}>
        <Box sx={{ position: 'absolute' }}>
          <Button sx={{ borderRadius: 20 }} component="label" variant="contained" tabIndex={-1} startIcon={drawerCollapse ? <ChevronRightIcon /> : <ChevronLeftIcon />} onClick={() => setDrawerCollapse(!drawerCollapse)}>Info</Button>
        </Box>
        <Box sx={{ display: drawerCollapse ? 'none' : 'flex', flexDirection: 'column', flexShrink: 0, rowGap: 2, textAlign: 'left', paddingTop: 6 }}>
          <Card sx={{ p: 3 }} variant="outlined">
            <Typography sx={{ display: 'inline-block' }} variant="h5" gutterBottom><strong>{(assessmentResultMultiple.results[0]?.assessment as IAssessment)?.typeLabel} A{(assessmentResultMultiple.results[0]?.assessment as IAssessment)?.numId}</strong></Typography>
            <CardContent>
              <Typography sx={{ mb: 2, whiteSpace: 'pre-wrap' }} variant="h5">{(assessmentResultMultiple.results[0]?.assessment as IAssessment)?.title}</Typography>
              <p style={{ whiteSpace: 'pre-wrap' }}>{(assessmentResultMultiple.results[0]?.assessment as IAssessment)?.description}</p>
              <br/>
              <Typography><b>Start:&#32;</b>{dateValueFormatter(new Date((currentAssessmentResult?.assessment as IAssessment)?.start_at as string))}</Typography>
              <Typography><b>End:&#32;</b>{dateValueFormatter(new Date((currentAssessmentResult?.assessment as IAssessment)?.ended_at as string))}</Typography>
              {!isNaN((currentAssessmentResult?.assessment as IAssessment)?.duration!) && (currentAssessmentResult?.assessment as IAssessment)?.duration! > 0 && <Typography><b>Max Duration:&#32;</b>{'' + (currentAssessmentResult?.assessment as IAssessment)?.duration} minutes</Typography>}
            </CardContent>
          </Card>
          <AssessmentTimer assessmentResult={currentAssessmentResult} />
          {!showSummary && <AssessmentNavigation assessmentResults={assessmentResultMultiple.results} currentEvaluateeId={currentEvaluateeId} handleSwitchPage={handleSwitchPage} isReviewMode={isReviewMode} />}
        </Box>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 2, rowGap: 2, maxWidth: 'min(100vw, 1200px)', paddingTop: 6 }}>
        <AssessmentTimer sx={{ display: drawerCollapse ? 'unset' : 'none', position: 'fixed', right: 30, top: 90, zIndex: 99 }} miniMode assessmentResult={currentAssessmentResult} />
        {<Card sx={{ p: 3 }}>
          <p style={{ textAlign: 'start' }}>You are answering this {(assessmentResultMultiple.results[0]?.assessment as IAssessment)?.typeLabel} as <b>{assessmentResultMultiple.results[0]?.evaluator?.label}</b>. If this is not you, please contact lecturer.</p>
          {!isNaN((currentAssessmentResult?.assessment as IAssessment)?.type as number) && !((currentAssessmentResult?.assessment as IAssessment)?.type === AssessmentType.SelfAssessment) && <FormControl sx={{ marginTop: 2 }} fullWidth>
            <InputLabel>Evaluatee</InputLabel>
            <Select sx={{
              '& .MuiInputBase-input': {
                whiteSpace: 'unset !important',
              }
            }} required label="Evaluatee" value={currentEvaluateeId} onChange={handleEvaluateeChange}>
              {evaluatees?.map((evaluatee) => (
                <MenuItem key={(evaluatee as Student)._id} value={(evaluatee as Student)._id}>{`${(evaluatee as Student)?.name} (${(evaluatee as Student)?.matricNumber ?? ((evaluatee as Group)?.project as Project)?.title})`}</MenuItem>
              ))}
            </Select>
          </FormControl>}
        </Card>}
        <Card sx={{ p: 3, textAlign: 'left', position: 'relative' }}>
          <Backdrop
            sx={(theme) => ({ color: '#fff', zIndex: theme.zIndex.drawer + 1, position: 'absolute' })}
            open={!drawerCollapse && smallScreen}
          >
          </Backdrop>
          {showSummary && <Box sx={{ textAlign: 'center' }}>
            <TableContainer component={Paper} sx={{ textAlign: 'left', marginBottom: 4 }}>
              <Table size="small" aria-label="attempt summary">
                <TableHead>
                </TableHead>
                <TableBody sx={{ 'th': { fontWeight: 'bold' } }}>
                  <AssessmentTableRow th={'Status'} td={currentAssessmentResult?.endedAt ? 'Submitted' : 'Not Submitted'} />
                  <AssessmentTableRow th={'Started'} td={currentAssessmentResult?.startedAt ? (new Date(currentAssessmentResult?.startedAt)).toLocaleString(enGBLocale, dateTimeOptions) : '-'} />
                  <AssessmentTableRow th={'Submitted'} td={currentAssessmentResult?.endedAt ? (new Date(currentAssessmentResult?.endedAt)).toLocaleString(enGBLocale, dateTimeOptions) : '-'} />
                  <AssessmentTableRow th={'Duration Taken'} td={currentAssessmentResult?.duration ?? '-'} />
                </TableBody>
              </Table>
            </TableContainer>
            {isReviewMode && <Button sx={{ marginBottom: 2 }} onClick={handleContinue} variant="contained" startIcon={<EditOutlined />}>Review Attempt</Button>}
            <AssessmentControlPanel />
            <AssessmentNavigation sx={{ marginTop: 4 }} assessmentResults={assessmentResultMultiple.results} currentEvaluateeId={currentEvaluateeId} handleSwitchPage={handleSwitchPage} isReviewMode={isReviewMode} />
          </Box>}
          {!showSummary && <form onSubmit={handleSubmit(onSubmit)}>
            <Box sx={{ display: 'flex', justifyContent: (isReviewMode || (currentAssessmentResult?.assessment as IAssessment)?.isBackNavigationAllowed) ? 'space-between' : 'flex-end' }}>
              {(isReviewMode || (currentAssessmentResult?.assessment as IAssessment)?.isBackNavigationAllowed) && <Button component="label" role={undefined} variant="outlined" tabIndex={-1} startIcon={<ChevronLeftIcon />}>Back
                <VisuallyHiddenInput type="submit" onClick={(_) => { backButtonPressed.current = true; }} />
              </Button>}
              <Button component="label" role={undefined} variant="contained" tabIndex={-1} endIcon={<ChevronRightIcon />}>Next
                <VisuallyHiddenInput type="submit" onClick={(_) => { backButtonPressed.current = false; }} />
              </Button>
            </Box>
            <FormProvider {...form}>
              {fields?.map((response, i) =>
                // <p>{JSON.stringify(response)}</p>
                <QuizItemField key={response._id} quizRewards={assessmentResultMultiple?.quiz?.rewards} response={response} fieldIndex={i} reviewMode={isReviewMode} isLecturerPage={isLecturerPage} />
              )}
            </FormProvider>
          </form>}
        </Card>
      </Box>
    </Box>
    </Box>
  </>;
};

export default AssessmentQuiz;
