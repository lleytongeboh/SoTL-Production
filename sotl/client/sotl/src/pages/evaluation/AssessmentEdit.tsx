import React, { ReactNode } from 'react';
import { Backdrop, Box, CircularProgress, Drawer, List, ListItem, ListItemText } from '@mui/material';
import { styled } from '@mui/material/styles';
import { GridRowsProp, GridColDef, GridRenderCellParams, GridRowSelectionModel, GridRowModel } from '@mui/x-data-grid';
import type { } from '@mui/x-data-grid/themeAugmentation';
import Button from '@mui/material/Button';
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
import NavigateBeforeOutlinedIcon from '@mui/icons-material/NavigateBeforeOutlined';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import { ArrowCircleUp, ArrowCircleDown } from '@mui/icons-material';
import InputLabel from '@mui/material/InputLabel';
import { ContentCopy } from '@mui/icons-material';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { useEffect, useState, useRef } from 'react';
import { AssessmentType, AssessmentTypeStr, IAssessment } from '../../models/Assessment';
import { IQuiz, IQuestion, QuestionType, MCQ, RewardType, QuestionItem, LikertScale } from '../../models/Quiz';
import Autocomplete, { AutocompleteInputChangeReason } from '@mui/material/Autocomplete';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CloseIcon from '@mui/icons-material/Close';
import ViewListIcon from '@mui/icons-material/ViewList';
import AnalyticsIcon from '@mui/icons-material/Analytics';

import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import { Link, replace, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import 'dayjs/locale/en-gb';
import dayjs, { Dayjs } from 'dayjs';
import { assessmentHooks } from '../../features/lecturer/assessment/hooks/assessmentHooks'
import Switch from '@mui/material/Switch';
import { quizHooks } from '../../features/lecturer/assessment/hooks/quizHooks'
import { debounce } from '@mui/material/utils';
import { AssessmentDataGrid, ExpandableCell, questionTypeValueGetter } from '../../components/AssessmentDataGrid';
import { PATHS } from '../../layouts/AdminLayout';
import {
  Controller,
  FormProvider,
  useForm,
  useFormContext,
  useWatch
} from "react-hook-form";
import type { SubmitHandler, DefaultValues, ValidateResult, FieldValue, RegisterOptions } from "react-hook-form";
import { Student } from '../../models/Student';
import RHFAutocomplete from '../../components/ReactHookForm/RHFAutocomplete';
import { Group } from '../../models/Group';
import { DataGridPropsWithoutDefaultValue } from '@mui/x-data-grid/internals';
import AddCircleOutlinedIcon from '@mui/icons-material/AddCircleOutlined';
import { ICategory } from '@models/Category';
import { ApiResponse } from '@models/index';
import { shuffleArray } from '../../utils/array';
import LoadingPopup, { LoadingPopupProps } from '../../components/LoadingPopup';
import SuccessPopup, { PopupProps } from '../../components/SuccessPopup';
import ErrorPopup from '../../components/ErrorPopup';
import { SuccessPopupProps } from '@components/ContentPanel';

const AddExcludeLabel: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <Typography sx={{ py: 1, fontWeight: 'bold' }}>{children}</Typography>
  );
};

const defaultValues: DefaultValues<IAssessment> = {
  type: '',
  quiz_assigned: null,
  items_assigned: [],
  batch: null,
  batch_assign_all: false,
  groups_assigned: [],
  students_assigned: [],
  groups_excluded: [],
  students_excluded: [],
  title: '',
  description: '',
  start_at: null,
  ended_at: null,
  duration: 60,
  public: true,
  shuffle: { questions: false, options: false },
  isBackNavigationAllowed: false,
  isPublicForReview: true,
  maxQuestionLimitPerPage: 1
};

