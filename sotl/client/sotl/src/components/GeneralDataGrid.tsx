import { DataGrid, GridColDef, GridRowParams } from '@mui/x-data-grid';
import '../assets/css/style.css';

interface GeneralDataGridProps {
    rows: any[];
    columns: GridColDef[];
    onRowClick?: (params: GridRowParams) => void; // Optional callback for row click
}

const GeneralDataGrid: React.FC<GeneralDataGridProps> = ({ rows, columns, onRowClick  }) => {
    return (
        <DataGrid rows={rows} columns={columns}
            initialState={{
                pagination: {
                    paginationModel: { pageSize: 10, page: 0 },
                }
            }}
            onRowClick={onRowClick} // Attach the click handler here
            getRowClassName={() => 'custom-row'} // Apply custom class to each row
            getRowId={(row) => row._id!}
        />
    );
}

export default GeneralDataGrid;