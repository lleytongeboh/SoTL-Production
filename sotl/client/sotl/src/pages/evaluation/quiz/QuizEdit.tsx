import React from 'react';
import { Box, Drawer, List, ListItem, ListItemText, Radio, RadioGroup, Switch } from '@mui/material';
import { styled } from '@mui/material/styles';
import type { } from '@mui/x-data-grid/themeAugmentation';
import Button from '@mui/material/Button';
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
import NavigateBeforeOutlinedIcon from '@mui/icons-material/NavigateBeforeOutlined';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import { ArrowCircleUp, ArrowCircleDown } from '@mui/icons-material';
import InputLabel from '@mui/material/InputLabel';
import { ContentCopy } from '@mui/icons-material';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { useEffect, useState, useRef } from 'react';
import { produce, setAutoFreeze } from 'immer';

import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import Checkbox from '@mui/material/Checkbox';
import { IQuiz, IQuestion, QuestionType, MCQ, RewardType, QuestionItem, Question, LikertScale, QuizItem } from '../../../models/Quiz';
import { FieldPath, useFormState } from 'react-hook-form';
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import InputAdornment from '@mui/material';
import {
  Controller,
  FormProvider,
  useFieldArray,
  useForm,
  useFormContext,
  useWatch
} from "react-hook-form";
import type { SubmitHandler, DefaultValues, UseFieldArrayRemove, Control, FieldError } from "react-hook-form";
import { quizHooks } from '../../../features/lecturer/assessment/hooks/quizHooks';
import { ApiResponse } from '@models/index';
import LoadingPopup, { LoadingPopupProps } from '../../../components/LoadingPopup';
import SuccessPopup, { PopupProps } from '../../../components/SuccessPopup';
import ErrorPopup from '../../../components/ErrorPopup';
import { AssessmentType } from '../../../models/Assessment';
import { WritableDraft } from 'immer';
import { debounce } from '@mui/material/utils';

const likertPlaceholders = ['Quality of the System / Kualiti Sistem', 'Creativity and Innovation of the Solutions (System) / Kreativiti dan Inovasi Penyelesaian (Sistem)'];
const OptionField: React.FC<{ quizItemIndex: number, optionIndex: number, name: FieldPath<IQuiz>, control: Control<IQuiz, any>, error?: FieldError, watchQuestionType: QuestionType, markCorrectAns: Function, removeOption: UseFieldArrayRemove }> = ({ quizItemIndex, optionIndex, name, control, error, watchQuestionType, markCorrectAns, removeOption }) => {
  return (<Box sx={{ display: 'flex' }}>
    {watchQuestionType === QuestionType.MCQ && <Controller name={`items.${quizItemIndex}.options.${optionIndex}.correctAnswer`} control={control} render={({ field }) => <Checkbox checked={field.value} onClick={async (e) => { markCorrectAns(optionIndex, (e.target as HTMLInputElement).checked); if (!(e.target as HTMLInputElement).checked) { e.preventDefault(); } }} {...field} />} />}
    <Controller name={name} control={control} rules={{}} render={({ field }) => <TextField size="small" error={error ? true : undefined} helperText={error ? 'Field cannot be empty.' : undefined} required={watchQuestionType === QuestionType.MCQ} fullWidth multiline={watchQuestionType === QuestionType.MCQ || watchQuestionType === QuestionType.OEQ} label={watchQuestionType === QuestionType.OEQ ? 'Answer' : ((watchQuestionType === QuestionType.MCQ ? 'Option ' : 'Statement ') + (optionIndex + 1))} variant="outlined" {...field}
      placeholder={(watchQuestionType === QuestionType.LIKERT && optionIndex <= 1) ? likertPlaceholders[optionIndex] : undefined}
      InputLabelProps={(watchQuestionType === QuestionType.LIKERT && optionIndex <= 1) ? { shrink: true } : undefined} />} />
    {watchQuestionType === QuestionType.MCQ && <IconButton onClick={() => removeOption(optionIndex)} aria-label="delete"><DeleteIcon /></IconButton>}
  </Box>);
}

interface QuestionFieldProps {
  quizItemId?: string;
  watchQuizType: IQuiz['type']
  disableAddDelete: boolean;
  watchEvalRewardType: any;
  fieldIndex: number;
  fieldsLength: number;
  itemsUsedInAssessment?: any;
  moveQuestion: Function;
  dupQuestion: any;
  delQuestion: UseFieldArrayRemove;
  calculateRewardsDebounce: Function;
}

