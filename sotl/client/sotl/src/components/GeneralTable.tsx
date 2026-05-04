import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import React from "react";

export interface HeaderProperties {
    name: string;
    center: boolean;
}

interface GeneralTableProps {
    tableHeader: HeaderProperties[];
    tableBody: React.ReactNode;
    size? : 'small' | 'medium';
}

const GeneralTable: React.FC<GeneralTableProps> = ({ tableHeader, tableBody, size = 'medium'}) => {
    return (
        <>
            <TableContainer>
                <Table size={size}>
                    <TableHead>
                        <TableRow >
                            {
                                tableHeader.map((header: HeaderProperties, index: number) => (
                                    <TableCell key={index} align={header.center ? 'center' : 'left'} sx={{ fontWeight: 'bold' }}>{header.name}</TableCell>
                                ))
                            }
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {tableBody}
                    </TableBody>
                </Table>
            </TableContainer>
        </>
    );
};

export default GeneralTable;