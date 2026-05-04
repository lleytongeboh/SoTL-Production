import { groupHooks } from "../../features/student/group/hooks/groupHooks";
import ContentPanel from "../../components/ContentPanel";
import { Link, useNavigate, useParams } from "react-router-dom";
import { projectHooks } from "../../features/student/project/hooks/projectHooks";
import React from "react";
import { PopupProps } from "@components/SuccessPopup";
import { Deliverable, Project } from "../../features/student/project/models";
import { Group, TeamMember } from "../../features/student/group/models";
import { Box, Button, FormControl, FormHelperText, IconButton, TableCell, TableRow, TextField, Tooltip, Typography } from "@mui/material";
import { Check, Close, Comment, DeleteOutline, DownloadOutlined, EditOutlined, EventNoteOutlined, KeyboardArrowLeft } from "@mui/icons-material";
import GeneralTable, { HeaderProperties } from "../../components/GeneralTable";
import moment from "moment";
import ConfirmationPopup from "../../components/ConfirmationPopup";
import { deliverablesHooks } from "../../features/lecturer/deliverables/hooks/deliverablesHooks";
import { Deliverable as DeliverableConfig } from "../../features/lecturer/deliverables/models";
import CommentPopup from "../../components/CommandPopup";

enum DeliverableStatus {
    REJECTED = "Rejected",
    PENDING = "Pending",
    APPROVED = "Approved",
    SUBMITTED = "Submitted",
}

export const getStatus = (type: boolean, status: number): DeliverableStatus => {
    if (type) {
        switch (status) {
            case 0:
                return DeliverableStatus.PENDING;
            case 1:
                return DeliverableStatus.APPROVED;
            case 2:
                return DeliverableStatus.REJECTED;
            default:
                return DeliverableStatus.PENDING;
        }
    } else {
        return DeliverableStatus.SUBMITTED;
    }
};

export const statusComponent = (status: DeliverableStatus): React.ReactNode => {
    const getStatusColor = (status: DeliverableStatus): string => {
        switch (status) {
            case DeliverableStatus.PENDING:
                return "blue";
            case DeliverableStatus.APPROVED:
                return "green";
            case DeliverableStatus.REJECTED:
                return "red";
            case DeliverableStatus.SUBMITTED:
                return "black";
            default:
                return "black";
        }
    };
    return <p style={{ color: getStatusColor(status) }}>{status}</p>;
};

