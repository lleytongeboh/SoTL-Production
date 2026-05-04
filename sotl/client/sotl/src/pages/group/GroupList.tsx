import { Box, IconButton } from '@mui/material';
import { PersonAdd } from '@mui/icons-material';
import React, { useEffect, useState } from 'react';
import { Group } from 'src/features/student/group/models';
import ContentPanel from '../../components/ContentPanel';
import { useNavigate } from 'react-router-dom';
import { groupHooks } from '../../features/student/group/hooks/groupHooks';
import { DataGrid, GridColDef, useGridApiRef } from "@mui/x-data-grid";
import { LoadingPopupProps } from '../../components/LoadingPopup';
import { PopupProps } from '../../components/SuccessPopup';
import { StudentProps, useAuth } from '../../features/auth/context/AuthContext';
import { useGroup } from '../../features/student/group/context/GroupContext';

type GroupWithNo = Group & { no: number };

const GroupList: React.FC = () => {
    const { selectedGroup } = useGroup();
    const { getGroupList, error, loading } = groupHooks();
    const {identity} = useAuth();
    const profile = identity as StudentProps;
    const [groupList, setGroupList] = useState<GroupWithNo[]>([]);
    const [errorPopup, setErrorPopup] = useState(false);

    const navigate = useNavigate();
    const apiRef = useGridApiRef();

    const loadingPopupProps: LoadingPopupProps = {
        open: loading
    };

    const errorPopupProps: PopupProps = {
        open: errorPopup,
        content: error!,
        onClose: () => {
            setErrorPopup(false);
            navigate('/student/project/details');
        }
    };

    const columns: GridColDef<(GroupWithNo[])[number]>[] = [
        {
            field: 'no',
            headerName: 'No'
        },
        { field: 'name', headerName: 'Group Name' },
        { field: 'leader', headerName: 'Group Leader' },
        {
            field: 'actions',
            headerName: 'Actions(s)',
            sortable: false,
            filterable: false,
            hideable: false,
            headerAlign: 'center',
            renderCell: (params) => (
                <Box sx={{ textAlign: 'center' }}><IconButton
                    aria-label="join group"
                    disabled={params.row.team_members.length >= 7}
                    onClick={() => { onJoinGroup(params.row._id!) }} >
                    <PersonAdd />
                </IconButton></Box>
            ),

        },
    ];

    const fetchData = async () => {
        try {
            const groups = await getGroupList(profile.loginAsBatch);
            setGroupList(groups.map((group, index) => ({ ...group, no: index + 1 })));
        } catch (error) {
            setErrorPopup(true);
        }
    };

    const onJoinGroup = (groupId: string) => {
        navigate('/student/group/join/' + groupId);
    }

    useEffect(() => {
        if (selectedGroup) {
            navigate('/student/project/details');
        }
        fetchData();
    }, []);

    useEffect(() => {
        apiRef.current?.autosizeColumns(
            {
                expand: true,
                includeHeaders: true,
            }
        );
    }, [groupList]);

    return (
        <>
            <ContentPanel
                title='Join Group'
                hasBackButton
                errorPopup={errorPopupProps}
                loadingPopup={loadingPopupProps}
                backLink='/student/project/details'
                content={
                    <>
                        <DataGrid
                            sx={{ border: 'none' }}
                            rows={groupList}
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
                            getRowId={(row) => row._id!}
                            autosizeOptions={
                                {
                                    expand: true,
                                    includeHeaders: true,
                                }
                            }
                            apiRef={apiRef}
                        />
                    </>
                }
            >
            </ContentPanel>
        </>
    );
};

export default GroupList;
