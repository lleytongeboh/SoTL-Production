import { Button, FormControl, FormHelperText, Grid, InputLabel, MenuItem, Select, TextField } from "@mui/material";
import ContentPanel from "../../components/ContentPanel";
import React, { useEffect, useMemo } from "react";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import moment, { Moment } from "moment";
import { deliverablesHooks } from "../../features/lecturer/deliverables/hooks/deliverablesHooks";
import { useNavigate, useParams } from "react-router-dom";
import { PopupProps } from "@components/SuccessPopup";
import { Deliverable } from "src/features/lecturer/deliverables/models";
import { LoadingPopupProps } from "@components/LoadingPopup";
import { batchStudentHooks } from "../../features/lecturer/user/hooks/batchStudentHooks";
import { Batch } from "../../features/auth/context/AuthContext";
import { useFeedbackDialog } from "../../context/FeedbackDialog";

interface LecturerProjectDeliverablesProps {
    isEdit: boolean;
}

const LecturerProjectDeliverablesCreate: React.FC<LecturerProjectDeliverablesProps> = ({ isEdit }) => {
    const [name, setName] = React.useState<string>('');
    const [batch, setBatch] = React.useState<string | null>(null);
    const [startDate, setStartDate] = React.useState<Moment | null>(null);
    const [dueDate, setDueDate] = React.useState<Moment | null>(null);
    const [approve, setApprove] = React.useState<boolean>(false);
    const [isPublic, setIsPublic] = React.useState<boolean>(false);
    const [dependsOn, setDependsOn] = React.useState<string>("-");
    const [validCreate, setValidCreate] = React.useState(false);
    const [errorPopup, setErrorPopup] = React.useState(false);
    const [successPopup, setSuccessPopup] = React.useState(false);
    const [deliverableList, setDeliverableList] = React.useState<Deliverable[]>([]);
    const [batchList, setBatchList] = React.useState<Batch[] | null>(null);
    const { setError } = useFeedbackDialog();

    const { getDeliverable, getDeliverablesList, createDeliverable, editDeliverable, error, loading } = deliverablesHooks();
    const { getBatchList, hookLoading, hookError } = batchStudentHooks();


    const { deliverableId } = useParams();

    const navigate = useNavigate();
    const errorPopupProps: PopupProps = {
        open: errorPopup,
        onClose: () => {
            setErrorPopup(false);
            navigate('/lecturer/project-deliverables');
        },
        content: error || hookError || "An error occurred!"
    };
    const successPopupProps: PopupProps = {
        open: successPopup,
        onClose: () => {
            setSuccessPopup(false);
            navigate('/lecturer/project-deliverables');
        },
        content: "Deliverable " + (isEdit ? "editted" : "created") + " successfully!"
    };

    const loadingPopupProps: LoadingPopupProps = {
        open: loading || hookLoading,
    };

    const validateCreate = () => {
        if (name.length > 0 && batch!.length > 0 && (startDate && dueDate ? startDate.isSameOrBefore(dueDate) : true)) {
            setValidCreate(true);
        } else {
            setValidCreate(false);
        }
    };

    const handleCreate = async () => {
        try {
            const deliverable: Deliverable = {
                _id: deliverableId,
                name,
                batch: batch!,
                start_at: startDate?.toDate(),
                end_at: dueDate?.toDate(),
                approve,
                isPublic,
                dependsOn: dependsOn === '-' ? undefined : dependsOn
            };
            const response = isEdit ? await editDeliverable(deliverable) : await createDeliverable(deliverable);
            if (response) {
                setSuccessPopup(true);
            }
        } catch (error) {
            setErrorPopup(true);
        }
    };

    const fetchData = async () => {
        try {
            const response = await getDeliverable(deliverableId!);
            setName(response.name);
            setBatch(response.batch);
            setStartDate(response.start_at ? moment(response.start_at) : null);
            setDueDate(response.end_at ? moment(response.end_at) : null);
            setApprove(response.approve);
            setIsPublic(response.isPublic);
            setDependsOn(response.dependsOn ?? '-');
        } catch (error) {
            setErrorPopup(true);
        }
    };

    const fetchDeliverablesList = async () => {
        try {
            const response = await getDeliverablesList();
            setDeliverableList(response.filter(d => d._id !== deliverableId));
        } catch (error) {
            setErrorPopup(true);
        }
    };

    const fetchBatchList = async () => {
        try {
            const response = await getBatchList();
            if(response.length === 0){
                setError({status: true, message:"No batch found, please create a batch first."});
                navigate("/lecturer/project-deliverables");
            }
            setBatchList(response);
            setBatch(prev => prev ? prev : response[0].batch);
        } catch (error) {
            setErrorPopup(true);
        }
    }

    const filteredDeliverables = useMemo(() => deliverableList.filter(d => d.batch === batch), [batch]);

    useEffect(() => {
        validateCreate();
    }, [name, batch, startDate, dueDate]);

    useEffect(() => {
        fetchDeliverablesList();
        fetchBatchList();
        if (isEdit) {
            fetchData();
        }
    }, []);

    return <>
        <ContentPanel
            title={isEdit ? "Edit Project Deliverable" : "Create Project Deliverable"}
            hasBackButton
            backLink="/lecturer/project-deliverables"
            errorPopup={errorPopupProps}
            successPopup={successPopupProps}
            loadingPopup={loadingPopupProps}
            content={
                <>
                    <Grid container rowSpacing={3} columnSpacing={4}>
                        {/* Deliverable Name */}
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <TextField
                                    id="deliverable-name"
                                    label="Deliverable Name"
                                    variant="outlined"
                                    value={name}
                                    inputProps={{ maxLength: 100 }}
                                    onChange={(e) => setName(e.target.value)}
                                    fullWidth
                                    required
                                />
                                <FormHelperText>{name.length}/100</FormHelperText>
                            </FormControl>
                        </Grid>
                        <>
                            {/* Batch */}
                            <Grid item xs={6}>
                                <FormControl fullWidth>
                                    <InputLabel id='batch-select-label'>Batch</InputLabel>
                                    {(batchList && batch) && <Select
                                        labelId="batch-select-label"
                                        value={batch ?? ""}
                                        label="Batch"
                                        onChange={(e) => setBatch(e.target.value as string)}
                                    >
                                        {/* <MenuItem value="24/25">24/25</MenuItem> */}
                                        {batchList.map((batch, i) => <MenuItem key={i} value={batch.batch}>{batch.batch}</MenuItem>)}
                                    </Select>}
                                </FormControl>
                            </Grid>
                            {/* Approve */}
                            <Grid item xs={6}>
                                <FormControl fullWidth>
                                    <InputLabel id='approve-select-label'>Approve</InputLabel>
                                    <Select
                                        labelId="approve-select-label"
                                        value={approve}
                                        label="Approve"
                                        disabled={isEdit}
                                        onChange={(e) => setApprove(e.target.value as boolean)}
                                    >
                                        <MenuItem value="true">Yes</MenuItem>
                                        <MenuItem value="false">No</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                        </>
                        <>
                            {/* Start Date */}
                            <Grid item xs={6}>
                                <FormControl fullWidth>
                                    <LocalizationProvider dateAdapter={AdapterMoment}>
                                        <DatePicker
                                            label="Start Date"
                                            format="DD/MM/YYYY"
                                            value={startDate}
                                            maxDate={dueDate ?? undefined}
                                            onChange={(newValue) => setStartDate(newValue)}
                                        />
                                    </LocalizationProvider>
                                    <FormHelperText>*Optional</FormHelperText>
                                </FormControl>
                            </Grid>
                            {/* Due Date */}
                            <Grid item xs={6}>
                                <FormControl fullWidth>
                                    <LocalizationProvider dateAdapter={AdapterMoment}>
                                        <DatePicker
                                            label="Due Date"
                                            format="DD/MM/YYYY"
                                            value={dueDate}
                                            minDate={startDate ?? undefined}
                                            onChange={(newValue) => setDueDate(newValue)}
                                        />
                                    </LocalizationProvider>
                                    <FormHelperText>*Optional</FormHelperText>
                                </FormControl>
                            </Grid>
                        </>
                        <>
                            {/* Public */}
                            <Grid item xs={6}>
                                <FormControl fullWidth>
                                    <InputLabel id='public-select-label'>Public</InputLabel>
                                    <Select
                                        labelId="public-select-label"
                                        value={isPublic}
                                        label="Public"
                                        onChange={(e) => setIsPublic(e.target.value as boolean)}
                                    >
                                        <MenuItem value="true">Yes</MenuItem>
                                        <MenuItem value="false">No</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            {/* Depends On */}
                            <Grid item xs={6}>
                                <FormControl fullWidth>
                                    <InputLabel id='dependsOn-select-label'>Depends On</InputLabel>
                                    {filteredDeliverables && <Select
                                        labelId="dependsOn-select-label"
                                        value={dependsOn}
                                        label="Depends On"
                                        disabled={isEdit}
                                        onChange={(e) => setDependsOn(e.target.value)}
                                    >
                                        <MenuItem value="-">None</MenuItem>
                                        {filteredDeliverables.map((deliverable, i) => <MenuItem key={i} value={deliverable._id}>{deliverable.name}</MenuItem>)}
                                    </Select>}
                                </FormControl>
                            </Grid>
                        </>
                    </Grid>
                    <br />
                    <Button variant='contained' onClick={handleCreate} disabled={!validCreate} color="success">{isEdit ? "SAVE" : "CREATE"}</Button>
                </>
            }
        />
    </>
};

export default LecturerProjectDeliverablesCreate;