const errorBorderStyle = { borderColor: 'red', borderWidth: 1 };

const LikertScaleRow: React.FC<{ fieldIndex: number }> = ({ fieldIndex }) => {
  const { control, clearErrors } = useFormContext<IQuiz>();
  const { errors } = useFormState<IQuiz>({ name: `items.${fieldIndex}` });
  const { fields: likertOptions, append: addLikertOption, remove: removeLikertOption } = useFieldArray<IQuiz>({
    name: `items.${fieldIndex}.options`
  });
  const placeholders = ['Poor', 'Fair', 'Good'];

  return (<RadioGroup row>
    {likertOptions.map((option, i) => {
      return (
        <FormControlLabel key={option.id} disabled control={<Radio />} labelPlacement='top' label={<Controller name={`items.${fieldIndex}.options.${i}.label`} control={control} render={({ field }) => <TextField sx={{ flexBasis: '100px' }} required multiline size='small' label={`Option ${i + 1}`} placeholder={i <= 2 ? placeholders[i] : undefined} variant="outlined" {...field}
          InputLabelProps={i <= 2 ? { shrink: true } : undefined}
          InputProps={{
            endAdornment: <IconButton
              aria-label="delete option"
              onClick={() => removeLikertOption(i)}
              onMouseDown={(e) => e.preventDefault()}
              edge="end"
              size='small'
            >
              <DeleteIcon fontSize='small' />
            </IconButton>
          }}
        />} />} />);
    })}
    {likertOptions.length < 10 && <FormControlLabel disabled control={<Radio />} labelPlacement='top' label={<Button variant="contained" startIcon={<AddBoxOutlinedIcon />} onClick={() => { addLikertOption({ label: '' }); if (errors?.items?.[fieldIndex]?.options) { clearErrors(`items.${fieldIndex}.options`); } }}>Add Option</Button>} />}
  </RadioGroup>);
}

