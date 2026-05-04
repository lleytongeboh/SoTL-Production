import React, { useEffect } from "react";
import ContentPanel from "../../components/ContentPanel";
import { Box, IconButton, Tab, Tabs } from "@mui/material";
import { AssignmentLateOutlined, AssignmentTurnedInOutlined, EditOutlined, Refresh } from "@mui/icons-material";
import { DataGrid, GridColDef, useGridApiRef } from "@mui/x-data-grid";
import { projectHooks } from "../../features/student/project/hooks/projectHooks";
import { PopupProps } from "../../components/SuccessPopup";
import { useNavigate } from "react-router-dom";
import { LoadingPopupProps } from "../../components/LoadingPopup";

interface ProjectMarkingRow {
    id: string;
    no: number;
    name: string;
    group: string;
    group_id: string;
    batch: string;
    mark: string;
    isMarked: boolean;
}

const LecturerProjectMarkingList: React.FC = () => {
    const { getProjectList, error, loading } = projectHooks();

    const [tabValue, setTabValue] = React.useState(0);
    const [markedList, setMarkedList] = React.useState<ProjectMarkingRow[]>([]);
    const [unmarkedList, setUnmarkedList] = React.useState<ProjectMarkingRow[]>([]);
    const [errorPopup, setErrorPopup] = React.useState<boolean>(false);

    const apiRef = useGridApiRef();
    const navigate = useNavigate();

    const errorPopupProps: PopupProps = {
        open: errorPopup,
        content: error!,
        onClose: () => {
            setErrorPopup(false);
            navigate('/lecturer/*');
        }
    };

    const loadingPopupProps: LoadingPopupProps = {
        open: loading
    }

    const handleEdit = (id: string) => {
        navigate(`/lecturer/project-marking/edit/${id}`);
    };

    const columns: GridColDef<(ProjectMarkingRow[])[number]>[] = [
        { field: 'no', headerName: 'No' },
        { field: 'name', headerName: 'Project Name' },
        { field: 'group', headerName: 'Group' },
        { field: 'batch', headerName: 'Batch' },
        { field: 'mark', headerName: 'Mark' },
        {
            field: 'actions',
            headerName: 'Actions(s)',
            sortable: false,
            filterable: false,
            hideable: false,
            headerAlign: 'center',
            renderCell: (params) => (
                <Box sx={{ textAlign: 'center' }}><IconButton
                    aria-label="edit"
                    onClick={() => handleEdit(params.row.group_id.toString())}>
                    <EditOutlined />
                </IconButton></Box>
            ),

        },
    ];

    const onTabChange = (_: React.ChangeEvent<{}>, newValue: number) => {
        setTabValue(newValue);
    };

    const fetchData = async () => {
        try {
            const list = await getProjectList();

            let markedCount = 0;
            let unmarkedCount = 0;

            const [marked, unmarked] = list.reduce(
                ([marked, unmarked], e) => {
                    const row: ProjectMarkingRow = {
                        id: e._id!,
                        no: e.marked ? ++markedCount : ++unmarkedCount,
                        name: e.title,
                        group: e.group_name!,
                        group_id: e.group_id!,
                        batch: e.batch!,
                        mark: (e.overall_mark ?? '-') + ' / 70',
                        isMarked: e.marked!
                    };

                    if (row.isMarked) {
                        marked.push(row);
                    } else {
                        unmarked.push(row);
                    }

                    return [marked, unmarked];
                },
                [[], []] as [ProjectMarkingRow[], ProjectMarkingRow[]]
            );

            setMarkedList(marked);
            setUnmarkedList(unmarked);
        } catch (error) {
            setErrorPopup(true);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    interface TabPanelProps {
        children?: React.ReactNode;
        index: number;
        value: number;
    }

    function TabPanel(props: TabPanelProps) {
        const { children, value, index, ...other } = props;
        return (
            <div
                role="tabpanel"
                hidden={value !== index}
                id={`full-width-tabpanel-${index}`}
                aria-labelledby={`full-width-tab-${index}`}
                {...other}
            >
                {value === index && (
                    <Box sx={{ p: 2 }}>
                        {children}
                    </Box>
                )}
            </div>
        );
    }

    function a11yProps(index: number) {
        return {
            id: `simple-tab-${index}`,
            'aria-controls': `simple-tabpanel-${index}`,
        };
    }

    const unmarkedTabContent = () => {
        return (
            <TabPanel value={tabValue} index={0}>
                <DataGrid
                    sx={{ border: 'none' }}
                    rows={unmarkedList}
                    columns={columns}
                    initialState={{
                        pagination: {
                            paginationModel: {
                                pageSize: 10,
                            }
                        }
                    }}
                    pageSizeOptions={[10, 25, 50, 100]}
                    disableColumnResize={true}
                    autosizeOnMount={true}
                    autosizeOptions={
                        {
                            expand: true,
                            includeHeaders: true
                        }
                    }
                    apiRef={apiRef}
                />
            </TabPanel>
        );
    }

    const markedTabContent = () => {
        return (
            <TabPanel value={tabValue} index={1}>
                <DataGrid
                    sx={{ border: 'none' }}
                    rows={markedList}
                    columns={columns}
                    initialState={{
                        pagination: {
                            paginationModel: {
                                pageSize: 10,
                            }
                        }
                    }}
                    pageSizeOptions={[10, 25, 50, 100]}
                    disableColumnResize={true}
                    autosizeOnMount={true}
                    autosizeOptions={
                        {
                            expand: true,
                            includeHeaders: true
                        }
                    }
                    apiRef={apiRef}
                />
            </TabPanel>
        );
    }

    return (
        <>
            <ContentPanel
                title="Project Management / Project Marking"
                customActions={
                    <IconButton sx={{ backgroundColor: 'lightgray' }} onClick={() => fetchData()}><Refresh /></IconButton>
                }
                errorPopup={errorPopupProps}
                loadingPopup={loadingPopupProps}
                content={
                    <>
                        {/* Tabs Header */}
                        <Box sx={{ width: '100%' }}>
                            <Box sx={{ borderBottom: 1, paddingBottom: '20px', borderColor: 'divider' }}>
                                <Tabs value={tabValue} onChange={onTabChange}>
                                    <Tab icon={<AssignmentLateOutlined />} iconPosition="start" label="UNMARK" {...a11yProps(0)} sx={{
                                        '&:focus:not(:focus-visible)': {
                                            outline: 'none',
                                        },
                                    }} />
                                    <Tab icon={<AssignmentTurnedInOutlined />} iconPosition="start" label="MARKED" {...a11yProps(1)} sx={{
                                        '&:focus:not(:focus-visible)': {
                                            outline: 'none',
                                        },
                                    }} />
                                </Tabs>
                            </Box>
                        </Box>
                        {/* Tabs Content */}
                        {unmarkedTabContent()}
                        {markedTabContent()}
                    </>
                }
            />
        </>
    );
};

export default LecturerProjectMarkingList;