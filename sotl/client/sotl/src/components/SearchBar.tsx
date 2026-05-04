import { Search } from "@mui/icons-material";
import { FormControl, InputAdornment, OutlinedInput } from "@mui/material";

interface SearchBarProps {
    fullWidth?: boolean;
    onSearchBarChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    value?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ fullWidth = true, onSearchBarChange, value }) => {
    return (
        <FormControl fullWidth={fullWidth} sx={{ marginBottom: '20px' }}>
            <OutlinedInput id="group-search-bar" value={value} placeholder='Search' type='text'
                onChange={onSearchBarChange} startAdornment={<InputAdornment position="start"><Search /></InputAdornment>} />
        </FormControl>
    );
}

export default SearchBar;