import ContentPanel from "../../../../components/ContentPanel";
import React from "react";
import { useGamificationHooks } from "../hooks/useGamificationHooks";
import { BadgeCreated, Deliverable } from "../models";
import { PopupProps } from '../../../../components/SuccessPopup';
import { LoadingPopupProps } from '../../../../components/LoadingPopup';
import { WorkspacePremium, Close, Done } from '@mui/icons-material';
import { IconButton, Typography } from '@mui/material';
import SelectionTextBox from '../components/SelectionTextBox';
import SelectionDotListBox from '../components/SelectionDotListBox';
import EditableTextField from "../../../../components/EditableTextField";
import { getColorNameByHexCode, getEnumKeys, getValueByKey } from "../../../../utils/usableFunction";
import { COLORS } from "../../../../utils/constants";
import { useParams } from "react-router-dom";
import _ from 'lodash';

const AddBadge = () => {
    const { batch } = useParams();
    const decodedBatch = decodeURIComponent(batch || '');
    const { getDeliverableList, createBadge } = useGamificationHooks();
    const [badge, setBadge] = React.useState<BadgeCreated>({
        name: '',
        color: '',
        batch: decodedBatch as string,
        description: '',
        deliverableCompletion: []
    });
    const emptyBadge = React.useRef<BadgeCreated>({
        name: '',
        color: '',
        batch: decodedBatch as string,
        description: '',
        deliverableCompletion: []
    });
    const [loading, setLoading] = React.useState<boolean>(false);
    const [error, setError] = React.useState<{ status: boolean; message: string }>({ status: false, message: "" });
    const [success, setSuccess] = React.useState<{ status: boolean; message: string }>({ status: false, message: "" });
    const [isEdit, setIsEdit] = React.useState<boolean>(false);
    const [canSave, setCanSave] = React.useState<boolean>(false);
    const [deliverableList, setDeliverableList] = React.useState<Deliverable[]>([]);

    const loadingPopupProps: LoadingPopupProps = {
        open: loading,
        onClose: () => setLoading(false)
    };

    const successPopupProps: PopupProps = {
        open: success.status,
        content: success.message,
        onClose: () => setSuccess({ status: false, message: "" })
    };

    const errorPopupProps: PopupProps = {
        open: error.status,
        content: error.message,
        onClose: () => setError({ status: false, message: "" })
    };

    React.useEffect(() => {
        fetchDeliverables();
    }, []);

    // Input Validator
    React.useEffect(() => {
        if (!_.isEqual(badge, emptyBadge.current)) {
            setIsEdit(true);
            if (badge.name.length > 0 && badge.description.length > 0 && badge.color !== '') {
                setCanSave(true);
            } else {
                setCanSave(false);
            }
        } else {
            setIsEdit(false);
        }
    }, [badge]);

    const fetchDeliverables = async () => {
        try {
            const result = await getDeliverableList();
            setDeliverableList(result);
        } catch (error: any) {
            console.log(error);
        }
    };

    const onHandleSave = async () => {
        try {
            setLoading(true);
            const result = await createBadge(badge);
            if (result) {
                setSuccess({ status: true, message: 'Badge created successfully' });
                setBadge(emptyBadge.current);
            } else {
                throw new Error('Failed to create badge');
            }
        } catch (error: any) {
            console.log(error.message);
            setError({ status: true, message: error.message });
        } finally {
            setLoading(false);
        }
    };

    const deliverableNames = (deliverableList.length > 0) ? _.chain(deliverableList)
        .find((x: Deliverable) => x.name === (badge?.batch ?? ''))
        .get('deliverables', [])
        .filter((d) => !badge?.deliverableCompletion.includes(d.name))
        .map((d) => d.name)
        .value()
        : [];
    return (
        <ContentPanel
            title="Badge"
            titleIcon={<WorkspacePremium fontSize="large" />}
            hasBackButton={true}
            backLink={-1}
            loadingPopup={loadingPopupProps}
            successPopup={successPopupProps}
            errorPopup={errorPopupProps}
            content={
                <div
                    className="flex flex-col gap-4"
                >
                    <div
                        className="flex flex-row justify-end items-center"
                    >
                        {isEdit ? (
                            <div
                                className="flex flex-row gap-4"
                            >
                                <IconButton sx={{
                                    backgroundColor: 'lightgray', color: 'inherit',
                                    '&:hover': {
                                        color: 'red',
                                    }
                                }} onClick={() => {
                                    setBadge(emptyBadge.current);
                                    setIsEdit(false);
                                }}><Close /></IconButton>
                                <IconButton sx={{
                                    backgroundColor: 'lightgray', color: 'inherit',
                                    '&:hover': {
                                        color: 'green',
                                    }
                                }} onClick={() => {
                                    onHandleSave();
                                    setIsEdit(false)
                                }}
                                    disabled={!canSave}
                                ><Done /></IconButton>
                            </div>
                        ) : undefined
                        }
                    </div>
                    <div
                        className="flex flex-row justify-between items-center gap-4"
                    >
                        <Typography variant="inherit" className="text-left" sx={{ width: '30%' }}>Batch</Typography>
                        <Typography variant="inherit">:</Typography>
                        <Typography className="flex-1 text-left">{batch}</Typography>
                    </div>
                    <div
                        className="flex flex-row justify-between items-center gap-4"
                    >
                        <Typography variant="inherit" className="text-left" sx={{ width: '30%' }}>Name</Typography>
                        <Typography variant="inherit">:</Typography>
                        <EditableTextField
                            label="Name"
                            value={badge?.name || ''}
                            onChange={(s) => setBadge({ ...badge, name: s })}
                            isEdit={true}
                            className="flex-1 text-left"
                            helperText={(badge !== null && isEdit) ? (badge?.name?.length > 0 ? '' : 'Name is required') : ''}
                        />
                    </div>
                    <div
                        className="flex flex-row justify-between items-start gap-4"
                    >
                        <Typography variant="inherit" className="text-left" sx={{ width: '30%' }}>Description</Typography>
                        <Typography variant="inherit">:</Typography>
                        <EditableTextField
                            label="Description"
                            value={badge?.description || ''}
                            onChange={(s) => setBadge({ ...badge, description: s })}
                            isEdit={true}
                            className="flex-1 text-left"
                            textFieldProp={{ multiline: true, rows: 4 }}
                            helperText={(badge !== null && isEdit)? (badge?.description?.length > 0 ? '' : 'Description is required') : ''}
                        />
                    </div>
                    <div
                        className="flex flex-row justify-between items-start gap-4"
                    >
                        <Typography variant="inherit" className="text-left" sx={{ width: '30%' }}>Deliverables</Typography>
                        <Typography variant="inherit">:</Typography>
                        <SelectionDotListBox
                            isEdit={true}
                            labelId="deliverables"
                            label="Deliverables"
                            value={badge?.deliverableCompletion || []}
                            onAddDeliverableChange={(s) => setBadge({ ...badge, deliverableCompletion: [...badge.deliverableCompletion, s] })}
                            className="flex-1 text-left"
                            itemList={badge?.deliverableCompletion || []}
                            itemList2={deliverableNames}
                            onRemove={(x) => {
                                setBadge({ ...badge, deliverableCompletion: badge.deliverableCompletion.filter((d) => d !== x) });
                            }} />
                    </div>
                    <div
                        className="flex flex-row justify-between items-center gap-4"
                    >
                        <Typography variant="inherit" className="text-left" sx={{ width: '30%' }}>Badge Color</Typography>
                        <Typography variant="inherit">:</Typography>
                        <SelectionTextBox
                            isEdit={true}
                            labelId="badge-color"
                            label="Color"
                            value={getColorNameByHexCode(badge?.color || '', COLORS) || ''}
                            onChange={(s) => setBadge({ ...badge, color: getValueByKey(s, COLORS) || '' })}
                            className="flex-1 text-left"
                            itemList={getEnumKeys(COLORS)}
                        />
                    </div>
                    <div
                        className="flex flex-row justify-between items-center gap-4"
                    >
                        <Typography variant="inherit" className="text-left" sx={{ width: '30%' }}></Typography>
                        <Typography variant="inherit"></Typography>
                        <Typography className="text-left flex-1"><span ><WorkspacePremium sx={{ color: badge?.color, fontSize: '80px' }} /></span></Typography>
                    </div>
                </div >
            }
        />
    );
}

export default AddBadge;