const LecturerGroupManage: React.FC = () => {
    const { getGroup, error, loading } = groupHooks();
    const { getProject, updateDeliverableStatus, deleteDeliverable, downloadDeliverable, error: pErr, loading: pLoad } = projectHooks();
    const { getDeliverablesList, error: dErr, loading: dLoad } = deliverablesHooks();
    const { groupId } = useParams();

    const [errorPopup, setErrorPopup] = React.useState(false);
    const [successPopup, setSuccessPopup] = React.useState(false);
    const [confirmPopup, setConfirmPopup] = React.useState(false);
    const [commentPopup, setCommentPopup] = React.useState(false);
    const [selectedGroup, setSelectedGroup] = React.useState<Group | null>(null);
    const [selectedProject, setSelectedProject] = React.useState<Project | null>(null);
    const [deliverablesList, setDeliverablesList] = React.useState<DeliverableConfig[] | null>(null);
    const [selectedDeliverable, setSelectedDeliverable] = React.useState<Deliverable | null>(null);
    const [action, setAction] = React.useState<'approve' | 'reject' | 'delete' | 'comment' | null>(null);
    const [comment, setComment] = React.useState<string | undefined>(undefined);

    const navigate = useNavigate();

    const teamTableHeader: HeaderProperties[] = [
        { name: 'No', center: false },
        { name: 'Name', center: false },
        { name: 'Group Role (s)', center: false },
        { name: 'Project Role (s)', center: false },
    ];
    const deliverableTableHeader: HeaderProperties[] = [
        { name: 'No', center: false },
        { name: 'Submission Date', center: false },
        { name: 'Deliverable Name', center: false },
        { name: 'Deliverable File', center: false },
        { name: 'Deliverable Status', center: false },
        { name: 'Acition(s)', center: true },
    ];

    const errorPopupProps: PopupProps = {
        content: error ?? pErr ?? dErr ?? "An error occurred! Please try again later.",
        open: errorPopup,
        onClose: () => {
            setErrorPopup(false);
            navigate('/lecturer/group/list');
        }
    };

    const successPopupProps: PopupProps = {
        content: action === 'approve' ? "Deliverable approved successfully!" : action === 'reject' ? "Deliverable rejected successfully!" : "Editted successfully!",
        open: successPopup,
        onClose: () => {
            setSuccessPopup(false);
        }
    };

    const handleChangeDeliverableStatus = async (status: number) => {
        try {
            const project = await updateDeliverableStatus(selectedProject!._id!, selectedDeliverable!._id!, status, comment);
            setComment(undefined);
            if (project) {
                setSelectedProject(project);
                setSuccessPopup(true);
            }
        } catch (error) {
            setErrorPopup(true);
        }
    };

    const handleDeleteDeliverable = async () => {
        try {
            const project = await deleteDeliverable(selectedProject!._id!, selectedDeliverable!._id!);
            if (project) {
                setSelectedProject(project);
                setSuccessPopup(true);
            }
        } catch (error) {
            setErrorPopup(true);
        }
    };

    const handleDownloadDeliverable = async (deliverableId: string, fileName: string) => {
        try {
            await downloadDeliverable(selectedProject!._id!, deliverableId, fileName);
        } catch (error) {
            setErrorPopup(true);
        }
    };

    const fetchData = async () => {
        try {
            const group = await getGroup(groupId!);
            const project = group.project ? await getProject(group.project!) : null;
            const deliverables = await getDeliverablesList();
            if (group && deliverables) {
                setSelectedGroup(group);
                setSelectedProject(project);
                setDeliverablesList(deliverables);
            }
        } catch (error) {
            setErrorPopup(true);
        }
    };

    React.useEffect(() => {
        fetchData();
    }, []);

    function TeamRow(props: { teamMember: TeamMember, index: number }) {
        const { teamMember, index } = props;
        return <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
            <TableCell>{index + 1}</TableCell>
            <TableCell><Link to={`/lecturer/user-management/student/${teamMember.student_id}`}>{teamMember.name}</Link></TableCell>
            <TableCell>{teamMember.group_role}</TableCell>
            <TableCell>{teamMember.project_role?.map(e => <Box key={e}>{e}</Box>)}</TableCell>
        </TableRow>
    };

    function DeliverableRow(props: { deliverable: Deliverable, index: number }) {
        const { deliverable, index } = props;
        const dConfig = deliverablesList!.find((d) => d._id === deliverable.deliverable_id);
        const status: DeliverableStatus = getStatus(dConfig!.approve, deliverable.status);
        return <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
            <TableCell>{index + 1}</TableCell>
            <TableCell>{moment(deliverable.created_at).format('DD/MM/YYYY')}</TableCell>
            <TableCell>{dConfig!.name}</TableCell>
            <TableCell>{deliverable.name}</TableCell>
            <TableCell>{statusComponent(status)}</TableCell>
            <TableCell align="center" sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Tooltip title="Download"><IconButton onClick={() => handleDownloadDeliverable(deliverable._id!, deliverable.name)}><DownloadOutlined /></IconButton></Tooltip>
                {status === DeliverableStatus.REJECTED && <Tooltip title='View Comment' onClick={() => {
                    setSelectedDeliverable(deliverable);
                    setAction('comment');
                    setCommentPopup(true);
                }}><IconButton><Comment /></IconButton></Tooltip>}
                {status !== DeliverableStatus.PENDING && <Tooltip title="Delete">
                    <IconButton onClick={() => {
                        setAction('delete');
                        setSelectedDeliverable(deliverable);
                        setConfirmPopup(true);
                    }}><DeleteOutline /></IconButton>
                </Tooltip>}
                {status === DeliverableStatus.PENDING && <>
                    <Tooltip title="Reject">
                        <IconButton onClick={() => {
                            setAction('reject');
                            setComment(undefined);
                            setSelectedDeliverable(deliverable);
                            setConfirmPopup(true);
                        }}><Close color="error" /></IconButton>
                    </Tooltip>
                    <Tooltip title="Approve">
                        <IconButton onClick={() => {
                            setAction('approve');
                            setComment(undefined);
                            setSelectedDeliverable(deliverable);
                            setConfirmPopup(true);
                        }}><Check color="success" /></IconButton>
                    </Tooltip>
                </>}
            </TableCell>
        </TableRow>
    };

    return <>
        <CommentPopup
            content={selectedDeliverable?.comment ?? ""}
            open={commentPopup}
            onClose={() => setCommentPopup(false)}
        />
        <ConfirmationPopup
            open={confirmPopup}
            onClose={() => setConfirmPopup(false)}
            onConfirm={async () => {
                if (action === 'approve') {
                    await handleChangeDeliverableStatus(1);
                } else if (action === 'reject') {
                    await handleChangeDeliverableStatus(2);
                } else if (action === 'delete') {
                    await handleDeleteDeliverable();
                }
                setConfirmPopup(false);
            }}
            content={action === 'approve' ?
                "Are you sure you want to approve this deliverable?" :
                action === 'reject' ?
                    <>
                        <p>Are you sure you want to reject this deliverable?</p>
                        <br />
                        <FormControl fullWidth>
                            <TextField multiline minRows={2} inputProps={{ maxLength: 100 }} placeholder="Leave a feedback" value={comment} onChange={(e) => setComment(e.target.value)} />
                            <FormHelperText>{comment?.length ?? 0} / 100</FormHelperText>
                        </FormControl>
                    </> :
                    action === 'delete' ?
                        "Are you sure you want to delete this deliverable?" : ""
            }
        />
        <ContentPanel
            title="Edit Group"
            removeTitleRow
            errorPopup={errorPopupProps}
            successPopup={successPopupProps}
            loadingPopup={
                {
                    open: loading || pLoad || dLoad,
                }
            }
            content={
                <div className="text-start">
                    <Box sx={{ textAlign: "start" }}><Button variant="contained" onClick={() => navigate(-1)} startIcon={<KeyboardArrowLeft />}>BACK</Button></Box>
                    <br />
                    {/* Group Details */}
                    {selectedGroup && <>
                        <Box display={'flex'} justifyContent={"space-between"}>
                            <p className="title">{selectedGroup?.name}</p>
                            <Tooltip title="Edit"><IconButton component={Link} to={"/lecturer/group/edit/" + groupId} ><EditOutlined /></IconButton></Tooltip>
                        </Box>
                        <Box padding={1} display={"flex"} flexDirection={"column"} gap={2}>
                            <Box>
                                <Typography variant="h6"><b>Description</b></Typography>
                                <Typography variant="body1">{selectedGroup?.description}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="h6"><b>Team Member</b></Typography>
                                <GeneralTable
                                    tableHeader={teamTableHeader}
                                    tableBody={selectedGroup?.team_members.map((teamMember, index) => <TeamRow key={teamMember.student_id} teamMember={teamMember} index={index} />)}
                                />
                            </Box>
                        </Box>
                    </>}
                    <br />
                    {/* Project Details */}
                    {selectedProject && <>
                        <Box display={'flex'} justifyContent={"space-between"}>
                            <p className="title">Project</p>
                            <Box display={'flex'} gap={2}>
                                <Tooltip title="View Todos"><IconButton component={Link} to={"/lecturer/project/todos/" + selectedGroup?.project + "/" + selectedGroup?._id}><EventNoteOutlined /></IconButton></Tooltip>
                                <Tooltip title="Edit"><IconButton component={Link} to={"/lecturer/project/edit/" + selectedGroup?.project}><EditOutlined /></IconButton></Tooltip>
                            </Box>
                        </Box>
                        <Box padding={1} display={"flex"} flexDirection={"column"} gap={2}>
                            <Box>
                                <Typography variant="h6"><b>Title</b></Typography>
                                <Typography variant="body1">{selectedProject?.title}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="h6"><b>Description</b></Typography>
                                <Typography variant="body1">{selectedProject?.description}</Typography>
                            </Box>
                        </Box>
                    </>}
                    <br />
                    {/* Deliverable(s) List */}
                    {(selectedProject && deliverablesList) && <>
                        <p className="title">Deliverable(s) List</p>
                        <Box>
                            <GeneralTable
                                tableHeader={deliverableTableHeader}
                                tableBody={selectedProject?.deliverables!.map((deliverable, index) => <DeliverableRow key={index} deliverable={deliverable} index={index} />)}
                            />
                        </Box>
                    </>}
                </div>
            }
        />
    </>;
};

export default LecturerGroupManage;