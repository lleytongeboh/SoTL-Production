import DataTable, { ExpanderComponentProps, TableColumn } from 'react-data-table-component';
import React from 'react';
import ContentPanel from '../../../../components/ContentPanel';
import { useGamificationHooks } from '../hooks/useGamificationHooks';
import { PopupProps } from '../../../../components/SuccessPopup';
import { LoadingPopupProps } from '../../../../components/LoadingPopup';
import { IconButton, Button } from '@mui/material';
import { Add, Refresh, ArrowDropUp, ArrowDropDown, Edit, Delete, Close, Done } from '@mui/icons-material';
import { BadgeList, Badge } from '../models';
import { useNavigate } from 'react-router-dom';
import _ from 'lodash';

const BadgeManagement = () => {
    const navigate = useNavigate();
    const { getBadgeList, updateBadgeOrderingAndRemove } = useGamificationHooks();
    const [badgeList, setBadgeList] = React.useState<BadgeList[]>([]);
    const originalBadgeList = React.useRef<BadgeList[]>([]);
    const [loading, setLoading] = React.useState<boolean>(false);
    const [error, setError] = React.useState<{ message: string, status: boolean }>({ message: '', status: false });
    const [success, setSuccess] = React.useState<{ status: boolean, message: string }>({ status: false, message: '' });
    const [isBadgeEdit, setIsBadgeEdit] = React.useState<{ isEdit: boolean, batch: string }>({ isEdit: false, batch: '' });
    const [canSave, setCanSave] = React.useState<boolean>(false);
    const removeBadgeItem = React.useRef<string[]>([]);

    const loadingPopupProps: LoadingPopupProps = {
        open: loading,
        onClose: () => setLoading(false)
    };

    const successPopupProps: PopupProps = {
        open: success.status,
        content: success.message,
        onClose: () => setSuccess({ status: false, message: '' })
    };

    const errorPopupProps: PopupProps = {
        open: error.status,
        content: error.message,
        onClose: () => setError({ message: '', status: false })
    };

    React.useEffect(() => {
        fetchData();
    }, []);

    React.useEffect(() => {
        if (!_.isEqual(badgeList, originalBadgeList.current)) {
            setCanSave(true);
        } else {
            setCanSave(false);
        }
    }, [badgeList])

    const fetchData = async () => {
        try {
            setLoading(true);
            const result = await getBadgeList();
            originalBadgeList.current = result;
            setBadgeList(result);
        } catch (error: any) {
            setError({ message: error.message, status: true });
        } finally {
            setLoading(false);
        }
    }

    const onAddButtonClick = (row: any) => {
        navigate(`badge/${encodeURIComponent(row.batch)}/add`);
    };

    const moveUp = (batch: string, badgeIndex: number) => {
        const badgeGroup = badgeList.find((bl) => bl.batch === batch);
        if (!badgeGroup || badgeIndex === 0) return; // No change if not found or first item

        const badges = [...badgeGroup.badges];
        [badges[badgeIndex - 1], badges[badgeIndex]] = [badges[badgeIndex], badges[badgeIndex - 1]];
        updateBadgeOrder(batch, badges);
    };

    const moveDown = (batch: string, badgeIndex: number) => {
        const badgeGroup = badgeList.find((bl) => bl.batch === batch);
        if (!badgeGroup || badgeIndex === badgeGroup.badges.length - 1) return; // No change if not found or last item

        const badges = [...badgeGroup.badges];
        [badges[badgeIndex], badges[badgeIndex + 1]] = [badges[badgeIndex + 1], badges[badgeIndex]];
        updateBadgeOrder(batch, badges);
    };

    const removeBadge = (batch: string, badgeIndex: number) => {
        const badgeGroup = badgeList.find((bl) => bl.batch === batch);
        if (!badgeGroup) return; // No change if not found

        const badges = badgeGroup.badges.filter((_, i) => i !== badgeIndex);
        updateBadgeOrder(batch, badges);
    };

    // Reassigns order numbers in ascending order based on the array position within the specific BadgeList item
    const updateBadgeOrder = (batch: string, updatedBadges: Badge[]) => {
        const newBadgeList = badgeList.map((bl) => {
            if (bl.batch === batch) {
                return {
                    ...bl,
                    badges: updatedBadges.map((badge, i) => ({
                        ...badge,
                        order: i + 1,
                    })),
                };
            }
            return bl;
        });
        setBadgeList(newBadgeList);
    };

    const columns: TableColumn<BadgeList>[] = [
        {
            name: 'No',
            selector: (_, rowIndex?: number) => (rowIndex !== undefined ? rowIndex + 1 : 0),
        },
        {
            name: 'Batch',
            selector: row => row.batch,
        },
        {
            name: 'Number of Student Affected',
            selector: row => row.studentNumber,
        },
        {
            name: 'Actions',
            cell: (row) => (
                <>
                    <IconButton sx={{ backgroundColor: 'lightgray' }} onClick={() => onAddButtonClick(row)}>
                        <Add />
                    </IconButton>
                </>
            ),
            ignoreRowClick: true // Prevents row click event from firing when clicking on the buttons
        }
    ];

    const onSaveEdit = async (row: any) => {
        try {
            setLoading(true);
            const payload = {
                batch: row.batch as string,
                badges: badgeList.find((bl) => bl.batch === row.batch)?.badges.map((x: Badge) => ({
                    _id: x._id,
                    order: x.order
                })) || []
            };
            const result = await updateBadgeOrderingAndRemove(payload);
            if (!result) {
                throw new Error('Failed to update badge ordering');
            }else{
                setSuccess({ status: true, message: 'Badge ordering updated successfully' });
                originalBadgeList.current = badgeList;
                setIsBadgeEdit({ isEdit: false, batch: '' });
                setCanSave(false);
            }
        } catch (error: any) {
            setError({ message: error.message, status: true });
        } finally {
            setLoading(false);
        }
    }

    const badgeColumns: TableColumn<Badge>[] = [
        {
            name: 'Order',
            selector: row => row.order,
        },
        {
            name: 'Badge Name',
            selector: row => row.name,
        },
        {
            name: 'Deliverable',
            cell: row => (
                <ul style={{ paddingLeft: '20px', margin: 0, listStyleType: 'disc' }}>
                    {row.deliverableCompletion.map((d, index) => (
                        <li key={index} className='text-left py-1'>{d.name}</li>
                    ))}
                </ul>
            ),
        },
        {
            name: 'Actions',
            cell: (row, index) => (
                <div
                    className={'flex flex-row items-center ' + (isBadgeEdit.isEdit && isBadgeEdit.batch === row.batch ? 'justify-evenly' : 'justify-start')}
                    style={{ width: '100%' }}
                >
                    {(isBadgeEdit.isEdit && isBadgeEdit.batch === row.batch) ? (
                        <div
                            className='flex flex-row justify-around items-center gap-4'
                            style={{ width: '100%' }}
                        >
                            <div
                                className='flex flex-row gap-4'
                            >
                                <IconButton onClick={() => moveDown(row.batch, index)} sx={{ backgroundColor: 'lightgray', width: 30, height: 30, borderRadius: 1 }}><ArrowDropDown /></IconButton>
                                <IconButton onClick={() => moveUp(row.batch, index)} sx={{ backgroundColor: 'lightgray', width: 30, height: 30, borderRadius: 1 }}><ArrowDropUp /></IconButton>
                            </div>
                            <IconButton sx={{
                                width: 30, height: 30,
                                '&:hover': {
                                    color: 'red',
                                }
                            }}
                                onClick={() => removeBadge(row.batch, index)}
                            ><Delete /></IconButton>
                        </div>

                    ) : (<Button onClick={() => navigate(`badge/${row._id}`)} sx={{ color: '#2196F3' }}>View</Button>)}
                </div>
            ),
            ignoreRowClick: true // Prevents row click event from firing when clicking on the buttons
        }
    ];

    const ExpandedComponent: React.FC<ExpanderComponentProps<BadgeList>> = ({ data }) => {
        return (
            <ContentPanel
                title='Badge'
                customActions={
                    (isBadgeEdit.isEdit && isBadgeEdit.batch === data.batch) ? (<div
                        className='flex flex-row justify-between items-center'
                        style={{ width: '10%' }}
                    >
                        <IconButton sx={{
                            backgroundColor: 'lightgray', color: 'inherit',
                            '&:hover': {
                                color: 'red',
                            }
                        }} onClick={() => {
                            removeBadgeItem.current = [];
                            setBadgeList(originalBadgeList.current);
                            setIsBadgeEdit({ isEdit: false, batch: '' })
                            setCanSave(false);
                        }}><Close /></IconButton>
                        <IconButton sx={{
                            backgroundColor: 'lightgray', color: 'inherit',
                            '&:hover': {
                                color: 'green',
                            }
                        }} disabled={!canSave} onClick={() => onSaveEdit(data)}><Done /></IconButton>
                    </div>) : (<IconButton sx={{ backgroundColor: 'lightgray' }} onClick={() => {
                        setCanSave(false);
                        setIsBadgeEdit({ isEdit: true, batch: data.batch })
                    }}><Edit /></IconButton>)
                }
                content={
                    <DataTable columns={badgeColumns} data={data.badges} customStyles={customStyles} />
                }
            />
        );
    };

    const customStyles = {
        headCells: {
            style: {
                backgroundColor: '#F6F6F6',  // Header background color
                color: 'black',              // Header text color
                fontSize: '16px',            // Optional: adjust font size
                fontWeight: 'bold',          // Optional: make text bold
            }
        }
    };


    return (
        <ContentPanel
            title="Badge Management"
            loadingPopup={loadingPopupProps}
            successPopup={successPopupProps}
            errorPopup={errorPopupProps}
            customActions={
                <IconButton sx={{ backgroundColor: 'lightgray' }} onClick={() => fetchData()}><Refresh /></IconButton>
            }
            content={
                <div>
                    <DataTable columns={columns} data={badgeList} expandableRows expandableRowsComponent={ExpandedComponent} pagination customStyles={customStyles} />
                </div>
            }
        />
    );
};

export default BadgeManagement;