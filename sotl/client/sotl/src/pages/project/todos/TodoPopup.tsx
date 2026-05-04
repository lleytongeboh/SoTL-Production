import GeneralTable, { HeaderProperties } from "../../../components/GeneralTable";
import { AddBoxOutlined, Clear, Delete, ListAlt } from "@mui/icons-material";
import { Avatar, Box, Button, Divider, FormControl, FormHelperText, Grid, IconButton, InputLabel, Link, MenuItem, Modal, Select, TableCell, TableRow, TextField } from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Group } from "../../../features/student/group/models";
import { TaskContent, Comment } from "../../../features/student/project/models";
import { useGroup } from "../../../features/student/group/context/GroupContext";
import React from "react";
import { ContentType, Priority, Status, TaskContentWithChild } from "../Todos";
import moment from "moment";
import { projectHooks } from "../../../features/student/project/hooks/projectHooks";
import { useProject } from "../../../features/student/project/context/ProjectContext";
import ErrorPopup from "../../../components/ErrorPopup";
import ConfirmationPopup from "../../../components/ConfirmationPopup";
import { useAuth } from "../../../features/auth/context";
import { useParams } from "react-router-dom";
import { groupHooks } from "../../../features/student/group/hooks/groupHooks";
import CommentBox from "./CommentBox";
import DescriptionEditor from "./DescriptionEditor";
import CommentEditor from "./CommentEditor";
import ReactQuill from "react-quill";

export interface TodoPopupProps {
    open: boolean;
    onClose?: () => void;
    onSave?: (content: TaskContentWithChild) => void;
    onDelete?: () => void;
    editId: string | null;
    editContent?: TaskContentWithChild; // for editing content haven't been saved
    parentId?: string;
    type: ContentType;
    latestDate?: moment.Moment;
    earliestDate?: moment.Moment;
    readonly: boolean;
}

enum CommentSort {
    Latest,
    Oldest
}

