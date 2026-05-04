import { Box, IconButton, Link, Menu, MenuItem } from '@mui/material';
import ContentPanel from '../../components/ContentPanel';
import React, { useEffect, useState } from 'react';
import { Label, MoreVert } from '@mui/icons-material';
import { useProject } from '../../features/student/project/context/ProjectContext';
import { Project, TaskContent } from '../../features/student/project/models';
import { projectHooks } from '../../features/student/project/hooks/projectHooks';
import { PopupProps } from '@components/SuccessPopup';
import { useNavigate, useParams } from 'react-router-dom';
import DataTable from 'react-data-table-component';
import moment from 'moment';
import TodoPopup from './todos/TodoPopup';
import _ from 'lodash';

type TableColumn<T> = {
    name: string;
    selector?: (row: T) => any;
    sortable?: boolean;
    cell?: (row: T) => JSX.Element | string;
    grow?: number;
};

type TaskContentWithSprintId = TaskContent & { sprint_id?: string };
export type TaskContentWithChild = TaskContent & { childContent?: TaskContentWithChild[] };

export enum Status {
    'To do', 'In Progress', 'Completed'
};
export enum Priority {
    'Low', 'Medium', 'High'
};

export enum ContentType {
    Todo, StandAloneTodo, Sprint, Task
};

interface TodosProps {
    readonly: boolean;
};