const QuestionField: React.FC<QuestionFieldProps> = ({ quizItemId, watchQuizType, disableAddDelete, watchEvalRewardType, fieldIndex, fieldsLength, itemsUsedInAssessment, moveQuestion, dupQuestion, delQuestion, calculateRewardsDebounce }) => {
  const { control, clearErrors, setValue } = useFormContext<IQuiz>();
  const { errors } = useFormState<IQuiz>({ name: `items.${fieldIndex}` });
  const {
    fields: children,
    append: appendChild,
    remove: removeChild
  } = useFieldArray<IQuiz>({
    control,
    name: `items.${fieldIndex}.options`
  });
  const {
    fields: likert_statements,
    remove: removeLikertStatement
  } = useFieldArray<IQuiz>({
    control,
    name: `items.${fieldIndex}.likert_statements`
  });

  const watchQuestionType = useWatch({ control, name: `items.${fieldIndex}.type` });

  const markCorrectAns = (answerItemIndex: number, checked: boolean) => {
    if (!checked) {
      return;
    } else if (errors?.items?.[fieldIndex]?.options) {
      clearErrors(`items.${fieldIndex}.options`);
    }
    for (let i = 0; i < children.length; i++) {
      if (i != answerItemIndex) {
        setValue(`items.${fieldIndex}.options.${i}.correctAnswer`, false);
      }
    }
  };

  return (
    <Box sx={{ p: 1.5, ...(errors?.items?.[fieldIndex]?.options ? errorBorderStyle : {}) }}>
      <Box sx={{ display: 'flex', alignItems: 'center', columnGap: 3, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: '81.97px' }}>
          <Box sx={{ display: 'inline-block' }}>
            <IconButton color={fieldIndex === 0 ? 'default' : 'primary'} disabled={fieldIndex === 0} onClick={(e) => moveQuestion(e, true, fieldIndex)}><ArrowCircleUp /></IconButton>
            <IconButton color={fieldIndex + 1 === fieldsLength ? 'default' : 'primary'} disabled={fieldIndex + 1 === fieldsLength} onClick={(e) => moveQuestion(e, false, fieldIndex)}><ArrowCircleDown /></IconButton>
          </Box>
          <Typography sx={{ display: 'inline-block' }} variant="h4" gutterBottom>{fieldIndex + 1}</Typography>
        </Box>
        <Controller name={`items.${fieldIndex}.title`} control={control} rules={watchQuestionType !== QuestionType.LIKERT ? { required: true, minLength: 3 } : undefined} render={({ field }) => <TextField error={errors?.items?.[fieldIndex]?.title ? true : false} helperText={errors?.items?.[fieldIndex]?.title ? 'Field must have at least 3 characters.' : false} multiline required={watchQuestionType !== QuestionType.LIKERT} fullWidth label="Question Text" variant="outlined" {...field} />} />

        <FormControl sx={{ flexBasis: 350 }}>
          <InputLabel>Question Type</InputLabel>
          <Controller name={`items.${fieldIndex}.type`} control={control} render={({ field }) => (
            <Select disabled={!!quizItemId} label="Question Type"{...field}>
              {watchQuizType == AssessmentType.SelfAssessment && <MenuItem value={QuestionType.MCQ}>Multiple Choice Question</MenuItem>}
              {(watchQuizType == AssessmentType.PeerEvaluation || watchQuizType == AssessmentType.ClientEvaluation) && <MenuItem value={QuestionType.LIKERT}>Likert Scale</MenuItem>}
              {(watchQuizType == AssessmentType.PeerEvaluation || watchQuizType == AssessmentType.ClientEvaluation) && <MenuItem value={QuestionType.OEQ}>Open-Ended Question</MenuItem>}
            </Select>
          )} />
        </FormControl>
      </Box>
      <FormGroup sx={{ rowGap: 1 }}>
        {watchQuestionType === QuestionType.LIKERT && <LikertScaleRow fieldIndex={fieldIndex} />}
        {watchQuestionType !== QuestionType.LIKERT && children.map((child, i) => {
          if (watchQuestionType === QuestionType.OEQ && i >= 1) {
            return;
          }
          return <OptionField key={child.id} quizItemIndex={fieldIndex} optionIndex={i} name={`items.${fieldIndex}.options.${i}.label`} control={control} error={errors?.items?.[fieldIndex]?.options?.[i]?.label} watchQuestionType={watchQuestionType} markCorrectAns={markCorrectAns} removeOption={removeChild} />;
        })}
        <FormHelperText error={errors?.items?.[fieldIndex]?.options ? true : undefined}>{errors?.items?.[fieldIndex]?.options ? errors?.items?.[fieldIndex]?.options?.message : undefined}</FormHelperText>
        {watchQuestionType === QuestionType.LIKERT && likert_statements.map((statement, i) => {
          return <OptionField key={statement.id} quizItemIndex={fieldIndex} optionIndex={i} name={`items.${fieldIndex}.likert_statements.${i}.label`} control={control} error={(errors?.items?.[fieldIndex] as unknown as LikertScale)?.likert_statements?.[i]?.label as unknown as FieldError} watchQuestionType={watchQuestionType} markCorrectAns={markCorrectAns} removeOption={removeLikertStatement} />;
        })}
      </FormGroup>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2 }}>
        <Controller name={`items.${fieldIndex}.required`} control={control} render={({ field: { value, ...field } }) => <FormControlLabel sx={{ userSelect: 'none' }} control={<Switch checked={value} {...field} />} label="Required" />} />
        {watchQuestionType === QuestionType.OEQ && <Controller name={`items.${fieldIndex}.multiline`} control={control} render={({ field: { value, ...field } }) => <FormControlLabel sx={{ userSelect: 'none' }} control={<Switch checked={value} {...field} />} label="Multiline" />} />}
        {watchQuestionType !== QuestionType.LIKERT && <Button variant="contained" startIcon={<AddBoxOutlinedIcon />} onClick={() => appendChild({ correctAnswer: false, label: '' } as QuestionItem, { shouldFocus: true, focusName: `items.${fieldIndex}.options.${children.length}.label` })}>Add {watchQuestionType === QuestionType.MCQ ? 'Option' : (watchQuestionType === QuestionType.OEQ ? 'Answer' : 'Statement')}</Button>}
        {watchQuestionType !== QuestionType.OEQ && <Box sx={{ display: 'inline-flex', columnGap: 3, flexBasis: '250px', justifyContent: 'center' }} >
          {watchEvalRewardType[RewardType.POINT] && <Controller name={`items.${fieldIndex}.rewards.${RewardType.POINT}`} control={control} rules={{ pattern: /^[0-9]*(?:\.[0-9]*)?$/ }} render={({ field: { onChange, ...field } }) => <TextField sx={{ flexBasis: '100px' }} error={errors?.items?.[fieldIndex]?.rewards?.[RewardType.POINT] ? true : false} helperText={errors?.items?.[fieldIndex]?.rewards?.[RewardType.POINT] ? 'Point must be a valid positive number.' : false} size='small' type='number' inputProps={{ min: 0 }} inputMode='numeric' label='Point' variant="outlined" {...field} onChange={(...e) => { onChange(...e); calculateRewardsDebounce(); }} />} />}
          {watchEvalRewardType[RewardType.SCORE] && <Controller name={`items.${fieldIndex}.rewards.${RewardType.SCORE}`} control={control} rules={{ pattern: /^[0-9]*(?:\.[0-9]*)?$/ }} render={({ field: { onChange, ...field } }) => <TextField sx={{ flexBasis: '100px' }} error={errors?.items?.[fieldIndex]?.rewards?.[RewardType.SCORE] ? true : false} helperText={errors?.items?.[fieldIndex]?.rewards?.[RewardType.SCORE] ? 'Score must be a valid positive number.' : false} size='small' type='number' inputProps={{ min: 0 }} inputMode='numeric' label='Score' variant="outlined"  {...field} onChange={(...e) => { onChange(...e); calculateRewardsDebounce(); }} />} />}
        </Box>}
        <Box sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', columnGap: 3 }}>
          <Button variant="contained" endIcon={<ContentCopy />} onClick={dupQuestion}>Duplicate</Button>
          <Button variant="contained" endIcon={<DeleteIcon />} color="error" disabled={disableAddDelete} onClick={() => { delQuestion(fieldIndex); calculateRewardsDebounce(); }}>Delete</Button>
        </Box>
      </Box>
    </Box>
  );
};

