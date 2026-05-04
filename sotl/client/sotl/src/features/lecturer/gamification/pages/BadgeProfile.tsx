import ContentPanel from "../../../../components/ContentPanel";
import React from "react";
import { useGamificationHooks } from "../hooks/useGamificationHooks";
import { Badge, Deliverable } from "../models";
import { useParams } from "react-router-dom";
import { PopupProps } from '../../../../components/SuccessPopup';
import { LoadingPopupProps } from '../../../../components/LoadingPopup';
import { WorkspacePremium, Close, Done, Edit } from '@mui/icons-material';
import { IconButton, Typography } from '@mui/material';
import SelectionTextBox from '../components/SelectionTextBox';
import SelectionDotListBox from '../components/SelectionDotListBox';
import EditableTextField from "../../../../components/EditableTextField";
import { getColorNameByHexCode, getEnumKeys, getValueByKey } from "../../../../utils/usableFunction";
import { COLORS } from "../../../../utils/constants";
import _ from 'lodash';

const BadgeProfile = () => {
    const { badgeId } = useParams();
    const { getBadge, getDeliverableList, saveBadge } = useGamificationHooks();
    const originalBadge = React.useRef<Badge | null>(null);
    const [badge, setBadge] = React.useState<Badge | null>(null);
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
        fetchData();
    }, []);

    React.useEffect(() => {
        fetchDeliverables();
    }, []);

    // Input Validator
    React.useEffect(() => {
        if (badge !== null && originalBadge.current !== null) {
            if ((badge.name !== originalBadge.current?.name && badge.name.length > 0) || (badge.description !== originalBadge.current?.description && badge.description.length > 0) || (badge.color !== originalBadge.current?.color) || (badge.deliverableCompletion.length !== originalBadge.current?.deliverableCompletion.length)) {
                setCanSave(true);
            }
            if ((badge.name === originalBadge.current.name && badge.description === originalBadge.current.description && badge.color === originalBadge.current.color && _.isEqual(badge, originalBadge.current)) || badge.name.length === 0 || badge.description.length === 0) {
                setCanSave(false);
            }
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

    const fetchData = async () => {
        try {
            if (!badgeId) {
                throw new Error("Invalid badge id");
            }
            const badge = await getBadge(badgeId);
            originalBadge.current = badge;
            setBadge(badge);
            return badge;
        } catch (error: any) {
            console.log(error);
        }
    };

    const onHandleSave = async () => {
        try {
            if (badge === null || originalBadge.current === null) {
                throw new Error("Badge is not found");
            }
            if(badgeId === null || badgeId === undefined){
                throw new Error("Invalid Badge ID");
            }
            const payload: { [key: string]: any } = {};
            if (badge.name !== originalBadge.current?.name) {
                payload['name'] = badge.name;
            }
            if (badge.description !== originalBadge.current?.description) {
                payload['description'] = badge.description;
            }
            if (badge.color !== originalBadge.current?.color) {
                payload['color'] = badge.color;
            }
            payload['deliverableCompletion'] = badge.deliverableCompletion.map((d) => d.name);
            console.log('payload:', payload);
            setLoading(true);
            const result = await saveBadge(badgeId, payload);
            if(result){
                setSuccess({ status: true, message: "Badge Had Saved Successfully!" });    
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
        .filter((d) => !badge?.deliverableCompletion.map((dc) => dc.name).includes(d.name))
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
                                    setBadge(originalBadge.current);
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
                        ) : (<IconButton sx={{ backgroundColor: 'lightgray' }} onClick={() => setIsEdit(true)}><Edit /></IconButton>)
                        }
                    </div>
                    <div
                        className="flex flex-row justify-between items-center gap-4"
                    >
                        <Typography variant="inherit" className="text-left" sx={{ width: '30%' }}>Batch</Typography>
                        <Typography variant="inherit">:</Typography>
                        <Typography className="text-left flex-1">{badge?.batch || ''}</Typography>
                    </div>
                    <div
                        className="flex flex-row justify-between items-center gap-4"
                    >
                        <Typography variant="inherit" className="text-left" sx={{ width: '30%' }}>Name</Typography>
                        <Typography variant="inherit">:</Typography>
                        <EditableTextField
                            label="Name"
                            value={badge?.name || ''}
                            onChange={(s) => setBadge(badge ? { ...badge, name: s } : null)}
                            isEdit={isEdit}
                            className="flex-1 text-left"
                            helperText={badge !== null ? (badge?.name?.length > 0 ? '' : 'Name is required') : ''}
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
                            onChange={(s) => setBadge(badge ? { ...badge, description: s } : null)}
                            isEdit={isEdit}
                            className="flex-1 text-left"
                            textFieldProp={{ multiline: true, rows: 4 }}
                            helperText={badge !== null ? (badge?.description?.length > 0 ? '' : 'Description is required') : ''}
                        />
                    </div>
                    <div
                        className="flex flex-row justify-between items-start gap-4"
                    >
                        <Typography variant="inherit" className="text-left" sx={{ width: '30%' }}>Deliverables</Typography>
                        <Typography variant="inherit">:</Typography>
                        <SelectionDotListBox
                            isEdit={isEdit}
                            labelId="deliverables"
                            label="Deliverables"
                            value={badge?.deliverableCompletion.map((d) => d.name) || []}
                            onAddDeliverableChange={(s) => setBadge(badge ? { ...badge, deliverableCompletion: [...badge.deliverableCompletion, { _id: '', name: s }] } : null)}
                            className="flex-1 text-left"
                            itemList={badge?.deliverableCompletion.map((d) => d.name) || []}
                            itemList2={deliverableNames}
                            onRemove={(x) => {
                                setBadge(badge ? { ...badge, deliverableCompletion: badge.deliverableCompletion.filter((d) => d.name !== x) } : null);
                            }} />
                    </div>
                    <div
                        className="flex flex-row justify-between items-center gap-4"
                    >
                        <Typography variant="inherit" className="text-left" sx={{ width: '30%' }}>Badge Color</Typography>
                        <Typography variant="inherit">:</Typography>
                        <SelectionTextBox
                            isEdit={isEdit}
                            labelId="badge-color"
                            label="Color"
                            value={getColorNameByHexCode(badge?.color || '', COLORS) || ''}
                            onChange={(s) => setBadge(badge ? { ...badge, color: getValueByKey(s, COLORS) || '' } : null)}
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

export default BadgeProfile;