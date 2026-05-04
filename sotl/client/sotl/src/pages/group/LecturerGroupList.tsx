import SearchBar from "../../components/SearchBar";
import ContentPanel from "../../components/ContentPanel";
import React, { useEffect } from "react";
import { Avatar, Box, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow } from "@mui/material";
import { DeleteOutlineOutlined, EditOutlined, Refresh } from "@mui/icons-material";
import { Group } from "../../features/student/group/models";
import { groupHooks } from "../../features/student/group/hooks/groupHooks";
import { useNavigate } from "react-router-dom";
import { PopupProps } from "../../components/SuccessPopup";
import { LoadingPopupProps } from "../../components/LoadingPopup";
import ConfirmationPopup from "../../components/ConfirmationPopup";

const LecturerGroupManagement: React.FC = () => {
    const { getGroupList, deleteGroup, error, loading } = groupHooks();

    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(10);
    const [groupList, setGroupList] = React.useState<Group[]>([]);
    const [filteredList, setFilteredList] = React.useState<Group[]>([]);
    const [errorPopup, setErrorPopup] = React.useState(false);
    const [successPopup, setSuccessPopup] = React.useState(false);
    const [confirmPopup, setConfirmPopup] = React.useState(false);
    const [selectedGroupId, setSelectedGroupId] = React.useState<string | null>(null);

    const navigate = useNavigate();

    const errorPopupProps: PopupProps = {
        content: error!,
        open: errorPopup,
        onClose: () => {
            setErrorPopup(false);
            navigate('/lecturer/group/list');
        }
    };
    const successPopupProps: PopupProps = {
        content: "Group deleted successfully!",
        open: successPopup,
        onClose: () => {
            setSuccessPopup(false);
        }
    };
    const loadingPopupProps: LoadingPopupProps = {
        open: loading,
    };

    const handleChangePage = (
        _: React.MouseEvent<HTMLButtonElement> | null,
        newPage: number,
    ) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleDelete = async () => {
        try {
            const response = await deleteGroup(selectedGroupId!);
            if (response) {
                setSuccessPopup(true);
                fetchData();
            }
        } catch (error) {
            setErrorPopup(true);
        }
    }

    const handleSearch = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const searchValue = event.target.value;
        if (searchValue) {
            const filtered = groupList.filter((group: Group) => {
                return group.name.toLowerCase().includes(searchValue.toLowerCase()) ||
                    (group.leader ?? "").toLowerCase().includes(searchValue.toLowerCase()) ||
                    (group.batch ?? "").toLowerCase().includes(searchValue.toLowerCase());
            });
            setFilteredList(filtered);
        } else {
            setFilteredList(groupList);
        }
    };

    const fetchData = async () => {
        try {
            const list: Group[] = await getGroupList("all");
            if (list) {
                setGroupList(list);
                setFilteredList(list);
            }
        } catch (error) {
            setErrorPopup(true);
        }
    }

    useEffect(() => {
        fetchData();
    }, []);

    const GroupRow = (props: { group: Group, index: number }) => {
        const { group, index } = props;
        return (
            <>
                <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
                    <TableCell>
                        {index + 1}
                    </TableCell>
                    <TableCell>{group.name}</TableCell>
                    <TableCell>
                        <Box display={"flex"} alignItems={"center"} gap={1}>
                            <Avatar />
                            {group.leader}
                        </Box>
                    </TableCell>
                    <TableCell>{group.team_members.length}</TableCell>
                    <TableCell>{group.batch}</TableCell>
                    <TableCell align='center'>
                        <div className="flex justify-around">
                            <IconButton
                                sx={{ backgroundColor: "lightgray" }}
                                onClick={() => {
                                    navigate(`/lecturer/group/manage/${group._id}`);
                                }}><EditOutlined /></IconButton>
                            <IconButton
                                sx={{ backgroundColor: "lightgray" }}
                                onClick={() => {
                                    setSelectedGroupId(group._id!);
                                    setConfirmPopup(true);
                                }}><DeleteOutlineOutlined /></IconButton>
                        </div>
                    </TableCell>
                </TableRow>
            </>
        );
    };

    return (
        <>
            <ConfirmationPopup
                open={confirmPopup}
                onClose={() => setConfirmPopup(false)}
                onConfirm={() => {
                    setConfirmPopup(false);
                    handleDelete();
                }}
                content="Are you sure you want to delete this group?"
            />
            <ContentPanel
                title="Group Management"
                errorPopup={errorPopupProps}
                successPopup={successPopupProps}
                loadingPopup={loadingPopupProps}
                customActions={<IconButton sx={{ backgroundColor: 'lightgray' }} onClick={() => fetchData()}><Refresh /></IconButton>}
                content={
                    <>
                        <SearchBar onSearchBarChange={handleSearch} />
                        <br />
                        <>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow >
                                            <TableCell sx={{ fontWeight: 'bold' }}>#</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Group Name</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Group Leader</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Member Count</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Batch</TableCell>
                                            <TableCell align='center' sx={{ fontWeight: 'bold' }}>Action(s)</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {filteredList && filteredList.slice(page * rowsPerPage, (page + 1) * rowsPerPage - 1).map((group: Group, index: number) => (
                                            <GroupRow key={group._id} group={group} index={index} />
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            <TablePagination
                                component="div"
                                count={filteredList.length}
                                page={page}
                                onPageChange={handleChangePage}
                                rowsPerPage={rowsPerPage}
                                onRowsPerPageChange={handleChangeRowsPerPage}
                            />
                        </>
                    </>
                }
            />
        </>
    );
}

export default LecturerGroupManagement;