const columns: GridColDef[] = [
  { field: 'title', valueGetter: (_, row) => row.title + ((row.type === QuestionType.LIKERT && Array.isArray(row.likert_statements)) ? ('\n- ' + (row.likert_statements as LikertScale['likert_statements']).map((statement) => statement.label).join('\n- ')) : ''), headerName: 'Question', minWidth: 150, flex: 1, renderCell: (params: GridRenderCellParams) => <ExpandableCell maxChar={150} params={params} />, },
  { field: 'type', headerName: 'Type', valueGetter: questionTypeValueGetter, width: 100 },
  { field: 'optionCount', headerName: 'No. of Options', width: 150 },
  { field: `rewards.${RewardType.POINT}`, valueGetter: (_, row) => row.rewards?.[RewardType.POINT] ?? '-', headerName: 'Point', type: 'number', width: 100 },
  { field: `rewards.${RewardType.SCORE}`, valueGetter: (_, row) => row.rewards?.[RewardType.SCORE] ?? '-', headerName: 'Score', type: 'number', width: 100 },
];

const getQuizOptionLabel = (o: IQuiz) => `Q${o.numId}. ${o.title} (${o.questionCount} questions)`;
const getBatchOptionLabel = (o: ICategory) => o.concatLabel!;
const getGroupOptionLabel = (o: Group) => `${o.name} (${o.team_members_count} students)`;
const getStudentOptionLabel = (o: Student) => `${o.matricNumber} ${o.name}`;

const validateAddedCategoryGroupStudent: RegisterOptions['validate'] = {
  validateRequired: (_: FieldValue<any>, formValues) => {
    const assessment = formValues as IAssessment;
    if (!assessment.batch_assign_all && assessment.groups_assigned.length === 0 && (assessment.type === AssessmentType.ClientEvaluation || assessment.students_assigned.length === 0)) {
      return assessment.type === AssessmentType.ClientEvaluation ? 'At least ONE group must be assigned/added.' : 'At least ONE group or student must be assigned/added.';
    }
    return true;
  },
}
const validateExcludedGroups: RegisterOptions['validate'] = {
  validateConflict: (v: FieldValue<Group[]>, formValues) => {
    const groups_assigned = (formValues as IAssessment).groups_assigned.map((s) => s._id);
    for (const group_excluded of v as Group[]) {
      if (groups_assigned.includes(group_excluded._id)) {
        return 'Cannot exclude group(s) explicitly added above.';
      }
    }
    return true;
  },
}
const validateExcludedStudents: RegisterOptions['validate'] = {
  validateNumber: (v: FieldValue<Student[]>, formValues) => {
    const students_assigned = (formValues as IAssessment).students_assigned.map((s) => s._id);
    for (const student_excluded of v as Student[]) {
      if (students_assigned.includes(student_excluded._id)) {
        return 'Cannot exclude student(s) explicitly added above.';
      }
    }
    return true;
  },
}

const FILTER_DEBOUNUCE_WAIT_DURATION = 800;
const FIELDSET_STYLE = { backgroundColor: 'white', borderColor: 'rgba(0, 0, 0, 0.23)', borderRadius: '4px', borderWidth: '1px', borderStyle: 'solid', p: 3 };

type AssessmentEditProps = {
  createMode?: boolean;
};

