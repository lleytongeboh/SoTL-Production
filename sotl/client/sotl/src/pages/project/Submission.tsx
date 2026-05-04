import { Button, FormControl, FormHelperText, IconButton, InputLabel, MenuItem, Select, TableCell, TablePagination, TableRow, TextField } from '@mui/material';
import ContentPanel from '../../components/ContentPanel';
import React, { useEffect, useRef } from 'react';
import { ClearOutlined, Comment, Delete, Download } from '@mui/icons-material';
import GeneralTable from '../../components/GeneralTable';
import { Project, Deliverable } from '../../features/student/project/models';
import { Deliverable as SubmissionDeliverable } from '../../features/lecturer/deliverables/models/index';
import { PopupProps } from '../../components/SuccessPopup';
import { useProject } from '../../features/student/project/context/ProjectContext';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import { deliverablesHooks } from '../../features/lecturer/deliverables/hooks/deliverablesHooks';
import { LoadingPopupProps } from '../../components/LoadingPopup';
import { Group } from '../../features/student/group/models';
import { useGroup } from '../../features/student/group/context/GroupContext';
import { projectHooks } from '../../features/student/project/hooks/projectHooks';
import { getStatus, statusComponent } from '../../pages/group/LecturerGroupManage';
import CommentPopup from '../../components/CommandPopup';
import ConfirmationPopup from '../../components/ConfirmationPopup';
import _ from 'lodash';

