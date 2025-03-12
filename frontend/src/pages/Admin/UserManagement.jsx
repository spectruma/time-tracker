// frontend/src/pages/Admin/UserManagement.jsx
import React, { useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  TextField, 
  Table, 
  TableContainer, 
  TableHead, 
  TableBody, 
  TableRow, 
  TableCell,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  FormControlLabel,
  Switch,
  MenuItem,
  Chip,
  Tooltip,
  Alert,
  CircularProgress,
  Tab,
  Tabs,
  InputAdornment,
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Search as SearchIcon,
  UploadFile as UploadIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  PeopleAlt as UsersIcon,
} from '@mui/icons-material';
import DashboardHeader from '../Dashboard/DashboardHeader';
import { 
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useBulkImportUsersMutation,
} from '../../store/services/usersApi';

// Tab panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`user-management-tabpanel-${index}`}
      aria-labelledby={`user-management-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const UserManagement = () => {
  // State for tabs
  const [tabValue, setTabValue] = useState(0);
  
  // State for user dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    password: '',
    role: 'normal',
    is_active: true,
  });
  
  // State for search and filter
  const [searchTerm, setSearchTerm] = useState('');
  
  // State for file upload
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  
  // RTK Query hooks
  const { 
    data: users, 
    isLoading, 
    error,
    refetch,
  } = useGetUsersQuery({ skip: 0, limit: 100 });
  
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [bulkImportUsers, { isLoading: isImporting }] = useBulkImportUsersMutation();
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Handle dialog open/close
  const handleOpenDialog = (user = null) => {
    if (user) {
      // Editing existing user
      setEditingUser(user);
      setFormData({
        email: user.email,
        full_name: user.full_name || '',
        password: '',  // Don't show password, it will be updated only if entered
        role: user.role,
        is_active: user.is_active,
      });
    } else {
      // Creating new user
      setEditingUser(null);
      setFormData({
        email: '',
        full_name: '',
        password: '',
        role: 'normal',
        is_active: true,
      });
    }
    setDialogOpen(true);
  };
  
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingUser(null);
  };
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    try {
      // Basic validation
      if (!formData.email) {
        alert('Email is required');
        return;
      }
      
      if (!editingUser && !formData.password) {
        alert('Password is required for new users');
        return;
      }
      
      const userData = {
        email: formData.email,
        full_name: formData.full_name,
        role: formData.role,
        is_active: formData.is_active,
      };
      
      // Add password only if provided (for updating)
      if (formData.password) {
        userData.password = formData.password;
      }
      
      if (editingUser) {
        // Update existing user
        await updateUser({
          id: editingUser.id,
          ...userData,
        }).unwrap();
      } else {
        // Create new user
        await createUser(userData).unwrap();
      }
      
      // Close dialog and refresh data
      handleCloseDialog();
      refetch();
    } catch (error) {
      console.error('Error submitting user data:', error);
      alert(error.data?.detail || 'An error occurred. Please try again.');
    }
  };
  
  // Handle file selection
  const handleFileSelect = (e) => {
    if (e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };
  
  // Handle bulk import
  const handleBulkImport = async () => {
    if (!selectedFile) {
      alert('Please select a file to import');
      return;
    }
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      await bulkImportUsers(formData).unwrap();
      
      // Close dialog and refresh data
      setUploadDialogOpen(false);
      setSelectedFile(null);
      refetch();
    } catch (error) {
      console.error('Error importing users:', error);
      alert(error.data?.detail || 'An error occurred during import. Please try again.');
    }
  };
  
  // Filter users based on search term
  const filteredUsers = users ? users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
  ) : [];
  
  return (
    <Box>
      <DashboardHeader 
        title="User Management" 
        subtitle="Manage system users and permissions"
      />
      
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Users" />
          <Tab label="Bulk Import" />
        </Tabs>
        
        <TabPanel value={tabValue} index={0}>
          <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
            <TextField
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ width: 300 }}
            />
            
            <Box>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={refetch}
                sx={{ mr: 1 }}
              >
                Refresh
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
              >
                Add User
              </Button>
            </Box>
          </Box>
          
          {isLoading ? (
            <Box display="flex" justifyContent="center" my={4}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mb: 3 }}>
              Error loading users. Please try again.
            </Alert>
          ) : filteredUsers.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography variant="body1" color="text.secondary">
                No users found.
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Email</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell align="center">Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.full_name || '-'}</TableCell>
                      <TableCell>
                        <Chip 
                          label={user.role === 'admin' ? 'Admin' : 'User'} 
                          color={user.role === 'admin' ? 'primary' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={user.is_active ? 'Active' : 'Inactive'} 
                          color={user.is_active ? 'success' : 'error'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => handleOpenDialog(user)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <Box textAlign="center" py={2}>
            <Typography variant="h6" gutterBottom>
              Bulk Import Users
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Import multiple users using a CSV file.
            </Typography>
            
            <Paper 
              variant="outlined" 
              sx={{ 
                p: 4, 
                mt: 2, 
                mb: 4, 
                maxWidth: 600, 
                mx: 'auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <UploadIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Upload CSV File
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                The CSV should have columns for email, password, full_name, role, and is_active.
              </Typography>
              <Button
                variant="contained"
                component="label"
                startIcon={<UploadIcon />}
              >
                Choose File
                <input
                  type="file"
                  accept=".csv"
                  hidden
                  onChange={handleFileSelect}
                />
              </Button>
              
              {selectedFile && (
                <Box mt={2}>
                  <Typography variant="body2">
                    Selected: {selectedFile.name}
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleBulkImport}
                    disabled={isImporting}
                    sx={{ mt: 2 }}
                  >
                    {isImporting ? 'Importing...' : 'Import Users'}
                  </Button>
                </Box>
              )}
            </Paper>
            
            <Typography variant="subtitle2" gutterBottom>
              CSV Format Example:
            </Typography>
            <Box 
              component="pre" 
              sx={{ 
                bgcolor: 'background.paper', 
                p: 2, 
                borderRadius: 1,
                border: 1,
                borderColor: 'divider',
                textAlign: 'left',
                maxWidth: 600,
                mx: 'auto',
                overflow: 'auto',
              }}
            >
              email,password,full_name,role,is_active<br/>
              john@example.com,password123,John Doe,normal,true<br/>
              admin@example.com,securepass,Admin User,admin,true
            </Box>
          </Box>
        </TabPanel>
      </Paper>
      
      {/* User Form Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingUser ? 'Edit User' : 'Add User'}
        </DialogTitle>
        <DialogContent>
          <Box py={1}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  name="email"
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  fullWidth
                  margin="normal"
                  required
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  name="full_name"
                  label="Full Name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  fullWidth
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  name="password"
                  label={editingUser ? "Password (leave blank to keep current)" : "Password"}
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  fullWidth
                  margin="normal"
                  required={!editingUser}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  name="role"
                  label="Role"
                  value={formData.role}
                  onChange={handleInputChange}
                  fullWidth
                  margin="normal"
                >
                  <MenuItem value="normal">Normal User</MenuItem>
                  <MenuItem value="admin">Administrator</MenuItem>
                </TextField>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleInputChange}
                      color="primary"
                    />
                  }
                  label="Active"
                  sx={{ mt: 2 }}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            color="primary" 
            variant="contained"
            disabled={isCreating || isUpdating}
          >
            {isCreating || isUpdating ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;

