import { useNavigate, useParams } from "react-router-dom";
import ContentPanel from "../../components/ContentPanel";
import { useEffect, useMemo, useState } from "react";
import { Box, Button, IconButton, Input, TableCell, TableRow, Tooltip } from "@mui/material";
import { Check, Clear, DescriptionOutlined, EditOutlined, KeyboardArrowLeft } from "@mui/icons-material";
import { PopupProps } from "../../components/SuccessPopup";
import GeneralTable, { HeaderProperties } from "../../components/GeneralTable";
import { MarkItem, Project } from "../../features/student/project/models";
import { projectHooks } from "../../features/student/project/hooks/projectHooks";
import { MarkingScheme, PROJECT_MARKING_SCHEME, STUDENT_MARKING_SCHEME } from "../../utils/constants";
import { LoadingPopupProps } from "../../components/LoadingPopup";
import ConfirmationPopup from "../../components/ConfirmationPopup";
import { Group, StudentMarkItem, TeamMember } from "../../features/student/group/models";
import { groupHooks } from "../../features/student/group/hooks/groupHooks";
import React from "react";

const LecturerMarkEdit: React.FC = () => {

    const { getProject, markProject, error, loading } = projectHooks();
    const { getGroup, getMembersMark, markStudent, error: gErr, loading: gLoad } = groupHooks();

    const { groupId } = useParams();
    const projectScheme = PROJECT_MARKING_SCHEME;
    const studentScheme = STUDENT_MARKING_SCHEME;
    const navigate = useNavigate();
    const tableHeaders: HeaderProperties[] = [
        {
            name: 'No',
            center: true,
        },
        {
            name: 'Topic',
            center: true,
        },
        {
            name: 'Deliverable',
            center: true,
        },
        {
            name: 'Overall Mark',
            center: true,
        },
        {
            name: 'Percentage (%)',
            center: true,
        },
    ];

    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [successPopup, setSuccessPopup] = useState<boolean>(false);
    const [errorPopup, setErrorPopup] = useState<boolean>(false);
    const [confirmPopup, setConfirmPopup] = useState<boolean>(false);
    const [projectIsEditing, setProjectIsEditing] = useState<boolean>(false);
    const [studentIsEditing, setStudentIsEditing] = useState<{ [key: string]: boolean } | null>(null);
    const [confirmCallback, setConfirmCallback] = useState<() => void>(() => { });
    const [projectInputValues, setProjectInputValues] = useState<{ [key: number]: number }>({});
    const [pInputSnapShot, setPInputSnapShot] = useState<{ [key: number]: number }>({});
    const [studentsMark, setStudentsMark] = useState<{ [key: string]: { marked: boolean, items: StudentMarkItem[] } } | null>(null);
    const [sInputSnapShot, setSInputSnapShot] = useState<{ [key: string]: { marked: boolean, items: StudentMarkItem[] } }>({});

    const successPopupProps: PopupProps = {
        open: successPopup,
        content: 'Marked successfully!',
        onClose: () => {
            setSuccessPopup(false);
            fetchData();
        }
    };

    const errorPopupProps: PopupProps = {
        open: errorPopup,
        content: error ?? gErr ?? 'An error occurred!',
        onClose: () => {
            setErrorPopup(false);
            navigate(-1);
        }
    };

    const loadingPopupProps: LoadingPopupProps = {
        open: loading || gLoad
    };

    const handleMarkProject = async () => {
        try {
            const data: MarkItem[] = projectScheme.map((scheme): MarkItem => {
                return {
                    //topic: scheme.topic,
                    deliverables_type: scheme.deliverable_type,
                    overall_mark: projectInputValues[scheme.deliverable_type]
                }
            });
            const response = await markProject(selectedGroup!.project!, data);
            if (response) {
                setSuccessPopup(true);
            }
        } catch (error) {
            setErrorPopup(true);
        }
    };

    const handleMarkStudent = async (studentId: string) => {
        try {
            const data = studentsMark![studentId];
            const response = await markStudent(studentId, selectedGroup?.batch!, data.items);
            if (response) {
                setSuccessPopup(true);
            }
        } catch (error) {
            setErrorPopup(true);
        }
    };

    const calculateTotalPercentage = useMemo(() => {
        return projectScheme.reduce((acc, scheme) => {
            const mark = projectInputValues[scheme.deliverable_type];
            return acc + (mark * scheme.weightage / scheme.total_mark);
        }, 0);
    }, [projectInputValues]);

    const fetchData = async () => {
        try {
            const group = await getGroup(groupId!);
            const membersMark = await getMembersMark(groupId!);
            const project = await getProject(group.project!);

            if (group && membersMark && project) {
                const values: { [key: number]: number } = projectScheme.reduce((acc, scheme) => {
                    const markItem = (project!.mark_items ?? []).find(item => {
                        return item.deliverables_type === scheme.deliverable_type;
                    });
                    return { ...acc, [scheme.deliverable_type]: markItem?.overall_mark ?? 0 };
                }, {});
                setProjectInputValues(values);
                setPInputSnapShot(values);
                setSelectedProject(project);
                setSelectedGroup(group);
                setStudentsMark(membersMark);
                setSInputSnapShot(membersMark);
                setStudentIsEditing(Object.fromEntries(group.team_members.map(e => [e.student_id!, false])));
            } else {
                throw new Error('An error occurred');
            }
        } catch (error) {
            setErrorPopup(true);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const projectTable = useMemo(() => {
        const marked: boolean = selectedProject?.mark_items !== null && selectedProject?.mark_items !== undefined && selectedProject!.mark_items!.length > 0;

        const customInput = (scheme: MarkingScheme, mark: number) => {
            const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                const value = parseInt(e.target.value);
                const key = parseInt(e.target.name);
                if (Number.isNaN(value)) {
                    setProjectInputValues({ ...projectInputValues, [key]: 0 });
                } else {
                    if (value > scheme.total_mark) {
                        setProjectInputValues({ ...projectInputValues, [key]: scheme.total_mark });
                    } else {
                        setProjectInputValues({ ...projectInputValues, [key]: value });
                    }
                }
            }

            return <Input
                value={mark.toFixed(0)}
                name={scheme.deliverable_type.toString()}
                size="small"
                type="number"
                onChange={handleInputChange}
                inputProps={{
                    min: 0,
                    max: 10
                }}>
            </Input>
        };

        return <>
            <GeneralTable tableHeader={tableHeaders} tableBody={
                projectScheme.map((scheme, index) => {
                    const mark = projectInputValues[scheme.deliverable_type];
                    return <TableRow key={"project row" + index}>
                        <TableCell align='center'>{index + 1}</TableCell>
                        <TableCell align='center'>{scheme.topic}</TableCell>
                        <TableCell align='center'>{scheme.deliverable}</TableCell>
                        <TableCell align='center'>
                            {projectIsEditing ? customInput(scheme, mark) : marked ? mark : "-"}
                            {" / " + scheme.total_mark}
                        </TableCell>
                        <TableCell align='center'>{mark * scheme.weightage / scheme.total_mark} / {scheme.weightage}</TableCell>
                    </TableRow>
                })
            } />
            <br />
            <Box textAlign={'end'}>
                <p>TOTAL PERCENTAGE (%)</p>
                <p>{calculateTotalPercentage} / 70</p>
            </Box>
        </>
    }, [selectedProject, projectInputValues, projectIsEditing]);

    const studentTable = (member: TeamMember) => {
        const studentMark = studentsMark![member.student_id!];
        const total = studentMark.items.reduce((acc, item) => {
            const scheme = studentScheme.find(scheme => scheme.deliverable_type === item.type);
            return acc + item.mark_value * scheme!.weightage / scheme!.total_mark;
        }, 0);

        const customInput = (scheme: MarkingScheme, mark: number) => {
            const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                const value = parseInt(e.target.value);
                const key = parseInt(e.target.name);

                if (Number.isNaN(value)) {
                    setStudentsMark({ ...studentsMark, [member.student_id!]: { marked: studentMark.marked, items: studentMark.items.map(item => item.type === key ? { ...item, mark_value: 0 } : item) } });
                } else {
                    if (value > scheme.total_mark) {
                        setStudentsMark({ ...studentsMark, [member.student_id!]: { marked: studentMark.marked, items: studentMark.items.map(item => item.type === key ? { ...item, mark_value: scheme.total_mark } : item) } });
                    } else {
                        setStudentsMark({ ...studentsMark, [member.student_id!]: { marked: studentMark.marked, items: studentMark.items.map(item => item.type === key ? { ...item, mark_value: value } : item) } });
                    }
                }
            };

            return <Input
                value={mark.toFixed(0)}
                name={scheme.deliverable_type.toString()}
                size="small"
                type="number"
                onChange={handleInputChange}
                inputProps={{
                    min: 0,
                    max: 10
                }}>
            </Input>
        };

        return <>
            <GeneralTable tableHeader={tableHeaders} tableBody={
                studentScheme.map((scheme, index) => {
                    const mark = studentMark?.items.find(item => item.type === scheme.deliverable_type)?.mark_value ?? 0;
                    return <TableRow key={"student row" + index}>
                        <TableCell align='center'>{index + 1}</TableCell>
                        <TableCell align='center'>{scheme.topic}</TableCell>
                        <TableCell align='center'>{scheme.deliverable}</TableCell>
                        <TableCell align='center'>
                            {studentIsEditing![member.student_id!] ? customInput(scheme, mark) : studentMark.marked ? mark : "-"}
                            {" / " + scheme.total_mark}
                        </TableCell>
                        <TableCell align='center'>{mark * scheme.weightage / scheme.total_mark} / {scheme.weightage}</TableCell>
                    </TableRow>
                })
            } />
            <br />
            <Box textAlign={'end'}>
                <p>TOTAL PERCENTAGE (%)</p>
                <p>{calculateTotalPercentage + total} / 100</p>
            </Box>
        </>
    };

    return (
        <>
            <ConfirmationPopup
                open={confirmPopup}
                content={"Are you sure?"}
                onClose={() => setConfirmPopup(false)}
                onConfirm={() => {
                    confirmCallback();
                    setConfirmPopup(false);
                }}
            />
            {/* Mark Project */}
            <ContentPanel
                title="Mark Project"
                removeTitleRow
                errorPopup={errorPopupProps}
                successPopup={successPopupProps}
                loadingPopup={loadingPopupProps}
                content={
                    <>
                        <Box textAlign='start'>
                            <Button variant="contained" onClick={() => navigate(-1)} startIcon={<KeyboardArrowLeft />} >BACK</Button>
                        </Box>
                        <br />
                        <Box display={'flex'} justifyContent={'space-between'}>
                            <p className="title">{"Mark Project " + selectedProject?.title}</p>
                            <Box display={'flex'} gap={1}>
                                {projectIsEditing ?
                                    <>
                                        <IconButton onClick={() => {
                                            setConfirmCallback(() => {
                                                return () => {
                                                    setProjectInputValues(pInputSnapShot);
                                                    setProjectIsEditing(false);
                                                }
                                            });
                                            setConfirmPopup(true);
                                        }}><Clear color="error" /></IconButton>
                                        <IconButton onClick={() => {
                                            setConfirmCallback(() => {
                                                return () => {
                                                    handleMarkProject();
                                                    setProjectIsEditing(false);
                                                }
                                            });
                                            setConfirmPopup(true);
                                        }}><Check color="success" /></IconButton>
                                    </> :
                                    <Tooltip title="Edit"><IconButton onClick={() => {
                                        setProjectIsEditing(true);
                                    }}><EditOutlined /></IconButton></Tooltip>}
                                <Tooltip title="View Project">
                                    <IconButton onClick={() => {
                                        navigate("/lecturer/group/manage/" + groupId);
                                    }}><DescriptionOutlined /></IconButton>
                                </Tooltip>
                            </Box>
                        </Box>
                        <br />
                        {selectedProject && projectTable}
                    </>
                }
            />
            <br />
            {studentsMark && studentIsEditing && selectedGroup?.team_members.map((e, i) => {
                return <React.Fragment key={"student" + i}>
                    <ContentPanel
                        title={`${i + 1}. Mark Student ${e.name}`}
                        customActions={
                            <>
                                <Box display={'flex'} gap={1}>
                                    {studentIsEditing![e.student_id!] ?
                                        <>
                                            <IconButton onClick={() => {
                                                setConfirmCallback(() => {
                                                    return () => {
                                                        setStudentsMark(sInputSnapShot);
                                                        setStudentIsEditing({ ...studentIsEditing, [e.student_id!]: false });
                                                    }
                                                });
                                                setConfirmPopup(true);
                                            }}><Clear color="error" /></IconButton>
                                            <IconButton onClick={() => {
                                                setConfirmCallback(() => {
                                                    return () => {
                                                        handleMarkStudent(e.student_id!);
                                                        setStudentIsEditing({ ...studentIsEditing, [e.student_id!]: false });
                                                    }
                                                });
                                                setConfirmPopup(true);
                                            }}><Check color="success" /></IconButton>
                                        </> :
                                        <Tooltip title="Edit"><IconButton onClick={() => {
                                            setStudentIsEditing({ ...studentIsEditing, [e.student_id!]: true });
                                        }}><EditOutlined /></IconButton></Tooltip>}
                                    <Tooltip title="View Profile">
                                        <IconButton onClick={() => {
                                            navigate(`/lecturer/user-management/student/${e.student_id}`);
                                        }}><DescriptionOutlined /></IconButton>
                                    </Tooltip>
                                </Box>
                            </>
                        }
                        content={
                            <>
                                {studentsMark && studentTable(e)}
                            </>
                        }
                    />
                    <br />
                </React.Fragment>
            })}
        </>
    );
};

export default LecturerMarkEdit;