// generate new question
const genQuestion = (questionType: QuizItem['type']) => {
  const newQuestion: Question = ({ type: questionType, title: '', options: [{ correctAnswer: false, label: '' }, { correctAnswer: false, label: '' }], rewards: { [RewardType.POINT]: '', [RewardType.SCORE]: '' }, required: true, multiline: false, isQuestion: true });
  (newQuestion as unknown as LikertScale).likert_statements = [{ label: '' }];
  return newQuestion;
}

const defaultValues: DefaultValues<IQuiz> = {
  type: '',
  title: '',
  description: '',
  items: [],
  rewards: { [RewardType.POINT]: false, [RewardType.SCORE]: false }
};

type QuizEditProps = {
  createMode?: boolean;
};

const QuizEdit: React.FC<QuizEditProps> = ({ createMode = false }) => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const cloneFromId = searchParams.get('cloneFromId');
  const form = useForm<IQuiz>({
    defaultValues
  });
  const { control, handleSubmit, getValues, clearErrors, setError, setFocus, setValue, reset } = form;
  const { fields, append: appendField, insert: insertField, swap: swapField, remove: removeField } = useFieldArray({
    control,
    name: "items"
  });

  const [loading, setLoading] = useState(true);
  const [isCreateMode, setIsCreateMode] = useState(createMode);
  const [quizNum, setQuizNum] = useState<number | undefined>(undefined);
  const [successPopup, setSuccessPopup] = useState(false);
  const [errorPopup, setErrorPopup] = useState(false);
  const [itemsUsedInAssessment, setItemsUsedInAssessment] = useState();
  const { getQuiz, createQuiz, updateQuiz, error: error, setError: setQuizError } = quizHooks();

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

  const loadQuiz = (quiz?: IQuiz) => {
    if (!quiz) {
      setErrorPopup(true);
      return;
    }
    if (quiz.numId) {
      setQuizNum(quiz.numId);
    }
    setItemsUsedInAssessment(quiz.itemsUsedInAssessment);
    reset(quiz);
  }

  useEffect(() => {
    if (isCreateMode && !cloneFromId) {
      setLoading(false);
    } else {
      if (!quizId && !cloneFromId) {
        setErrorPopup(true);
        return;
      }
      const quizFetcher: Promise<IQuiz> = getQuiz((isCreateMode && cloneFromId) ? cloneFromId : quizId!, isCreateMode && !!cloneFromId);
      quizFetcher.then((quiz) => {
        loadQuiz(quiz);
      }).catch((err) => {
        console.error('Error:', err);
        setErrorPopup(true);
      }).finally(() => {
        setLoading(false);
        calculateRewardsDebounce();
      });
    }
  }, []);

  const onSubmit: SubmitHandler<IQuiz> = async (quiz) => {
    // console.log(quiz);
    setLoading(true);
    let optionErrorMsg;
    if (Array.isArray(quiz.items)) {
      for (let i = 0; i < quiz.items.length; i++) {
        switch (quiz.items[i].type) {
          case QuestionType.MCQ:
            if (!Array.isArray(quiz.items[i].options) || quiz.items[i].options.length === 0 || !quiz.items[i].options.find(o => o.correctAnswer)) {
              optionErrorMsg = "Error saving quiz: At least one multiple-choice question does not have a correct answer chosen.";
              setError(`items.${i}.options`, { type: "required", message: 'A correct answer must be chosen.' });
            }
            break;
          case QuestionType.LIKERT:
            if (!Array.isArray(quiz.items[i].options) || quiz.items[i].options.length === 0) {
              optionErrorMsg = "Error saving quiz: At least one likert question has no option added.";
              setError(`items.${i}.options`, { type: "required", message: 'At least one option (e.g. Poor, Fair, Good) must be added.' });
            }
            break;
        }
      }
    }

    if (optionErrorMsg) {
      setQuizError(optionErrorMsg);
      setErrorPopup(true);
      setLoading(false);
      return;
    }

    try {
      let response: ApiResponse<IQuiz>;
      if (isCreateMode) {
        response = await createQuiz(quiz);
        navigate(`../${response.result!._id}/edit`, { replace: true });
        setIsCreateMode(false);
        loadQuiz(response.result);
      } else {
        response = await updateQuiz(quiz);
        loadQuiz(response.result);
      }
      setSuccessPopupProps({
        ...successPopupProps, open: true, content: <>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}><Button onClick={() => navigate(-1)} variant="contained" startIcon={<NavigateBeforeOutlinedIcon />}>Back</Button><Button onClick={() => setSuccessPopupProps({ ...successPopupProps, content: '', open: false })} variant="contained" startIcon={<CloseIcon />}>Close</Button></Box>
          <Typography sx={{ marginY: 2 }}>{response?.message ?? ''}</Typography>
        </>
      });
    } catch (err) {
      console.error('Error:', err);
      setErrorPopup(true);
    }
    setLoading(false);
  };

  const watchQuizType = useWatch({ control, name: `type` });
  const watchEvalRewardType = useWatch({ control, name: `rewards` });

  // disable freezing to prevent frozen fields https://github.com/orgs/react-hook-form/discussions/3715#discussioncomment-9550075
  setAutoFreeze(false);
  const dupQuestion = (i: number) => {
    const latest = getValues(`items.${i}`);
    const duplicateQ = produce(latest, draft => {
      if (Array.isArray(draft.options)) {
        for (const option of draft.options) {
          delete option._id;
        }
      }
      if (Array.isArray((draft as WritableDraft<LikertScale>).likert_statements)) {
        for (const statement of (draft as WritableDraft<LikertScale>).likert_statements) {
          delete statement._id;
        }
      }
      delete draft._id;
      if (isNaN(draft.tempId!)) {
        draft.tempId = 0;
      } else {
        draft.tempId!++;
      }
    });
    insertField(i + 1, duplicateQ);
    calculateRewardsDebounce();
  }

  const moveButtonRef = useRef<HTMLButtonElement | null>(null);
  const scrollPosRef = useRef(0);
  const moveQuestion = (e: React.MouseEvent<HTMLButtonElement>, up: boolean, i: number) => {
    scrollPosRef.current = e.currentTarget.getBoundingClientRect().top
    swapField(i, i + (up ? -1 : 1));
    moveButtonRef.current = (e.currentTarget as HTMLButtonElement);
  };
  useEffect(() => {
    if (moveButtonRef.current) {
      const scrollPos = moveButtonRef.current.getBoundingClientRect().top - scrollPosRef.current + window.scrollY;
      window.scrollTo({ top: scrollPos });
      moveButtonRef.current.focus();
    }
  }, [moveButtonRef.current]);

  const calculateRewardsDebounce = React.useMemo(
    () => debounce(
      () => {
        const newTotalRewards = { [RewardType.POINT]: 0, [RewardType.SCORE]: 0 };
        const items = getValues('items');
        if (Array.isArray(items)) {
          for (const item of items) {
            if (!isNaN(item?.rewards?.[RewardType.POINT] as number)) {
              newTotalRewards[RewardType.POINT] += Number(item.rewards![RewardType.POINT]);
            }
            if (!isNaN(item?.rewards?.[RewardType.SCORE] as number)) {
              newTotalRewards[RewardType.SCORE] += Number(item.rewards![RewardType.SCORE]);
            }
          }
        }
        setTotalRewards(newTotalRewards);
      },
      500,
    ),
    [],
  );

  const [totalRewards, setTotalRewards] = useState({ [RewardType.POINT]: 0, [RewardType.SCORE]: 0 });

  const addQuestion = () => {
    appendField(genQuestion(watchQuizType == AssessmentType.SelfAssessment ? QuestionType.MCQ : QuestionType.LIKERT ));
  };

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
    <div>
      <FormProvider {...form}>
        <Box component="form" sx={{ '& > :not(style)': { m: 1 } }} onSubmit={handleSubmit(onSubmit)}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography sx={{ display: 'inline-block' }} variant="h4" gutterBottom><AddBoxOutlinedIcon /> <strong>{isCreateMode ? 'Create' : 'Edit'} Quiz {quizNum && `Q${quizNum}`}</strong></Typography>
            <Button onClick={() => navigate(-1)} variant="contained" startIcon={<NavigateBeforeOutlinedIcon />}>Back</Button>
          </Box>
          <Controller name='title' control={control} render={({ field }) => <TextField required fullWidth label="Quiz Title" variant="outlined" {...field} />} />
          <br />
          <Controller name='description' control={control} render={({ field }) => <TextField required fullWidth label="Quiz Description" variant="outlined" {...field} />} />
          <FormControl fullWidth>
            <InputLabel>Quiz Type *</InputLabel>
            <Controller name='type' control={control} render={({ field }) => (
              <Select disabled={!isCreateMode} required label="Quiz Type *" {...field}>
                <MenuItem value={AssessmentType.SelfAssessment}>Self Assessment</MenuItem>
                <MenuItem value={AssessmentType.PeerEvaluation}>Peer Evaluation</MenuItem>
                <MenuItem value={AssessmentType.ClientEvaluation}>Client Evaluation</MenuItem>
              </Select>
            )} />
          </FormControl>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ textAlign: 'left', userSelect: 'none' }}>
              <Typography component="span" sx={{ mr: 2 }}><b>Reward attachment:</b></Typography>
              <Controller name={`rewards.${RewardType.POINT}`} control={control} render={({ field: { value, ...field } }) => <FormControlLabel control={<Checkbox checked={value as boolean} {...field} />} label="Point" />} />
              <Controller name={`rewards.${RewardType.SCORE}`} control={control} render={({ field: { value, ...field } }) => <FormControlLabel control={<Checkbox checked={value as boolean} {...field} />} label="Score" />} />
            </Box>
            <div>
              {watchEvalRewardType[RewardType.POINT] && <Typography component="span" sx={{ ml: 2 }}>Total Points: {totalRewards[RewardType.POINT]}</Typography>}
              {watchEvalRewardType[RewardType.SCORE] && <Typography component="span" sx={{ ml: 2 }}>Total Score: {totalRewards[RewardType.SCORE]}</Typography>}
            </div>
          </Box>

          <Box sx={{ backgroundColor: '#f5f5f5', p: 2, borderRadius: 1 }}>
            {fields.map((question, i) => {
              return (<Box key={question.id} sx={{ textAlign: 'left', backgroundColor: 'white', border: 1, borderRadius: 1, p: 1.5, my: '20px !important' }}>
                <QuestionField quizItemId={question._id} watchQuizType={watchQuizType} disableAddDelete={!!question._id && !!itemsUsedInAssessment?.[question._id]} watchEvalRewardType={watchEvalRewardType} fieldIndex={i} fieldsLength={fields.length} itemsUsedInAssessment={itemsUsedInAssessment} moveQuestion={moveQuestion} dupQuestion={() => dupQuestion(i)} delQuestion={removeField} calculateRewardsDebounce={calculateRewardsDebounce} />
              </Box>);
            })}

          </Box>
          <Button variant="contained" startIcon={<AddBoxOutlinedIcon />} disabled={watchQuizType === ''} onClick={addQuestion}>Add Question</Button>
          <Button variant="contained" type="submit" disabled={isCreateMode && fields.length === 0}>{isCreateMode ? 'Create' : 'Save'}</Button>
        </Box>
      </FormProvider>
    </div>
  </>;
};

export default QuizEdit;
