import React from 'react';
import {
  DataGrid,
  GridColDef,
  GridRowSelectionModel,
  GridToolbar,
  GridActionsCellItem,
} from '@mui/x-data-grid';
import {
  Box,
  IconButton,
  Tooltip,
  Paper,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { TableProps } from '../../types';

interface DataTableProps extends Omit<TableProps, 'columns'> {
  columns: GridColDef[];
  onView?: (row: any) => void;
}

const DataTable: React.FC<DataTableProps> = ({
  columns,
  rows,
  loading = false,
  onRowClick,
  onEdit,
  onDelete,
  onView,
  pageSize = 25,
  checkboxSelection = false,
  onSelectionChange,
}) => {
  const handleSelectionChange = (selectionModel: GridRowSelectionModel) => {
    if (onSelectionChange) {
      onSelectionChange(selectionModel as string[]);
    }
  };

  // Add actions column if any action handlers are provided
  const columnsWithActions: GridColDef[] = [
    ...columns,
    ...(onEdit || onDelete || onView ? [{
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 120,
      getActions: (params: any) => {
        const actions = [];

        if (onView) {
          actions.push(
            <GridActionsCellItem
              key="view"
              icon={
                <Tooltip title="View">
                  <ViewIcon />
                </Tooltip>
              }
              label="View"
              onClick={() => onView(params.row)}
            />
          );
        }

        if (onEdit) {
          actions.push(
            <GridActionsCellItem
              key="edit"
              icon={
                <Tooltip title="Edit">
                  <EditIcon />
                </Tooltip>
              }
              label="Edit"
              onClick={() => onEdit(params.row)}
            />
          );
        }

        if (onDelete) {
          actions.push(
            <GridActionsCellItem
              key="delete"
              icon={
                <Tooltip title="Delete">
                  <DeleteIcon />
                </Tooltip>
              }
              label="Delete"
              onClick={() => onDelete(params.row)}
              showInMenu
            />
          );
        }

        return actions;
      },
    }] : []),
  ];

  return (
    <Paper sx={{ height: 600, width: '100%' }}>
      <DataGrid
        rows={rows}
        columns={columnsWithActions}
        loading={loading}
        checkboxSelection={checkboxSelection}
        onRowSelectionModelChange={handleSelectionChange}
        onRowClick={onRowClick ? (params) => onRowClick(params.row) : undefined}
        pageSizeOptions={[10, 25, 50, 100]}
        initialState={{
          pagination: {
            paginationModel: { pageSize, page: 0 },
          },
        }}
        slots={{
          toolbar: GridToolbar,
        }}
        slotProps={{
          toolbar: {
            showQuickFilter: true,
            quickFilterProps: { debounceMs: 500 },
          },
        }}
        sx={{
          border: 0,
          '& .MuiDataGrid-cell:hover': {
            color: 'primary.main',
          },
          '& .MuiDataGrid-row:hover': {
            backgroundColor: 'action.hover',
          },
        }}
        disableRowSelectionOnClick={!!onRowClick}
        density="comfortable"
      />
    </Paper>
  );
};

export default DataTable;