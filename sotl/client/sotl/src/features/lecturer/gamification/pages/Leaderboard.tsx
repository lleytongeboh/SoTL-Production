import React from "react";
import { IconButton, Box, Tab, Tabs, MenuItem, Select, SelectChangeEvent, InputLabel, FormControl, Paper, Typography } from "@mui/material";
import { GridColDef, DataGrid } from '@mui/x-data-grid';
import { WorkspacePremium } from "@mui/icons-material";
import { useGamificationHooks } from '../hooks/useGamificationHooks';
import { PopupProps } from '../../../../components/SuccessPopup';
import { LoadingPopupProps } from '../../../../components/LoadingPopup';
import ContentPanel from "../../../../components/ContentPanel";
import { BadgeList, LeaderboardProps, BadgeProps, GroupLeaderboardProps } from "../models";
import BadgeRankDialog from "../components/BadgeRankDialog";
import { useAuth } from "../../../auth/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from 'uuid';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function CustomTabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && <Box>{children}</Box>}
        </div>
    );
}

function a11yProps(index: number) {
    return {
        id: `simple-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
    };
}

const LeaderBoard = () => {
    const { role } = useAuth();
    const navigate = useNavigate();
    const [openBadgeRank, setOpenBadgeRank] = React.useState(false);
    const { getBadgeList, getLeaderboard } = useGamificationHooks();
    const [loading, setLoading] = React.useState<boolean>(true);
    const [error, setError] = React.useState<{ message: string, status: boolean }>({ message: '', status: false });
    const [badgeList, setBadgeList] = React.useState<BadgeList[]>([]);
    const [batchList, setBatchList] = React.useState<string[]>([]);
    const [selectedBatch, setSelectedBatch] = React.useState<string>('');
    const [allLeaderboardData, setAllLeaderboardData] = React.useState<LeaderboardProps[]>([]);
    const filterLeaderboardData = React.useMemo(() => (
        allLeaderboardData.filter(data => data.group.batch === selectedBatch).map((data, index) => ({ ...data, no: index + 1 }))
    ), [allLeaderboardData, selectedBatch]);
    const filterGroupLeaderboardData = React.useMemo(() => {
        const groupMap = new Map();
        for (let i = 0; i < allLeaderboardData.length; i++) {
            const groupData = allLeaderboardData[i].group;

            // Skip entries without the required structure or matching batch
            if (!groupData || groupData.batch !== selectedBatch) continue;

            // Create a unique key for the group
            const key = `${groupData.name}-${groupData.batch}`;

            if (!groupMap.has(key)) {
                groupMap.set(key, {
                    name: groupData.name,
                    projectName: groupData.project?.title || '-',
                    batch: groupData.batch,
                    badges: groupData.project?.badges || [],
                    mark: groupData.project?.mark || '-',
                    progress: groupData.project?.progress || '-'
                });
            }
        }
        return Array.from(groupMap.values()).map((data, index) => ({
            ...data,
            no: index + 1,
            uuid: uuidv4()
        }));
    }, [allLeaderboardData, selectedBatch]);

    const [value, setValue] = React.useState(0); // tab value

    const loadingPopupProps: LoadingPopupProps = {
        open: loading,
        onClose: () => setLoading(false),
        content: 'Loading...'
    };

    const errorPopupProps: PopupProps = {
        open: error.status,
        content: error.message,
        onClose: () => setError({ message: '', status: false })
    };

    React.useEffect(() => {
        fetchBadgeList();
    }, []);

    const fetchBadgeList = async () => {
        setLoading(true);
        try {
            const result = await getBadgeList();
            console.log('check badge list', result);
            if (result.length > 0) {
                setBadgeList(result);
                setBatchList(result.map(b => b.batch));
                setSelectedBatch(result[0].batch);
            }
        } catch (error: any) {
            setError({ message: error.message, status: true });
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchLeaderboard();
    }, []);

    const fetchLeaderboard = async () => {
        setLoading(true);
        try {
            const result = await getLeaderboard();
            const resultWithId = result.map((data, index) => ({ ...data, uuid: uuidv4() }));
            setAllLeaderboardData(resultWithId);
        } catch (error: any) {
            setError({ message: error.message, status: true });
        } finally {
            setLoading(false);
        }
    };

    // handle Tab change
    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

    const handleSelectBoxChange = (event: SelectChangeEvent) => {
        setSelectedBatch(event.target.value as string);
    };

    // DataGrid columns - Individual
    const individualColumns: GridColDef[] = [
        { field: 'no', headerName: '#', width: 50 },
        { field: 'name', headerName: 'Name', width: 200 },
        { field: 'matric', headerName: 'Matric', width: 200 },
        { field: 'group', headerName: 'Group', width: 200, valueGetter: (_, row) => row.group.name },
        { field: 'batch', headerName: 'Batch', width: 200, valueGetter: (_, row) => row.group.batch },
        {
            field: 'badge', headerName: 'Badge', width: 200,
            renderCell: (params) => {
                return (
                    <div
                        className="flex flex-row justify-start items-center gap-2"
                        style={{ height: '100%' }}
                    >
                        {(params.row.group && params.row.group.project !== undefined && params.row.group.project.badges !== undefined && params.row.group.project.badges.length > 0) ?
                            params.row.group.project.badges.map((b: BadgeProps) => (
                                <Typography key={b._id} className="text-left"><span ><WorkspacePremium sx={{ color: b?.color, fontSize: '20px' }} /></span></Typography>
                            )) : <Typography className="text-left">-</Typography>}

                    </div>
                );
            }

        },
        { field: 'point', headerName: 'Point', width: 200 },
        { field: 'mark', headerName: 'Mark', width: 200 },
    ];

    // DataGrid columns - Group
    const groupColumns: GridColDef[] = [
        { field: 'no', headerName: '#', width: 50 },
        { field: 'name', headerName: 'Name', width: 250 },
        { field: 'projectName', headerName: 'Project', width: 250, resizable: false },
        { field: 'batch', headerName: 'Batch', width: 250 },
        {
            field: 'badge', headerName: 'Badge', width: 250,
            renderCell: (params) => {
                return (
                    <div
                        className="flex flex-row justify-start items-center gap-2"
                        style={{ height: '100%' }}
                    >
                        {(params.row.badges !== undefined && params.row.badges.length > 0) ?
                            params.row.badges.map((b: BadgeProps) => (
                                <Typography key={b._id} className="text-left"><span ><WorkspacePremium sx={{ color: b?.color, fontSize: '20px' }} /></span></Typography>
                            )) : <Typography className="text-left">-</Typography>}

                    </div>
                );
            }
        },
        { field: 'mark', headerName: 'Mark', width: 250 },
        { field: 'progress', headerName: 'Progress', width: 200 },
    ];

    // Handle row click
    const handleRowClick = (params: any) => {
        if (role === 'lecturer')
            navigate(`/lecturer/user-management/student/${params.row._id}`);
        else if (role === 'student')
            navigate(`/student/student-profile/${params.row._id}`);
    };

    return (
        <ContentPanel
            title="Leaderboard"
            loadingPopup={loadingPopupProps}
            errorPopup={errorPopupProps}
            customActions={
                <IconButton sx={{ backgroundColor: 'lightgray' }} onClick={() => setOpenBadgeRank(true)}><WorkspacePremium /></IconButton>
            }
            content={
                <>
                    <div
                        className="flex flex-row justify-end items-center"
                    >
                        <FormControl variant="outlined">
                            <InputLabel id="select-batch-label">Batch</InputLabel>
                            <Select
                                labelId="select-batch-label"
                                id="select-batch-label"
                                value={selectedBatch}
                                label="Batch"
                                onChange={handleSelectBoxChange}
                                sx={{ minWidth: '200px' }}
                                color="primary"
                            >
                                <MenuItem value={'None'}>None</MenuItem>
                                {
                                    batchList.map((batch, index) => (
                                        <MenuItem key={index} value={batch}>{batch}</MenuItem>
                                    ))
                                }
                            </Select>
                        </FormControl>
                    </div>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Tabs value={value} onChange={handleTabChange} aria-label="basic tabs example">
                            <Tab label="Individuals" {...a11yProps(0)} />
                            <Tab label="Groups" {...a11yProps(1)} />
                        </Tabs>
                    </Box>
                    <CustomTabPanel value={value} index={0}>
                        <Paper sx={{ height: 400, width: 'auto' }}>
                            <DataGrid
                                rows={filterLeaderboardData}
                                columns={individualColumns}
                                initialState={{
                                    pagination: {
                                        paginationModel: {
                                            pageSize: 10,
                                        }
                                    }
                                }}
                                onRowClick={handleRowClick}
                                sx={{ cursor: 'pointer' }}
                                pageSizeOptions={[10, 25, 50, 100]}
                                disableColumnResize={true}
                                autosizeOnMount={true}
                                getRowId={(row) => row.uuid!}
                                autosizeOptions={
                                    {
                                        expand: true,
                                        includeHeaders: true,
                                    }
                                }
                            />
                        </Paper>
                    </CustomTabPanel>
                    <CustomTabPanel value={value} index={1}>
                        <Paper sx={{ height: 400, width: 'auto' }}>
                            <DataGrid
                                rows={filterGroupLeaderboardData}
                                columns={groupColumns}
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
                                getRowId={(row) => row.uuid!}
                                autosizeOptions={
                                    {
                                        expand: true,
                                        includeHeaders: true,
                                    }
                                }
                            />
                        </Paper>
                    </CustomTabPanel>
                    <BadgeRankDialog open={openBadgeRank} onClose={() => setOpenBadgeRank(false)} badgeList={badgeList} />
                </>
            }
        />
    );
};

export default LeaderBoard;