const Submission: React.FC = () => {
  const { selectedProject, setSelectedProject }: { selectedProject: Project, setSelectedProject: React.Dispatch<React.SetStateAction<Project>> } = useProject();
  const { selectedGroup }: { selectedGroup: Group } = useGroup();
  const { getDeliverablesList, error, loading } = deliverablesHooks();
  const { checkProject, submitDeliverable, downloadDeliverable, deleteDeliverable, error: pErr, loading: pLoad } = projectHooks();
  const navigate = useNavigate();

  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [file, setFile] = React.useState<File | null>(null);
  // deliverable when viewing comment
  const [pickedDeliverable, setPickedDeliverable] = React.useState<Deliverable | null>(null);
  const [commentPopup, setCommentPopup] = React.useState<boolean>(false);
  const [successPopup, setSuccessPopup] = React.useState<boolean>(false);
  const [errorPopup, setErrorPopup] = React.useState<boolean>(false);
  const [confirmationPopup, setConfirmationPopup] = React.useState<boolean>(false);
  const [deliverables, setDeliverables] = React.useState<SubmissionDeliverable[] | null>(null);
  const [validDeliverables, setValidDeliverables] = React.useState<SubmissionDeliverable[]>([]);
  const [validSubmit, setValidSubmit] = React.useState<boolean>(false);
  const deliverableTypeRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // deliverable on the drop down
  const [selectedDeliverable, setSelectedDeliverable] = React.useState<string>('');
  const tableHeaders = [
    { name: '#', center: false },
    { name: 'Submission Date', center: false },
    { name: 'Deliverable Name', center: false },
    { name: 'File Name', center: false },
    { name: 'Status', center: false },
    { name: 'Action(s)', center: true },
  ];

  const successPopupProps: PopupProps = {
    open: successPopup,
    content: 'Deliverable Submitted Successfully!',
    onClose: () => {
      setSuccessPopup(false);
    }
  };

  const errorPopupProps: PopupProps = {
    open: errorPopup,
    content: error || pErr!,
    onClose: () => {
      setErrorPopup(false);
      navigate('/student/project/details');
    }
  };

  const loadingPopupProps: LoadingPopupProps = {
    open: loading || pLoad
  };

  const onFileClear = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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

  const onSubmit = async () => {
    try {
      const selectedDeliverableId = validDeliverables.find((deliverable) => deliverable._id === selectedDeliverable)!._id;
      const response = await submitDeliverable(selectedProject._id!, selectedDeliverableId!, file!);
      if (response) {
        setSuccessPopup(true);
        setSelectedProject(response);
        setFile(null);
        fileInputRef.current!.value = '';
        setSelectedDeliverable('');
      }
    } catch (error) {
      setErrorPopup(true);
    }
  };

  const onDownload = async (deliverableId: string, fileName: string) => {
    try {
      await downloadDeliverable(selectedProject._id!, deliverableId, fileName);
    } catch (error) {
      setErrorPopup(true);
    }
  };

  const handleDeleteDeliverable = async () => {
    try {
      const project = await deleteDeliverable(selectedProject!._id!, pickedDeliverable!._id!);
      if (project) {
        setSelectedProject(project);
        setSuccessPopup(true);
        setFile(null);
        fileInputRef.current!.value = '';
        setSelectedDeliverable('');
      }
    } catch (error) {
      setErrorPopup(true);
    }
  };

  const fetchData = async () => {
    try {
      const response = await getDeliverablesList(selectedGroup.batch);
      const publicAndTimeFilter = response.filter((deliverable) => {
        return deliverable.isPublic && moment().isBetween(moment(deliverable.start_at), moment(deliverable.end_at), 'days', '[]');
      });
      const dependencyFilter = publicAndTimeFilter.filter((deliverable) => {
        if (deliverable.dependsOn === null || deliverable.dependsOn === undefined) {
          return true;
        }
        // dependency option
        const dOption = publicAndTimeFilter.find(e => e._id === deliverable.dependsOn);
        // submitted dependency
        const dependency = _.findLast(selectedProject.deliverables!, e => e.deliverable_id === deliverable.dependsOn);
        if (dOption && dependency) {
          if (dOption.approve) {
            return dependency.status === 1;
          }
          return true;
        }
        return false;
      });
      const submissionFilter = dependencyFilter.filter((deliverable) => {
        return selectedProject.deliverables!.every(e => {
          // if selected deliverable exist in project (aka submitted)
          if (e.deliverable_id === deliverable._id) {
            // if deliverable approve is on (aka needed aproval to complete)
            if (deliverable.approve) {
              // check if the status is 2 (Rejected), if yes, allow to submit again
              return e.status === 2;
            } else {
              // if deliverable approve is off (aka no need approval to complete)
              return false;
            }
          } else {
            // if selected deliverable does not exist in project (aka not submitted)
            return true;
          }
        });
      });
      setDeliverables(response);
      setValidDeliverables(submissionFilter);
    } catch (error) {
      setErrorPopup(true);
    }
  };

  const fetchLatestProject = async () => {
    try {
      const project = await checkProject(selectedGroup._id!);
      if (project) {
        setSelectedProject(project);
      }
    } catch (error) {
      setErrorPopup(true);
    }
  };

  const checkValid = () => {
    if (selectedDeliverable === '') {
      return false;
    }
    if (file === null) {
      return false;
    }
    return true;
  };

  useEffect(() => {
    setValidSubmit(checkValid());
  }, [selectedDeliverable, file]);

  useEffect(() => {
    fetchLatestProject();
  }, []);

  useEffect(() => {
    if (!selectedProject) {
      navigate('/student/project/details');
    } else {
      fetchData();
    }
  }, [selectedProject]);

  function DeliverableRow(props: { deliverable: Deliverable, index: number }) {
    const { deliverable, index } = props;
    const d = deliverables!.find(e => e._id == deliverable.deliverable_id);
    const status = getStatus(d!.approve, deliverable.status);
    return (
      <>
        <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
          <TableCell>
            {index + 1}
          </TableCell>
          <TableCell>{moment(deliverable.created_at).format('DD/MM/YYYY')}</TableCell>
          <TableCell>{d?.name ?? ""}</TableCell>
          <TableCell>{deliverable.name}</TableCell>
          <TableCell>{statusComponent(status)}</TableCell>
          <TableCell>
            <div className='flex justify-around'>
              <IconButton onClick={() => onDownload(deliverable._id!, deliverable.name)}><Download></Download></IconButton>
              {status === 'Rejected' &&
                <IconButton onClick={() => {
                  setCommentPopup(true);
                  setPickedDeliverable(deliverable);
                }}><Comment /></IconButton>
              }
              <IconButton onClick={() => {
                setPickedDeliverable(deliverable);
                setConfirmationPopup(true);
              }}><Delete /></IconButton>
            </div>
          </TableCell>
        </TableRow>
      </>
    );
  }

  return (
    <>
      <CommentPopup
        content={pickedDeliverable?.comment ?? ""}
        open={commentPopup}
        onClose={() => {
          setCommentPopup(false);
        }}
      />
      <ConfirmationPopup
        open={confirmationPopup}
        content='Are you sure you want to delete this deliverable?'
        onConfirm={() => {
          setConfirmationPopup(false);
          handleDeleteDeliverable();
        }}
        onClose={() => setConfirmationPopup(false)}
      />
      <ContentPanel
        title='Project Submission'
        successPopup={successPopupProps}
        errorPopup={errorPopupProps}
        loadingPopup={loadingPopupProps}
        content={
          <>
            <FormControl fullWidth>
              <InputLabel id='deliverable-type-label'>Project Deliverable Submission</InputLabel>
              <Select
                labelId='deliverable-type-label'
                value={selectedDeliverable}
                label='Project Deliverable Submission'
                inputRef={deliverableTypeRef}
                onChange={(e) => setSelectedDeliverable(e.target.value as string)}
                className='text-start'
              >
                {validDeliverables.map((deliverables, i) =>
                  <MenuItem key={i} value={deliverables._id}>{deliverables.name}</MenuItem>)}
              </Select>
              <br />
            </FormControl>
            <FormControl fullWidth>
              <TextField
                type='file'
                label='Project Proposal File'
                inputRef={fileInputRef}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  const maxSize = 20 * 1024 * 1024; // 20MB
                  if (event.target.files) {
                    if (event.target.files[0].size > maxSize) {
                      alert('File size must be less than 20MB');
                      fileInputRef.current!.value = '';
                    } else {
                      setFile(event.target.files[0]);
                    }
                  }
                }}
                InputProps={
                  {
                    endAdornment: <IconButton
                      onClick={onFileClear}
                      sx={{
                        '&:focus:not(:focus-visible)': {
                          outline: 'none',
                        },
                      }}><ClearOutlined /></IconButton>,
                  }
                }
                InputLabelProps={{ shrink: true }}
              >
              </TextField>  
              <FormHelperText>{"*File Must Be <= 20MB, Otherwise Please Submit A .txt File With OneDrive Link"}</FormHelperText>
              <br />
            </FormControl>
            <Button variant='contained' disabled={!validSubmit} onClick={onSubmit} color='success'>SUBMIT</Button>

            {/* Deliverable List */}
            {deliverables && <div className='text-start'>
              <br />
              <b className='title'>Deliverable(s) List</b>
              <br />
              <>
                <br />
                <GeneralTable
                  tableHeader={tableHeaders}
                  tableBody={
                    selectedProject.deliverables && selectedProject.deliverables.slice(page * rowsPerPage, (page + 1) * rowsPerPage).map((deliverable: Deliverable, index: number) => (
                      <DeliverableRow key={index + page * rowsPerPage} deliverable={deliverable} index={index + page * rowsPerPage} />
                    ))}
                />
                <TablePagination
                  component="div"
                  count={selectedProject.deliverables!.length}
                  page={page}
                  onPageChange={handleChangePage}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                />
              </>
            </div>}
          </>
        }
      />
    </>
  );
};

export default Submission;