const AssessmentEdit: React.FC<AssessmentEditProps> = ({ createMode = false }) => {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const cloneFromId = searchParams.get('cloneFromId');
  const [isCreateMode, setIsCreateMode] = useState(createMode);

  const { getQuizList, getQuizQuestionList, error: q_error } = quizHooks();
  const { getAssessment, getBatchList, getGroupList, getStudentList, createAssessment, updateAssessment, error, setError } = assessmentHooks();

  const validateStartDateTime: RegisterOptions['validate'] = {
    validateStartDateTime: (v: FieldValue<any>, formValues) => {
      if (v && (formValues as IAssessment).ended_at) {
        if (v.isAfter((formValues as IAssessment).ended_at)) {
          return 'Start date time must be later than current date time.';
        }
      }
      return true;
    },
  }
  const validateEndDateTime: RegisterOptions['validate'] = {
    validateEndDateTime: (v: FieldValue<any>, formValues) => {
      if (v && (formValues as IAssessment).start_at) {
        if (v.isBefore((formValues as IAssessment).start_at)) {
          return 'End date time must be later than start date time.';
        }
      }
      return true;
    },
  }

  const onSubmit: SubmitHandler<IAssessment> = async (assessment) => {
    if (!assessment.quiz_assigned) {
      return;
    }
    if (!Array.isArray(assessment.items_assigned) || assessment.items_assigned.length === 0) {
      setError('Please select at least one quiz question to be included in this assessment.');
      setErrorPopup(true);
      return;
    }
    setLoading(true);
    try {
      assessment.batch = assessment.batch._id;
      assessment.groups_assigned = assessment.groups_assigned.map((g) => g._id);
      assessment.students_assigned = assessment.students_assigned.map((s) => s._id);
      assessment.groups_excluded = assessment.groups_excluded.map((g) => g._id);
      assessment.students_excluded = assessment.students_excluded.map((s) => s._id);
      assessment.maxQuestionLimitPerPage = assessment.maxQuestionLimitPerPage || 0;
      if([AssessmentType.PeerEvaluation, AssessmentType.ClientEvaluation].includes(assessment.type as number)) {
        delete assessment.duration;
      }
      let response: ApiResponse<any>;
      if (isCreateMode) {
        response = await createAssessment(assessment);
        navigate(`../${response.result._id}/edit`, { replace: true });
        setIsCreateMode(false);
        loadAssessment(response.result);
      } else {
        response = await updateAssessment(assessment);
      }
      setSuccessPopupProps({
        ...successPopupProps, open: true, content: <>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}><Button onClick={() => navigate(-1)} variant="contained" startIcon={<NavigateBeforeOutlinedIcon />}>Back</Button><Button onClick={() => setSuccessPopupProps({ ...successPopupProps, content: '', open: false })} variant="contained" startIcon={<CloseIcon />}>Close</Button></Box>
          <Typography sx={{ marginY: 2 }}>{response?.message ?? ''}</Typography>
          <Button component={Link} to={`../../${PATHS.ASSESSMENT_RESULT_MANAGE}?assessmentId=${response.result._id}`} variant="contained" startIcon={<AnalyticsIcon />}>View Results</Button>
        </>
      });
    } catch (err) {
      console.error('Error:', err);
      setErrorPopup(true);
      await loadQuizList();
      if(watchQuizAssigned) {
        const quizFound = initialQuizList.current.find((q) => q._id === watchQuizAssigned._id);
        if(quizFound) {
          setValue('quiz_assigned', quizFound);
        }
      }
    }
    setLoading(false);
  };


  const [assessmentNum, setAssessmentNum] = useState<number | undefined>(undefined);
  const [filteredQuizList, setFilteredQuizList] = useState<IQuiz[]>([]);
  const [batchList, setBatchList] = useState([]);
  const [groupList, setGroupList] = useState([]);
  const [studentList, setStudentList] = useState([]);
  const initialQuizList = useRef<IQuiz[]>([]);
  const initialBatchList = useRef([]);
  const initialGroupList = useRef([]);
  const initialStudentList = useRef([]);

  const loadAssessment = (assessment: IAssessment, quizzes: IQuiz[] = filteredQuizList) => {
    if (quizzes && assessment.quiz_assigned) {
      const quizFound = quizzes.find((quiz) => quiz._id === (assessment.quiz_assigned as IQuiz)._id);
      assessment.quiz_assigned = quizFound ?? null;
      setQuestionSelectionModel(assessment.items_assigned);
    }
    assessment.start_at = dayjs(assessment.start_at);
    assessment.ended_at = dayjs(assessment.ended_at);
    if (assessment.numId) {
      setAssessmentNum(assessment.numId);
    }
    reset(assessment);
  };

  const form = useForm<IAssessment>({
    defaultValues
  });
  const { control, formState: { errors }, handleSubmit, register, watch, getValues, setFocus, setValue, reset } = form;

  const quizAssignedId = useRef('');
  const watchAssessmentType = useWatch({ control, name: 'type' });
  const watchQuizAssigned = useWatch({ control, name: 'quiz_assigned' }) as IQuiz;
  const watchaAssignAllInBatch = useWatch({ control, name: 'batch_assign_all' });
  const watchBatch = useWatch({ control, name: 'batch' });

  const [loading, setLoading] = useState(true);
  const [successPopup, setSuccessPopup] = useState(false);
  const [errorPopup, setErrorPopup] = useState(false);
  const loadingPopupProps: LoadingPopupProps = {
    open: loading
  };

  const [successPopupProps, setSuccessPopupProps] = useState<PopupProps>({
    open: false,
    content: '',
    onClose: () => {
    }
  });

  const errorPopupProps: PopupProps = {
    open: errorPopup,
    content: error!,
    onClose: () => {
      setErrorPopup(false);
    }
  };
  const [totalRewards, setTotalRewards] = useState<IQuestion['rewards']>({ [RewardType.POINT]: 0, [RewardType.SCORE]: 0 });
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [randomSelectOptions, setRandomSelectOptions] = useState<string[]>([]);
  const [randomSelectCount, setRandomSelectCount] = useState('');
  const [rows, setRows] = useState<GridRowsProp<GridRowModel<IQuestion>>>([]);

  const [questionSelectionModel, setQuestionSelectionModel] = useState<GridRowSelectionModel>([]);
  const onQuestionSelectionModelChange: DataGridPropsWithoutDefaultValue['onRowSelectionModelChange'] = ((newQuestionSelectionModel) => {
    setValue('items_assigned', newQuestionSelectionModel);
    setQuestionSelectionModel(newQuestionSelectionModel);
  })

  useEffect(() => {
    let ignore = false;
    if (!watchQuizAssigned) {
      setRows([]);
      quizAssignedId.current = '';
      return;
    } else if (!watchQuizAssigned._id) {
      return;
    }
    setLoadingQuestions(true);
    getQuizQuestionList(watchQuizAssigned._id).then((quiz) => {
      if (ignore) {
        return;
      }
      if (quiz && quiz.length === 1) {
        setRows(quiz[0].items);
        const interval = quiz[0].items.length <= 55 ? 5 : 10;
        setRandomSelectOptions(Array.from({ length: Math.floor((quiz[0].items.length - 1) / interval) }, (_, i) => '' + ((i + 1) * interval)));
      }
      quizAssignedId.current = watchQuizAssigned._id as string;
      // onQuestionSelectionModelChange(quiz[0].items.map((item: IQuestion) => item._id), null as any); // SCRUM-140 select all questions by default
      setLoadingQuestions(false);
    }).catch(() => {
      console.error('Error:', error);
    });
    return () => {
      ignore = true;
    };
  }, [watchQuizAssigned]);

  const loadQuizList = async () => {
    try {
      let quizzes: IQuiz[] = await getQuizList();
      if (quizzes) {
        initialQuizList.current = quizzes;
        if(watchAssessmentType) {
          quizzes = quizzes.filter((q: IQuiz) => q?.type === watchAssessmentType);
        }
        setFilteredQuizList(quizzes);
      }
    } catch (err) {
      console.error('Error:', err);
    }
  }

  useEffect(() => {
    if (watchAssessmentType !== '' && watchAssessmentType !== AssessmentType.SelfAssessment) {
      setValue('shuffle.options', false);
      setValue('isBackNavigationAllowed', true);
    }
    setFilteredQuizList(initialQuizList.current.filter((q: IQuiz) => q?.type === watchAssessmentType));
    const currentQuizAssigned = getValues('quiz_assigned');
    if (currentQuizAssigned !== null && (currentQuizAssigned as IQuiz).type !== watchAssessmentType) {
      setValue('quiz_assigned', null);
    }
  }, [watchAssessmentType]);

  useEffect(() => {
    if (!Array.isArray(questionSelectionModel) || !Array.isArray(rows)) {
      return;
    }
    const newTotalRewards = { [RewardType.POINT]: 0, [RewardType.SCORE]: 0 };
    for (const row of rows) {
      if (row._id && row.rewards && questionSelectionModel.includes(row._id)) {
        let multiplier = 1;
        if (row.type === QuestionType.LIKERT && Array.isArray(row.likert_statements)) {
          multiplier = row.likert_statements.length;
        }
        if (row.rewards[RewardType.POINT]) {
          newTotalRewards[RewardType.POINT] += row.rewards[RewardType.POINT] * multiplier;
        }
        if (row.rewards[RewardType.SCORE]) {
          newTotalRewards[RewardType.SCORE] += row.rewards[RewardType.SCORE] * multiplier;
        }
      }
    }
    setTotalRewards(newTotalRewards);
  }, [questionSelectionModel, rows]);
  const randomSelectQuestions = () => {
    const randomSelectCountNumber = parseInt(randomSelectCount);
    if (isNaN(randomSelectCountNumber) || randomSelectCountNumber === 0 || rows.length === 0 || questionSelectionModel.length >= rows.length) {
      return;
    }
    setRandomSelectCount('');
    const unselectedQuestions = rows
      .filter((question) => !questionSelectionModel.includes(question._id!))
      .map((question) => question._id)
      .filter((id): id is NonNullable<typeof id> => id !== undefined);
    if (randomSelectCountNumber >= unselectedQuestions.length) {
      setQuestionSelectionModel(questionSelectionModel.concat(unselectedQuestions));
      return;
    }
    shuffleArray(unselectedQuestions);
    setQuestionSelectionModel(questionSelectionModel.concat(unselectedQuestions.slice(0, randomSelectCountNumber)));
  }

  useEffect(() => {
    const quizFetcher: Promise<IQuiz[]> = getQuizList().then((quizzes) => {
      if (quizzes) {
        initialQuizList.current = quizzes;
        setFilteredQuizList(quizzes);
      }
      return quizzes;
    }).catch((err) => {
      console.error('Error:', err);
      setErrorPopup(true);
    }).finally(() => {
      if (isCreateMode) {
        setLoading(false);
      }
    });
    getBatchList().then((categories) => {
      if (categories) {
        initialBatchList.current = categories;
        setBatchList(categories);
      }
    }).catch((err) => {
      console.error('Error:', err);
      setErrorPopup(true);
    });
    if ((isCreateMode && cloneFromId) || (!isCreateMode && assessmentId)) {
      getAssessment((isCreateMode && cloneFromId) ? cloneFromId : assessmentId!, isCreateMode && !!cloneFromId).then((assessment: IAssessment) => {
        quizFetcher.then((quizList) => {
          loadAssessment(assessment, quizList);
        });
      }).catch((err) => {
        console.error(err);
        setErrorPopup(true);
      }).finally(() => setLoading(false));
    }
  }, []);

  const filterGroupsByBatch = (g: Group) => g.batch == watchBatch.name;
  const filterStudentsByBatch = (s: Student) => {
    if (Array.isArray(s.batch)) {
      for (const batch of s.batch) {
        if (batch.batch == watchBatch.name) {
          return true;
        }
      }
    }
    return false;
  };

  useEffect(() => {
    if (!watchBatch) {
      return;
    }
    getGroupList(watchBatch.name).then((groups) => {
      if (groups) {
        initialGroupList.current = groups;
        setGroupList(groups);
      }
    }).catch((err) => {
      console.error('Error:', err);
      setErrorPopup(true);
    });
    getStudentList(watchBatch.name).then((students) => {
      if (students) {
        initialStudentList.current = students;
        setStudentList(students);
      }
    }).catch((err) => {
      console.error('Error:', err);
      setErrorPopup(true);
    });
    setValue('groups_assigned', getValues('groups_assigned').filter(filterGroupsByBatch));
    setValue('groups_excluded', getValues('groups_excluded').filter(filterGroupsByBatch));
    setValue('students_assigned', getValues('students_assigned').filter(filterStudentsByBatch));
    setValue('students_excluded', getValues('students_excluded').filter(filterStudentsByBatch));
  }, [watchBatch]);

  const filterBatchListDebounce = React.useMemo(
    () => debounce(
      (inputValue: string | null) => {
        if (!inputValue || inputValue.trim() === '') {
          setBatchList(initialBatchList.current);
          return;
        }
        getBatchList(inputValue).then((categoryList) => {
          if (categoryList) {
            setBatchList(categoryList);
          }
        });
      },
      FILTER_DEBOUNUCE_WAIT_DURATION,
    ),
    [],
  );

  const filterBatchList = (inputValue: string | null) => {
    if (!inputValue) {
      setBatchList(initialBatchList.current);
      return;
    }
    filterBatchListDebounce(inputValue);
  };

  const filterGroupList = React.useMemo(
    () => debounce(
      (inputValue: string | null, batchName = watchBatch?.name) => {
        if (!inputValue || inputValue.trim() === '' || !batchName) {
          setGroupList(initialGroupList.current.slice());
          return;
        }
        getGroupList(batchName, inputValue).then((groups) => {
          if (groups) {
            setGroupList(groups);
          }
        });
      },
      FILTER_DEBOUNUCE_WAIT_DURATION,
    ),
    [watchBatch],
  );

  const filterStudentList = React.useMemo(
    () => debounce(
      (inputValue: string | null, batchName = watchBatch?.name) => {
        if (!inputValue || inputValue.trim() === '' || !batchName) {
          setStudentList(initialStudentList.current.slice());
          return;
        }
        getStudentList(batchName, inputValue).then((students) => {
          if (students) {
            setStudentList(students);
          }
        });
      },
      FILTER_DEBOUNUCE_WAIT_DURATION,
    ),
    [watchBatch],
  );

  return <div>
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
    <Backdrop sx={(theme) => ({ color: '#fff', zIndex: theme.zIndex.drawer + 1 })} open={false}><CircularProgress color="inherit" /></Backdrop>
    <FormProvider {...form}>
      <Box component="form" sx={{ '& > :not(style)': { m: 1 } }} onSubmit={handleSubmit(onSubmit)}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography sx={{ display: 'inline-block' }} variant="h4" gutterBottom><AddBoxOutlinedIcon /> <strong>{isCreateMode ? 'Create' : 'Edit'} Assessment {assessmentNum && `A${assessmentNum}`}</strong></Typography>
          <Button onClick={() => navigate(-1)} variant="contained" startIcon={<NavigateBeforeOutlinedIcon />}>Back</Button>
        </Box>

        <Controller name='title' control={control} rules={{ required: true, minLength: 3 }} render={({ field }) => <TextField sx={{ backgroundColor: 'white' }} error={errors?.title ? true : false} helperText={errors?.title ? 'Field must have at least 3 characters.' : false} multiline required fullWidth label="Assessment Name" variant="outlined" {...field} />} />
        <Controller name='description' control={control} render={({ field }) => <TextField sx={{ backgroundColor: 'white' }} multiline fullWidth label="Assessment Description" variant="outlined" {...field} />} />
        <FormControl sx={{ backgroundColor: 'white' }} fullWidth>
          <InputLabel>Assessment Type *</InputLabel>
          <Controller name='type' control={control} render={({ field }) => (
            <Select disabled={!isCreateMode} required label="Assessment Type *" {...field}>
              <MenuItem value={AssessmentType.SelfAssessment}>{AssessmentTypeStr[AssessmentType.SelfAssessment]}</MenuItem>
              <MenuItem value={AssessmentType.PeerEvaluation}>{AssessmentTypeStr[AssessmentType.PeerEvaluation]}</MenuItem>
              <MenuItem value={AssessmentType.ClientEvaluation}>{AssessmentTypeStr[AssessmentType.ClientEvaluation]}</MenuItem>
            </Select>
          )} />
        </FormControl>
        {watchAssessmentType === AssessmentType.PeerEvaluation && <Typography sx={{ textAlign: 'justify' }}>For Peer Evaluation, each student will be required to answer questions for every member in their respective group, excluding himself/herself.</Typography>}
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
          <Box component='fieldset' sx={{ ...FIELDSET_STYLE, display: 'flex', columnGap: 10, rowGap: 3, justifyContent: 'space-around', flexWrap: 'wrap' }}>
            <legend><b>TIME AND DURATION</b></legend>
            <Controller name='start_at' control={control} rules={{ required: true, validate: validateStartDateTime }} render={({ field }) => <DateTimePicker slotProps={{ textField: { required: true, error: errors?.start_at ? true : false, helperText: errors?.start_at?.message } }} minDateTime={dayjs()} sx={{ flexGrow: 1 }} label="Assessment Start Time" ampm {...field} />} />
            <Controller name='ended_at' control={control} rules={{ required: true, validate: validateEndDateTime }} render={({ field }) => <DateTimePicker slotProps={{ textField: { required: true, error: errors?.ended_at ? true : false, helperText: errors?.ended_at?.message } }} minDateTime={dayjs()} sx={{ flexGrow: 1 }} label="Assessment End Time" ampm {...field} />} />
            {watchAssessmentType === AssessmentType.SelfAssessment && <Controller name='duration' control={control} rules={{ pattern: /^[0-9]*$/ }} render={({ field }) => <TextField error={errors?.duration ? true : false} helperText={errors?.duration ? 'Duration must be less than total duration from start to end time of assessment.' : false} type='number' label='Max Duration (minutes)' variant="outlined" {...field} />} />}
          </Box>
        </LocalizationProvider>
        <Box component='fieldset' sx={FIELDSET_STYLE}>
          <legend><b>ASSESSMENT QUIZ</b></legend>
          <RHFAutocomplete fieldName='quiz_assigned' disabled={!isCreateMode || watchAssessmentType === ''} multiple={false} disableCloseOnSelect={false} options={filteredQuizList} getOptionLabel={getQuizOptionLabel} textFieldLabel='Quiz' textFieldRequired />
          <br />
          <Typography sx={{ textAlign: 'left', mb: 1 }}><b>Select questions to be asked in this assessment:</b></Typography>
          <div style={{ display: 'flex', flexDirection: 'column', height: '80vh' }}>
            <AssessmentDataGrid loading={loadingQuestions} rows={rows} columns={columns} checkboxSelection disableRowSelectionOnClick rowSelectionModel={questionSelectionModel} onRowSelectionModelChange={onQuestionSelectionModelChange}
              slotProps={{
                loadingOverlay: {
                  variant: 'skeleton',
                  noRowsVariant: 'skeleton'
                }
              }}
              initialState={{
                pagination: {
                  paginationModel: {
                    pageSize: 10,
                  },
                },
              }}
              localeText={{
                footerRowSelected: (count) => `${count} ${count === 1 ? 'question' : 'questions'} selected for this assessment`,
              }}
            />
          </div>
          <Box sx={{ ...FIELDSET_STYLE, display: 'inline-flex', alignItems: 'center', mt: 3, mb: 1, p: 2 }}>
            <Typography component='pre' sx={{ display: 'inline-block' }}>Select&#9;</Typography>
            <Autocomplete sx={{ display: 'inline-block', minWidth: 100 }} size='small' freeSolo options={randomSelectOptions} inputValue={randomSelectCount} onInputChange={(_, v) => setRandomSelectCount(v)} renderInput={(params) => <TextField type='number' {...params} inputProps={{ ...params.inputProps, min: 0 }} />} />
            <Typography component='pre' sx={{ display: 'inline-block' }}>&#9;more questions randomly:&#9;</Typography>
            <Button onClick={randomSelectQuestions} variant="contained" startIcon={<AddCircleOutlinedIcon />}>Confirm Add</Button>
          </Box>
          <br />
          <Box sx={{ textAlign: 'start' }}>
            <Box>
              <Typography><b>Rewards for questions selected:</b></Typography>
              <Typography>Total points: {watchQuizAssigned?.rewards?.[RewardType.POINT] ? totalRewards![RewardType.POINT] : 'Not enabled for the quiz selected'}</Typography>
              <Typography>Total score: {watchQuizAssigned?.rewards?.[RewardType.SCORE] ? totalRewards![RewardType.SCORE] : 'Not enabled for the quiz selected'}</Typography>
            </Box>
            <Box sx={{ userSelect: 'none' }}>
              <Typography component="span" sx={{ mr: 2 }}><b>For every respondent:</b></Typography>
              <Controller name='shuffle.questions' control={control} render={({ field: { value, ...field } }) => <FormControlLabel control={<Checkbox checked={value} {...field} />} label="Shuffle Questions" />} />
              <Controller name='shuffle.options' control={control} render={({ field: { value, ...field } }) => <FormControlLabel control={<Checkbox disabled={watchAssessmentType !== AssessmentType.SelfAssessment} checked={value} {...field} />} label="Shuffle Options" />} />
            </Box>
            <Box>
              <Typography component="span"><b>Page settings:</b></Typography>
              <br />
              <Controller name='isBackNavigationAllowed' control={control} render={({ field: { value, ...field } }) => <FormControlLabel sx={{ userSelect: 'none' }} control={<Checkbox checked={value} {...field} />} label="Allow Back Navigation" />} />
              <br />
              <Box sx={{ display: 'flex', alignItems: 'center', columnGap: 2 }}>
                <Typography component='pre' sx={{ display: 'inline-block' }}>Limit max number of questions per page:</Typography>
                <Controller name='maxQuestionLimitPerPage' control={control} rules={{ pattern: /^[0-9]*$/ }} render={({ field: { value, onChange, ...field } }) => <Autocomplete sx={{ display: 'inline-block', minWidth: 100 }} size='small' freeSolo options={[1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50]} getOptionLabel={(o) => '' + o} inputValue={value ? ('' + value) : ''} onInputChange={(e, v) => { (e.target as HTMLInputElement).value = v; onChange(e); }} {...field} renderInput={({ inputProps, ...params }) => <TextField type='number' inputProps={{ ...inputProps, min: 0 }} error={errors?.maxQuestionLimitPerPage ? true : undefined} helperText={errors?.maxQuestionLimitPerPage ? 'Max number of questions must be a valid positive number.' : undefined} {...params} />} />} />
              </Box>
            </Box>
            <Box sx={{ userSelect: 'none' }}>
              <Typography component="span" sx={{ mr: 2 }}><b>Enable review:</b></Typography>
              <Controller name='isPublicForReview' control={control} render={({ field: { value, ...field } }) => <FormControlLabel control={<Checkbox checked={value} {...field} />} label="After Assessment Submission/End" />} />
            </Box>
          </Box>
        </Box>
        <Box component='fieldset' sx={{ backgroundColor: 'white', borderColor: 'rgba(0, 0, 0, 0.23)', borderRadius: '4px', borderWidth: '1px', borderStyle: 'solid', p: 3 }}>
          <legend><b>ASSIGN TO</b></legend>
          <Typography component='span'><b>Select Batch:</b></Typography>
          <RHFAutocomplete sx={{ mt: 1, mx: 'auto', maxWidth: 400 }} fieldName='batch' multiple={false} disableCloseOnSelect={false} options={batchList} filterOptions={filterBatchList} getOptionLabel={getBatchOptionLabel} textFieldLabel='Batch' textFieldRequired />
          <Typography sx={{ pt: 1, pb: 2 }}>Assessment can only be assigned to groups/students in the batch selected.</Typography>
          <Controller name='batch_assign_all' control={control} render={({ field: { value, ...field } }) => <FormControlLabel sx={{ userSelect: 'none' }} control={<Checkbox checked={value} {...field} />} label="Add All Groups/Students in Batch selected." />} />
          <RHFAutocomplete disabled={!watchBatch || watchaAssignAllInBatch} fieldName='groups_assigned' options={groupList} filterOptions={filterGroupList} getOptionLabel={getGroupOptionLabel} textFieldLabel='Students in Groups' validateRules={validateAddedCategoryGroupStudent} />
          <AddExcludeLabel>Add (+):</AddExcludeLabel>
          <RHFAutocomplete disabled={!watchBatch || watchaAssignAllInBatch || watchAssessmentType === AssessmentType.ClientEvaluation} fieldName='students_assigned' options={studentList} filterOptions={filterStudentList} getOptionLabel={getStudentOptionLabel} textFieldLabel='Individual Students' validateRules={watchAssessmentType !== AssessmentType.ClientEvaluation ? validateAddedCategoryGroupStudent : undefined} />
          <AddExcludeLabel>Exclude (-):</AddExcludeLabel>
          <RHFAutocomplete disabled={!watchBatch} fieldName='groups_excluded' options={groupList} filterOptions={filterGroupList} getOptionLabel={getGroupOptionLabel} textFieldLabel='Ineligible Groups' validateRules={validateExcludedGroups} />
          <AddExcludeLabel>Exclude (-):</AddExcludeLabel>
          <RHFAutocomplete disabled={!watchBatch || watchAssessmentType === AssessmentType.ClientEvaluation} fieldName='students_excluded' options={studentList} filterOptions={filterStudentList} getOptionLabel={getStudentOptionLabel} textFieldLabel='Ineligible Students' validateRules={validateExcludedStudents} />
        </Box>
        <Controller name='public' control={control} render={({ field: { value, ...field } }) => <FormControlLabel sx={{ userSelect: 'none' }} control={<Switch checked={value} {...field} />} label="Public" />} />
        <br />
        <Button variant="contained" type="submit">{isCreateMode ? 'Create' : 'Save'}</Button>
      </Box>
    </FormProvider>
  </div>;
};

export default AssessmentEdit;