const Todos: React.FC<TodosProps> = ({ readonly }) => {
    const { selectedProject }: { selectedProject: Project | null } = useProject() ?? { selectedProject: null };
    const { projectId: pId } = useParams();
    const projectId = readonly ? pId! : selectedProject!._id!;

    const {
        createTodo,
        createSprint,
        editTodo,
        error,
        loading
    } = projectHooks();
    const {
        fetchTodoContent,
        fetchSprintTodo,
        error: fetchError,
        loading: fetchLoading
    } = projectHooks();
    const navigate = useNavigate();

    const [anchorE1, setAnchorE1] = React.useState<null | HTMLElement>(null);
    const [contentList, setContentList] = React.useState<TaskContentWithSprintId[]>([]);
    const [expandedContent, setExpandedContent] = React.useState<{ [key: string]: TaskContent[] }>({});
    const [successPopup, setSuccessPopup] = React.useState<boolean>(false);
    const [errorPopup, setErrorPopup] = React.useState<boolean>(false);
    const [todoPopup, setTodoPopup] = React.useState<ContentType.Todo | ContentType.Sprint | ContentType.StandAloneTodo | false>(false);
    const [editId, setEditId] = React.useState<string | null>(null);
    const [parentId, setParentId] = React.useState<string | null>(null);

    const openMenu = Boolean(anchorE1);

    const columns: TableColumn<TaskContentWithSprintId>[] = [
        {
            name: 'Title',
            selector: (row: TaskContent) => row.title,
            sortable: true,
            grow: 2,
            cell: (row: TaskContentWithSprintId) => <Box textAlign={"left"}>
                <Label
                    sx={{ marginRight: "5px" }}
                    fontSize='small'
                    color={row.sprint_id ? 'warning' : row.sprint ? 'success' : 'primary'} />
                <Link
                    underline='hover'
                    onClick={() => {
                        setEditId(row.wrapper_id!);
                        setTodoPopup(row.sprint_id ? ContentType.Sprint : row.sprint ? ContentType.Todo : ContentType.StandAloneTodo);
                        setParentId(row.sprint_id ? null : row.sprint ? _.findKey(expandedContent, (value) => value.some(e => e._id === row._id)) ?? null : null);
                    }}>{row.title}</Link>
            </Box>
        },
        {
            name: 'Creator',
            sortable: true,
            selector: (row: TaskContent) => row.creator,
        },
        {
            name: 'Assignee',
            sortable: true,
            selector: (row: TaskContent) => row.assignee ?? 'None',
        },
        {
            name: 'Status',
            grow: 0.5,
            sortable: true,
            selector: (row: TaskContent) => Status[row.status],
        },
        {
            name: 'Due Date',
            sortable: true,
            selector: (row: TaskContent) => row.completed_at ? moment(row.completed_at).format('DD/MM/YYYY') : 'N/A',
        },
        {
            name: 'Progress',
            grow: 0.5,
            sortable: true,
            selector: (row: TaskContent) => `${row.progress?.toFixed() ?? 0} %`,
        },
        {
            name: 'Sprint',
            grow: 0.5,
            sortable: true,
            selector: (row: TaskContent) => row.sprint ?? "N/A",
        }
    ];

    const successPopupProps: PopupProps = {
        open: successPopup,
        content: `Operation Successful`,
        onClose: () => {
            setSuccessPopup(false);
        }
    };

    const errorPopupProps: PopupProps = {
        open: errorPopup,
        content: error ?? fetchError ?? "An error occurred",
        onClose: () => {
            setErrorPopup(false);
        }
    };

    const handleOnSave = async (task_content: TaskContentWithChild) => {
        try {
            // if has editId (aka editing existing record)
            if (editId) {
                // extra validation to make sure the type is correct
                if (todoPopup !== false) {
                    await editTodo(
                        projectId,
                        editId,
                        parentId!,
                        todoPopup,
                        {
                            ...task_content,
                            assignee: task_content.assignee !== '-1' ? task_content.assignee : undefined
                        },
                        (task_content.childContent ?? []).map((task) => (
                            {
                                ...task,
                                assignee: task.assignee !== '-1' ? task.assignee : undefined,
                                childContent: task.childContent?.map((grand) => ({ ...grand, assignee: grand.assignee !== '-1' ? grand.assignee : undefined }))
                            })));
                    setSuccessPopup(true);
                }
            } else {
                if (todoPopup === ContentType.StandAloneTodo) {
                    await createTodo(projectId, { ...task_content!, assignee: task_content!.assignee !== '-1' ? task_content!.assignee : undefined }, (task_content.childContent ?? []).map((task) => ({ ...task, assignee: task.assignee !== '-1' ? task.assignee : undefined })));
                    setSuccessPopup(true);
                } else if (todoPopup === ContentType.Sprint) {
                    await createSprint(projectId, { ...task_content!, assignee: task_content!.assignee !== '-1' ? task_content!.assignee : undefined }, (task_content.childContent ?? []).map((task) => ({ ...task, assignee: task.assignee !== '-1' ? task.assignee : undefined, childContent: task.childContent?.map((child) => ({ ...child, assignee: child.assignee !== '-1' ? child.assignee : undefined })) })));
                    setSuccessPopup(true);
                }
            }
        } catch (error: any) {
            console.log(error);
            setErrorPopup(true);
        } finally {
            await fetchData();
            if (todoPopup === ContentType.Sprint) {
                const response = await fetchSprintTodo(editId!);
                setExpandedContent({ ...expandedContent, [editId!]: response.map(e => ({ ...e, sprint: contentList.find(c => c.sprint_id === editId)?.sprint })) });
            } else if (todoPopup === ContentType.Todo) {
                const response = await fetchSprintTodo(parentId!);
                setExpandedContent({ ...expandedContent, [parentId!]: response.map(e => ({ ...e, sprint: contentList.find(c => c.sprint_id === parentId)?.sprint })) });
            }
        }
    };

    const fetchData = async () => {
        try {
            const response = await fetchTodoContent(projectId);
            setContentList([...(response.sprint ?? []).map(e => ({ ...e.task_content, sprint_id: e._id, sprint: e.task_content.title })), ...(response.toDo ?? []).map(e => e.task_content)]);
        } catch (error: any) {
            console.log(error);
            setErrorPopup(true);
        }
    };

    React.useEffect(() => {
        fetchData();
    }, []);

    const ExpandedRow = ({ row }: { row: TaskContentWithSprintId }) => {
        const [expandLoading, setExpandLoading] = useState(false);

        useEffect(() => {
            const loadExpandedData = async () => {
                if (!expandedContent[row.sprint_id!]) { // Check if data has already been fetched
                    try {
                        setExpandLoading(true);
                        const response = await fetchSprintTodo(row.sprint_id!);
                        setExpandedContent({ ...expandedContent, [row.sprint_id!]: response.map(e => ({ ...e, sprint: row.title })) });
                    } catch (error) {
                        console.error(error);
                    } finally {
                        setExpandLoading(false);
                    }
                }
            };

            loadExpandedData();
        }, []);

        return (
            <div style={{ marginLeft: '47px' }}>
                {expandLoading ? 'Loading...' : (
                    <DataTable
                        columns={columns}
                        data={expandedContent[row.sprint_id!] ?? []}
                        noTableHead
                        pagination={false} // Disable pagination inside expanded content
                    />
                )}
            </div>
        );
    };

    return <>
        <TodoPopup
            open={todoPopup !== false}
            onClose={() => {
                setTodoPopup(false);
                setEditId(null);
                setParentId(null);
            }}
            onSave={(content: TaskContentWithChild) => {
                handleOnSave(content);
                setTodoPopup(false);
                setEditId(null);
                setParentId(null);
            }}
            onDelete={async () => {
                await fetchData();
                if (todoPopup === ContentType.Todo) {
                    const response = await fetchSprintTodo(parentId!);
                    setExpandedContent({ ...expandedContent, [parentId!]: response.map(e => ({ ...e, sprint: contentList.find(c => c.sprint_id === parentId)?.sprint })) });
                }
                setSuccessPopup(true);
                setTodoPopup(false);
                setEditId(null);
                setParentId(null);
            }}
            parentId={parentId ?? undefined}
            editId={editId}
            type={todoPopup as ContentType}
            readonly={readonly}
        />
        <ContentPanel
            title="To-dos"
            customActions={
                <>
                    <IconButton onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                        setAnchorE1(event.currentTarget);
                    }}><MoreVert /></IconButton>
                    <Menu
                        anchorEl={anchorE1}
                        open={openMenu}
                        onClose={() => {
                            setAnchorE1(null);
                        }}
                    >
                        <MenuItem onClick={() => navigate(readonly ? `/lecturer/project/todos/gantt-chart/${projectId}` : 'gantt-chart')}>View Gantt Chart</MenuItem>
                        {!readonly && <Box>
                            <MenuItem onClick={() => setTodoPopup(ContentType.Sprint)}>Create Sprint</MenuItem>
                            <MenuItem onClick={() => setTodoPopup(ContentType.StandAloneTodo)}>Create Todo</MenuItem>
                        </Box>}
                    </Menu>
                </>
            }
            errorPopup={errorPopupProps}
            successPopup={successPopupProps}
            loadingPopup={{
                open: loading || fetchLoading,
            }}
            content={<>
                <Box display={'flex'} gap={3}>
                    <div><Label fontSize='small' color='warning' /> - Sprint</div>
                    <div><Label fontSize='small' color='success' /> - Todo (In Sprint)</div>
                    <div><Label fontSize='small' color='primary' /> - Todo (Standalone)</div>
                </Box>
                <br />
                <DataTable
                    columns={columns}
                    data={contentList}
                    keyField='_id'
                    expandableRows
                    pagination
                    expandableRowsComponent={({ data }) => <ExpandedRow row={data} />}
                    expandableRowDisabled={(row) => !!!row.sprint_id}
                />
            </>}
        />
    </>
};

export default Todos;