const TodoPopup: React.FC<TodoPopupProps> = ({ open, onClose, editId = null, editContent, type, onSave, onDelete, parentId, latestDate, earliestDate, readonly }) => {
    const { projectId: pId, groupId } = useParams();
    const { selectedGroup }: { selectedGroup: Group | null } = useGroup() ?? { selectedGroup: null };
    const { getGroup, error: gErr, loading: gLoad } = groupHooks();
    const { identity } = useAuth();
    const projectId = readonly ? pId : useProject().selectedProject._id;
    const { fetchSingleTodo, editTodo, deleteTodo, createComment, error, loading } = projectHooks();

    const [group, setGroup] = useState<Group | null>(null);
    const [selectedContent, setSelectedContent] = useState<TaskContent | null>(null);
    const [selectedChildContent, setSelectedChildContent] = useState<TaskContentWithChild[]>([]);
    const [openChildContent, setOpenChildContent] = useState<boolean>(false);
    const [validSave, setValidSave] = useState<boolean>(false);
    const [errorPopup, setErrorPopup] = useState<boolean>(false);
    const [childEditId, setChildEditId] = useState<string | null>(null);
    const [childEditContentIndex, setChildEditContentIndex] = useState<number | null>(null);
    const [confirmPopup, setConfirmPopup] = useState<boolean>(false);

    const [displayComment, setDisplayComment] = useState<Comment[]>([]);
    const [sortBy, setSortBy] = useState<CommentSort>(CommentSort.Latest);
    const [dateError, setDateError] = useState<boolean>(false);

    const descriptionRef = useRef<ReactQuill | null>(null);

    const column: HeaderProperties[] = [
        {
            name: 'No',
            center: false,
        },
        {
            name: 'Tasks',
            center: false,
        },
        {
            name: 'Asignee',
            center: false,
        },
        {
            name: 'Status',
            center: false,
        },
        {
            name: 'Action',
            center: true,
        }
    ];

    const memberList: Map<string, string> = useMemo(() => {
        if (group != null) {
            const members = new Map<string, string>();
            group.team_members.forEach((member) => members.set(member.student_id!, member.name!));
            return members;
        } else {
            return new Map<string, string>();
        }
    }, [group]);

    const memberSelection: ReactNode = useMemo(() => {
        return [
            <MenuItem key={-1} value={"-1"}>None</MenuItem>,
            [...memberList].map(([id, name]) => <MenuItem key={id} value={id}><Avatar sx={{ width: 24, height: 24, marginInlineEnd: '10px' }} />{name}</MenuItem>)];
    }, [memberList]);

    const modalStyle = {
        position: 'absolute' as 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '60%',
        maxHeight: '90%',
        bgcolor: 'background.paper',
        border: '2px solid #000',
        overflow: 'auto',
        boxShadow: 24,
        p: 4,
    };

    const handleCreateComment = async (comment: string) => {
        try {
            await createComment(
                projectId,
                editId!,
                type,
                comment,
                parentId,
            );
        } catch (error: any) {
            setErrorPopup(true);
        } finally {
            fetchData();
        }
    };

    // Delete current 
    const handleDelete = async () => {
        try {
            if (editId) {
                await deleteTodo(projectId, editId, type, parentId ?? undefined);
                if (onDelete) {
                    onDelete();
                    setConfirmPopup(false);
                }
            }
        } catch (error: any) {
            console.log(error);
            setErrorPopup(true);
        }
    }

    // Pass to child popup for edit
    const handleEdit = async (content: TaskContentWithChild) => {
        try {
            if (childEditId) {
                await editTodo(
                    projectId,
                    childEditId, editId!,
                    type === ContentType.Sprint ? ContentType.Todo : ContentType.Task,
                    { ...content!, assignee: content!.assignee !== '-1' ? content!.assignee : undefined },
                    (content.childContent ?? []).map((child) => ({ ...child, assignee: child.assignee !== '-1' ? child.assignee : undefined })));
                setOpenChildContent(false);
            }
        } catch (error: any) {
            setErrorPopup(true);
        } finally {
            fetchData();
        }
    };

    const fetchData = async () => {
        try {
            if (editId) {
                const response = await fetchSingleTodo(projectId, editId, type, parentId);
                if (response) {
                    setSelectedContent(response);
                    setSelectedChildContent(response.childContent ?? []);
                    setDisplayComment([...response.comments ?? []].sort((a, b) => moment(b.created_at).diff(a.created_at)));

                }
            }
        } catch (error: any) {
            setErrorPopup(true);
        }
    };

    const fetchGroup = async () => {
        try {
            if (readonly) {
                const response = await getGroup(groupId!);
                setGroup(response);
            } else {
                //const { selectedGroup }: { selectedGroup: Group } = useGroup();
                setGroup(selectedGroup);
            }
        } catch (error: any) {
            console.log(error);
            setErrorPopup(true);
        }
    };

    useEffect(() => {
        fetchGroup();
        if (open && editId) {
            fetchData();
        } else {
            if (editContent) {
                setSelectedContent(editContent);
                setSelectedChildContent(editContent.childContent ?? []);
            } else {
                setSelectedContent({
                    title: '',
                    creator: identity!._id, // hard coded until profile context
                    description: '',
                    status: Status['To do'],
                    priority: type !== ContentType.Sprint ? Priority['Medium'] : undefined,
                    assignee: '-1',
                    created_at: earliestDate ?? moment(),
                    updated_at: moment(),
                    completed_at: latestDate ?? moment().add(7, 'days'),
                    comments: []
                });
            }
        }

        return () => {
            setSelectedContent(null);
            setSelectedChildContent([]);
            setErrorPopup(false);
            setChildEditId(null);
            setChildEditContentIndex(null);
        }
    }, [open]);

    useEffect(() => {
        if (selectedContent &&
            selectedContent!.title.length > 0 &&
            !dateError) {
            if (type === ContentType.Sprint) {
                if (selectedChildContent.length > 0) {
                    setValidSave(true);
                } else {
                    setValidSave(false);
                }
            } else {
                setValidSave(true);
            }
        } else {
            setValidSave(false);
        }
    }, [selectedContent, selectedChildContent]);

    useEffect(() => {
        if (sortBy === CommentSort.Latest) {
            setDisplayComment([...displayComment].sort((a, b) => moment(b.created_at).diff(a.created_at)));
        } else {
            setDisplayComment([...displayComment].sort((a, b) => moment(a.created_at).diff(b.created_at)));
        }
    }, [sortBy]);

    const TaskRow = ({ task, index }: { task: TaskContent, index: number }) => {
        return <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
            <TableCell>{index + 1}</TableCell>
            <TableCell><Link underline="hover" onClick={() => {
                if (task.wrapper_id !== undefined) {
                    setChildEditId(task.wrapper_id);
                } else {
                    setChildEditContentIndex(index);
                }
                setOpenChildContent(true);
            }}>{task.title}</Link></TableCell>
            <TableCell>
                <FormControl fullWidth>
                    <Select
                        name="child_assignee"
                        size="small"
                        value={selectedChildContent[index].assignee ?? '-1'}
                        renderValue={(value) => memberList.get(value) ?? 'None'}
                        onChange={(e) => {
                            const newChildContent = [...selectedChildContent];
                            newChildContent[index].assignee = e.target.value as string;
                            setSelectedChildContent(newChildContent);
                        }}
                        inputProps={{ readOnly: readonly }}
                    >
                        {memberSelection}
                    </Select>
                </FormControl>
            </TableCell>
            <TableCell>
                <FormControl fullWidth>
                    <Select
                        name="child_status"
                        size="small"
                        value={selectedChildContent[index].status}
                        onChange={(e) => {
                            const newChildContent = [...selectedChildContent];
                            newChildContent[index].status = e.target.value as Status;
                            setSelectedChildContent(newChildContent);
                        }}
                        inputProps={{ readOnly: readonly }}
                    >
                        <MenuItem value={0}>To do</MenuItem>
                        <MenuItem value={1}>In Progress</MenuItem>
                        <MenuItem value={2}>Completed</MenuItem>
                    </Select>
                </FormControl>
            </TableCell>
            {!readonly &&
                <TableCell sx={{ textAlign: 'center' }}>
                    <IconButton onClick={() => {
                        const newChildContent = [...selectedChildContent];
                        newChildContent.splice(index, 1);
                        setSelectedChildContent(newChildContent);
                    }}><Clear /></IconButton>
                </TableCell>
            }
        </TableRow>
    };

    return <>
        {type !== ContentType.Task && <TodoPopup
            open={openChildContent}
            editId={childEditId}
            editContent={childEditContentIndex !== null ? selectedChildContent[childEditContentIndex] : undefined}
            parentId={editId ?? undefined}
            onClose={() => {
                setOpenChildContent(false);
                setChildEditId(null);
                setChildEditContentIndex(null);
            }}
            type={type === ContentType.Sprint ? ContentType.Todo : ContentType.Task}
            onSave={(content) => {
                if (childEditId) {
                    handleEdit(content);
                } else {
                    if (childEditContentIndex !== null) {
                        const newChildContent = [...selectedChildContent];
                        newChildContent[childEditContentIndex] = content;
                        setSelectedChildContent(newChildContent);
                    } else {
                        setSelectedChildContent([...selectedChildContent, content]);
                    }
                    setOpenChildContent(false);
                }
            }}
            onDelete={() => {
                setOpenChildContent(false);
                fetchData();
            }}
            earliestDate={selectedContent?.created_at}
            latestDate={selectedContent?.completed_at}
            readonly={readonly}
        />}
        <ConfirmationPopup
            open={confirmPopup}
            content={'Are you sure you want to delete this?'}
            onClose={() => setConfirmPopup(false)}
            onConfirm={handleDelete}
        />
        <ErrorPopup
            open={errorPopup}
            onClose={() => setErrorPopup(false)}
            content={(error || gErr) ?? 'An error occurred'}
        />
        <Modal
            open={open}
            onClose={onClose}
            aria-labelledby="modal-modal-title"
        >
            <Box sx={modalStyle}>
                {errorPopup ?
                    <Box textAlign={'center'} display={'flex'} flexDirection={'column'} gap={3}>
                        <h1>Error</h1>
                        <p>{error}</p>
                        <Button variant="contained" onClick={onClose}>Back</Button>
                    </Box> :
                    loading || gLoad ?
                        <div>Loading...</div> :
                        <>
                            <Box display={'flex'} justifyContent={'space-between'} alignItems={'center'}>
                                <div className='flex items-center gap-3'>
                                    <ListAlt fontSize="large"></ListAlt>
                                    <p className='title'>
                                        {`${readonly ? 'View' : editId ? 'Edit' : 'Add'} ${type === ContentType.Todo || type === ContentType.StandAloneTodo ? 'Todo' : type === ContentType.Sprint ? 'Sprint' : 'Task'}`}
                                    </p>
                                </div>
                                {!readonly && <Box display={'flex'} gap={2}>
                                    {editId && <IconButton
                                        onClick={() => setConfirmPopup(true)}
                                        color="error">
                                        <Delete />
                                    </IconButton>}
                                    <Button variant='contained' disabled={!validSave} onClick={() => {
                                        if (onSave) {
                                            const selectedContentWithChild: TaskContentWithChild = {
                                                ...selectedContent!,
                                                description: descriptionRef.current?.getEditor().getText() ?? '',
                                                childContent: selectedChildContent
                                            };
                                            console.log(descriptionRef.current?.getEditor().getText() ?? '');
                                            onSave(selectedContentWithChild);
                                        }
                                    }}>SAVE</Button>
                                </Box>}
                            </Box>
                            <br />

                            <Grid container rowSpacing={1.5} columnSpacing={2}>
                                <>
                                    {/* Status */}
                                    <Grid item xs={6}>
                                        <FormControl fullWidth>
                                            <InputLabel id='status-select-label'>Status</InputLabel>
                                            <Select
                                                name="status"
                                                labelId="status-select-label"
                                                value={selectedContent?.status}
                                                label="Status"
                                                onChange={(e) => setSelectedContent({ ...selectedContent!, status: e.target.value as Status })}
                                                inputProps={{ readOnly: readonly }}
                                            >
                                                <MenuItem value={0}>To do</MenuItem>
                                                <MenuItem value={1}>In Progress</MenuItem>
                                                <MenuItem value={2}>Completed</MenuItem>
                                            </Select>
                                        </FormControl>

                                    </Grid>
                                    {/* Priority */}
                                    {type !== ContentType.Sprint && <Grid item xs={6}>
                                        <FormControl fullWidth>
                                            <InputLabel id='priority-select-label'>Priority</InputLabel>
                                            <Select
                                                name="priority"
                                                labelId="priority-select-label"
                                                value={selectedContent?.priority}
                                                label="Priority"
                                                onChange={(e) => setSelectedContent({ ...selectedContent!, priority: e.target.value as Priority })}
                                                inputProps={{ readOnly: readonly }}
                                            >
                                                <MenuItem value={0}>Low</MenuItem>
                                                <MenuItem value={1}>Medium</MenuItem>
                                                <MenuItem value={2}>High</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>}
                                </>
                                {/* Title */}
                                <Grid item xs={12}>
                                    <FormControl fullWidth>
                                        <TextField
                                            name="title"
                                            id="todo-title"
                                            label="Title"
                                            variant="outlined"
                                            value={selectedContent?.title}
                                            inputProps={{ maxLength: 100 }}
                                            onChange={(e) => setSelectedContent({ ...selectedContent!, title: e.target.value })}
                                            fullWidth
                                            InputProps={{ readOnly: readonly }}
                                            required
                                        />
                                        <FormHelperText>{selectedContent?.title.length}/100</FormHelperText>
                                    </FormControl>
                                </Grid>
                                {/* Description */}
                                <Grid item xs={12}>
                                    <DescriptionEditor
                                        readonly={readonly}
                                        selectedDescription={selectedContent?.description ?? ''}
                                        quillRef={descriptionRef}
                                    />
                                </Grid>
                                {/* Child Content (Tasks / Todo) */}
                                {type !== ContentType.Task && <Grid item xs={12}>
                                    <Box display={'flex'} justifyContent={'space-between'} alignItems={'center'}>
                                        <Box display={'flex'} gap={1}>
                                            <b>{type === ContentType.Todo || type === ContentType.StandAloneTodo ? "Tasks" : "Todos"}</b>
                                            <FormHelperText>(at least 1)</FormHelperText>
                                        </Box>
                                        {!readonly && <Button variant='contained' size="small" startIcon={<AddBoxOutlined />} onClick={() => setOpenChildContent(true)}>ADD {type === ContentType.Todo || type === ContentType.StandAloneTodo ? "TASK" : "TODO"}</Button>}
                                    </Box>
                                    <GeneralTable
                                        size="small"
                                        tableHeader={column.slice(0, readonly ? 4 : 5)}
                                        tableBody={selectedChildContent.map((task, index) => <TaskRow key={index} task={task} index={index} />)}
                                    />
                                </Grid>}
                                <>
                                    {/* Start Date */}
                                    <Grid item xs={6}>
                                        <FormControl fullWidth>
                                            <LocalizationProvider dateAdapter={AdapterMoment}>
                                                <DatePicker
                                                    name="start_date"
                                                    label="Start Date"
                                                    format="DD/MM/YYYY"
                                                    readOnly={readonly}
                                                    value={moment(selectedContent?.created_at)}
                                                    minDate={earliestDate ? moment(earliestDate) : undefined}
                                                    maxDate={selectedContent?.completed_at ? moment(selectedContent?.completed_at) : undefined}
                                                    onError={() => setDateError(true)}
                                                    onChange={(newValue, context) => {
                                                        if (context.validationError === null) {
                                                            setDateError(false);
                                                            setSelectedContent({ ...selectedContent!, created_at: newValue ?? undefined });
                                                        } else if (context.validationError !== null) {
                                                            setDateError(true);
                                                        }
                                                    }}
                                                />
                                            </LocalizationProvider>
                                        </FormControl>
                                    </Grid>
                                    {/* Due Date */}
                                    <Grid item xs={6}>
                                        <FormControl fullWidth>
                                            <LocalizationProvider dateAdapter={AdapterMoment}>
                                                <DatePicker
                                                    name="due_date"
                                                    label="Due Date"
                                                    format="DD/MM/YYYY"
                                                    readOnly={readonly}
                                                    value={selectedContent?.completed_at ? moment(selectedContent?.completed_at) : null}
                                                    minDate={moment(selectedContent?.created_at)}
                                                    maxDate={latestDate ? moment(latestDate) : undefined}
                                                    onError={() => setDateError(true)}
                                                    onChange={(newValue, context) => {
                                                        if (context.validationError === null) {
                                                            setDateError(false);
                                                            setSelectedContent({ ...selectedContent!, completed_at: newValue ?? undefined });
                                                        } else if (context.validationError !== null) {
                                                            setDateError(true);
                                                        }
                                                    }}
                                                />
                                            </LocalizationProvider>
                                        </FormControl>
                                    </Grid>
                                </>
                                {/* Assignee */}
                                <Grid item xs={6}>
                                    <FormControl fullWidth>
                                        <InputLabel id='assignee-select-label'>Assignee</InputLabel>
                                        <Select
                                            name="assignee"
                                            labelId="assignee-select-label"
                                            value={selectedContent?.assignee ?? '-1'}
                                            label="Assignee"
                                            onChange={(e) => setSelectedContent({ ...selectedContent!, assignee: e.target.value as string })}
                                            renderValue={(value) => memberList.get(value) ?? 'None'}
                                            inputProps={{ readOnly: readonly }}
                                        >
                                            {memberSelection}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                {((editId && !readonly) || (readonly)) && <Grid item xs={12}>
                                    {(editId && !readonly) && <CommentEditor
                                        createCallback={handleCreateComment}
                                    />}
                                    {(displayComment.length > 0) ? <>
                                        <Box marginTop={'15px'} display={'flex'} alignItems={'center'} gap={1} justifyContent={'end'}>
                                            Sort by:
                                            <Select
                                                value={sortBy}
                                                size="small"
                                                onChange={(value) => {
                                                    setSortBy(value.target.value as CommentSort);
                                                }}
                                            >
                                                <MenuItem value={0}>Latest</MenuItem>
                                                <MenuItem value={1}>Oldest</MenuItem>
                                            </Select>
                                        </Box>
                                        <Box marginY='15px' paddingY='10px' border={1} borderRadius={3}>
                                            {displayComment.map((comment, index) => <div key={index}>
                                                <CommentBox comment={comment} onRefresh={() => fetchData()} />
                                                {index !== displayComment.length - 1 && <Divider sx={{ marginX: '10px' }} />}
                                            </div>)}
                                        </Box>
                                    </> : <Box marginY='15px' paddingY='20px' border={1} borderRadius={3} textAlign={'center'}>No comments</Box>}
                                </Grid>}
                            </Grid>
                        </>}
            </Box>
        </Modal>
    </>
};

export default TodoPopup;