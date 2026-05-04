import { Deliverable } from "src/features/lecturer/deliverables/models";
import ContentPanel from "../../components/ContentPanel";
import { DeleteOutlined, Edit, Visibility, VisibilityOff } from "@mui/icons-material";
import { Box, Button, IconButton } from "@mui/material";
import React, { useEffect } from "react";
import { deliverablesHooks } from "../../features/lecturer/deliverables/hooks/deliverablesHooks";
import { Link, useLocation, useNavigate } from "react-router-dom";
import moment from "moment";
import { PopupProps } from "../../components/SuccessPopup";
import ConfirmationPopup from "../../components/ConfirmationPopup";
import { DataGrid, GridColDef, useGridApiRef } from "@mui/x-data-grid";
import _ from "lodash";

type DeliverableWithNo = Deliverable & { no: number };

const LecturerProjectDeliverablesManagement: React.FC = () => {
    const [errorPopup, setErrorPopup] = React.useState(false);
    const [deliverableList, setDeliverableList] = React.useState<DeliverableWithNo[]>([]);
    const [confirmationPopup, setConfirmationPopup] = React.useState(false);
    const [selectedDeliverable, setSelectedDeliverable] = React.useState<Deliverable | null>(null);
    const [selectedAction, setSelectedAction] = React.useState<"Delete" | "TogglePublic" | null>(null);

    const { getDeliverablesList, editDeliverable, deleteDeliverable, error } = deliverablesHooks();
    const navigate = useNavigate();
    const location = useLocation();
    const apiRef = useGridApiRef();

    const columns: GridColDef<(DeliverableWithNo[])[number]>[] = [
        {
            field: 'no',
            headerName: '#'
        },
        { field: 'batch', headerName: 'Batch' },
        { field: 'name', headerName: 'Deliverable Name' },
        { field: 'start_at', headerName: 'Start Date', valueFormatter: (value) => value ? moment(value).format('DD/MM/YYYY').toString() : "Null" },
        { field: 'end_at', headerName: 'Due Date', valueFormatter: (value) => value ? moment(value).format('DD/MM/YYYY').toString() : "Null" },
        {
            field: 'actions',
            headerName: 'Actions(s)',
            sortable: false,
            filterable: false,
            hideable: false,
            headerAlign: 'center',
            renderCell: (params) => (
                <Box
                    display="flex"
                    justifyContent="space-around"
                    alignItems="center"  // Ensures icons are centered vertically
                    width="100%"
                    height="100%">  {/* Ensures full height of the cell */}
                    <IconButton
                        sx={{ backgroundColor: 'lightgray' }}
                        onClick={() => {
                            setSelectedDeliverable(params.row);
                            setSelectedAction("TogglePublic");
                            setConfirmationPopup(true);
                        }}>
                        {params.row.isPublic ? <Visibility /> : <VisibilityOff />}
                    </IconButton>
                    <IconButton
                        sx={{ backgroundColor: 'lightgray' }}
                        onClick={() => navigate('edit/' + params.row._id)}>
                        <Edit />
                    </IconButton>
                    <IconButton
                        sx={{ backgroundColor: 'lightgray' }}
                        onClick={() => {
                            setSelectedDeliverable(params.row);
                            setSelectedAction("Delete");
                            setConfirmationPopup(true);
                        }}>
                        <DeleteOutlined />
                    </IconButton>
                </Box>
            ),

        },
    ];

    const errorPopupProps: PopupProps = {
        open: errorPopup,
        onClose: () => {
            setErrorPopup(false);
        },
        content: error!,
    };

    const handleDelete = async () => {
        try {
            if (selectedDeliverable?._id) {
                const reponse = await deleteDeliverable(selectedDeliverable._id);
                if (reponse) {
                    setDeliverableList(deliverableList.filter((deliverable) => deliverable._id !== selectedDeliverable._id));
                }
            }
        } catch (error) {
            setErrorPopup(true);
        }
    };

    const handleTogglePublic = async () => {
        try {
            const updatedDeliverable = { ...selectedDeliverable!, isPublic: !selectedDeliverable?.isPublic };
            const response = await editDeliverable(updatedDeliverable);
            if (response) {
                fetchData();
            }
        } catch (error) {
            setErrorPopup(true);
        }
    };

    const fetchData = async () => {
        try {
            const response = await getDeliverablesList();
            const withNo = _.map(response, (obj, i) => _.assign({}, obj, { no: i + 1 }));
            setDeliverableList(withNo);
        } catch (error) {
            setErrorPopup(true);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        apiRef.current?.autosizeColumns(
            {
                expand: true,
                includeHeaders: true,
            }
        );
    }, [deliverableList, confirmationPopup, location.key]);

    return <>
        <ConfirmationPopup
            open={confirmationPopup}
            onClose={() => setConfirmationPopup(false)}
            onConfirm={() => {
                if (selectedAction === "Delete") {
                    handleDelete();
                } else if (selectedAction === "TogglePublic") {
                    handleTogglePublic();
                }
                setConfirmationPopup(false);
            }}
            content={selectedAction === "Delete" ? "Are you sure you want to delete this deliverable?" : "Are you sure you want to toggle the public status of this deliverable?"}
        />
        <ContentPanel
            title="Project Management / Project Deliverable"
            customActions={
                <Button variant="contained" component={Link} to='create'>Add Deliverables</Button>
            }
            errorPopup={errorPopupProps}
            content={
                <>
                    <DataGrid
                        sx={{ border: 'none' }}
                        rows={deliverableList}
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
        />
    </>;
};

export default LecturerProjectDeliverablesManagement;