import { MouseEventHandler, useState } from 'react';
import { DataGrid, GridRowsProp, GridColDef, GridActionsCellItem, GridRenderCellParams, GridComparatorFn } from '@mui/x-data-grid';
import Link from '@mui/material/Link';
import { QuestionType } from '../models/Quiz';
import { AssessmentType, AssessmentTypeStr } from '../models/Assessment';
import { GridInitialStateCommunity } from '@mui/x-data-grid/models/gridStateCommunity';
import { DataGridProps, DataGridPropsWithComplexDefaultValueBeforeProcessing, DataGridPropsWithDefaultValues, DataGridPropsWithoutDefaultValue } from '@mui/x-data-grid/internals';
import { Box } from '@mui/material';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Link as RouterLink, To } from 'react-router-dom';

const sxBgLightgrey = { backgroundColor: 'lightgrey' };

const AssessmentDataGridCloneMenu: React.FC<{ label?: string; to: To }> = ({ label = '', to }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return <><GridActionsCellItem
    aria-label="more"
    // aria-controls={open ? 'long-menu' : undefined}
    // aria-expanded={open ? 'true' : undefined}
    aria-haspopup="true"
    sx={sxBgLightgrey}
    icon={<MoreVertIcon />}
    itemProp=''
    size='large'
    label="More"
    onClick={handleClick}
    color="inherit"
  />
    <Menu
      MenuListProps={{
        'aria-labelledby': 'long-button',
      }}
      anchorEl={anchorEl}
      open={open}
      onClose={handleClose}
      slotProps={{
        paper: {
          style: {
            width: '20ch',
          },
        },
      }}
    >
      <RouterLink to={to}>
        <MenuItem>Clone {label}</MenuItem>
      </RouterLink>
    </Menu>
  </>
};

// https://mui.com/x/react-data-grid/row-height/#dynamic-row-height
function ExpandableCell({ maxChar, params: { value } }: { maxChar: number; params: GridRenderCellParams }) {
  value += '';
  const [expanded, setExpanded] = useState(false);

  return (
    <Box sx={{ whiteSpace: 'pre-wrap' }}>
      {expanded ? value : (value.slice(0, maxChar) + (value.length > maxChar ? '...' : ''))}&nbsp;
      {value.length > maxChar && (
        // eslint-disable-next-line jsx-a11y/anchor-is-valid
        <Link
          type="button"
          component="button"
          sx={{ fontSize: 'inherit', letterSpacing: 'inherit' }}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'View less' : 'View more'}
        </Link>
      )}
    </Box>
  );
}

const assessmentTypeValueGetter = (value: number) => {
  if (!isNaN(value)) {
    return AssessmentTypeStr[value];
  }
};
const questionTypeValueGetter = (value: number) => QuestionType[value];

const numIdComparator: GridComparatorFn<string> = (a, b) => parseInt(a.substring(1)) - parseInt(b.substring(1));
const dateValueGetter = (date: string) => {
  if (date) {
    return new Date(date)
  }
};
const dateOptions: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true
};
const dateValueFormatter = (date?: Date) => {
  if (!date) {
    return '-';
  }
  return date.toLocaleString('en-GB', dateOptions)
};

type AssessmentDataGridProps = {
  apiRef?: DataGridProps['apiRef'];
  loading?: DataGridProps['loading'];
  rows: GridRowsProp;
  columns: GridColDef[];
  checkboxSelection?: boolean;
  disableRowSelectionOnClick?: boolean;
  rowSelectionModel?: DataGridProps['rowSelectionModel'];
  onRowSelectionModelChange?: DataGridProps['onRowSelectionModelChange'];
  localeText?: DataGridProps['localeText']
  slotProps?: DataGridProps['slotProps'];
  initialState?: DataGridProps['initialState'];
}

const AssessmentDataGrid: React.FC<AssessmentDataGridProps> = ({ apiRef, loading, rows, columns, checkboxSelection = false, disableRowSelectionOnClick = false, rowSelectionModel, onRowSelectionModelChange, localeText, slotProps, initialState = {} }) => {
  return <DataGrid apiRef={apiRef} loading={loading} sx={{ '&.MuiDataGrid-root--densityStandard .MuiDataGrid-cell': { py: '15px' }, '--DataGrid-overlayHeight': '100px' }} rows={rows} columns={columns} getRowId={(row) => row._id} getEstimatedRowHeight={() => 82} getRowHeight={() => 'auto'} checkboxSelection={checkboxSelection} disableRowSelectionOnClick={disableRowSelectionOnClick} rowSelectionModel={rowSelectionModel} onRowSelectionModelChange={onRowSelectionModelChange} localeText={localeText}
    slotProps={slotProps ? slotProps : {
      loadingOverlay: {
        variant: 'circular-progress',
        noRowsVariant: 'skeleton'
      }
    }}
    initialState={{
      sorting: {
        sortModel: [{ field: 'numId', sort: 'desc' }],
      },
      ...initialState
    }}
    pageSizeOptions={[5, 10, 15, 20, 25, 50, 75, 100]}
  />
};

export { sxBgLightgrey, AssessmentDataGridCloneMenu, AssessmentDataGrid, ExpandableCell, assessmentTypeValueGetter, questionTypeValueGetter, numIdComparator, dateValueGetter, dateValueFormatter };