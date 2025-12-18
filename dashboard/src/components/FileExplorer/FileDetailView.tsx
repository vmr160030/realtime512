import { useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Alert,
  CircularProgress,
  Button,
  Stack,
  Paper,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Cancel as ErrorIcon,
  ArrowBack as ArrowBackIcon,
  NavigateBefore as NavigateBeforeIcon,
  NavigateNext as NavigateNextIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';
import { usePolling } from '../../hooks/usePolling';
import { api } from '../../services/api';

export function FileDetailView() {
  const { filename: encodedFilename } = useParams<{ filename: string }>();
  const navigate = useNavigate();
  const filename = encodedFilename ? decodeURIComponent(encodedFilename) : '';
  const fetchFiles = useCallback(() => api.getFiles(), []);

  const {
    data: filesData,
    error: filesError,
    isLoading: filesLoading,
  } = usePolling(fetchFiles, { interval: 5000 });

  if (filesLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (filesError) {
    return (
      <Alert severity="error">
        Error loading file data: {filesError.message}
      </Alert>
    );
  }

  const file = filesData?.files.find(f => f.filename === filename);

  // Sort files alphabetically to determine previous/next
  const sortedFiles = (filesData?.files || []).sort((a, b) => 
    a.filename.localeCompare(b.filename)
  );
  
  const currentIndex = sortedFiles.findIndex(f => f.filename === filename);
  const previousFile = currentIndex > 0 ? sortedFiles[currentIndex - 1] : null;
  const nextFile = currentIndex >= 0 && currentIndex < sortedFiles.length - 1 ? sortedFiles[currentIndex + 1] : null;

  if (!file) {
    return (
      <Box>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/files')} sx={{ mb: 2 }}>
          Back to File Explorer
        </Button>
        <Alert severity="warning">
          File not found: {filename}
        </Alert>
      </Box>
    );
  }

  const getPreviewUrl = (fname: string) => {
    return `http://localhost:5000/api/preview/${fname}/index.html?ext_dev_x=figpack-realtime512:http://localhost:5174/figpack_realtime512.js`;
  };

  return (
    <Box>
      <Box display="flex" gap={2} mb={2} flexWrap="wrap">
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/files')}>
          Back to File Explorer
        </Button>
        <Box display="flex" gap={1}>
          <Button
            startIcon={<NavigateBeforeIcon />}
            onClick={() => previousFile && navigate(`/files/${encodeURIComponent(previousFile.filename)}`)}
            disabled={!previousFile}
            variant="outlined"
          >
            Previous
          </Button>
          <Button
            endIcon={<NavigateNextIcon />}
            onClick={() => nextFile && navigate(`/files/${encodeURIComponent(nextFile.filename)}`)}
            disabled={!nextFile}
            variant="outlined"
          >
            Next
          </Button>
        </Box>
      </Box>

      <Typography variant="h4" gutterBottom>
        {file.filename}
      </Typography>

      {/* File Overview */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            File Overview
          </Typography>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
            <Box flex="1" minWidth="200px">
              <Stack spacing={0.5}>
                {file.duration_sec !== undefined && (
                  <Typography variant="body2" color="text.secondary">
                    <strong>Duration:</strong> {file.duration_sec.toFixed(2)} seconds
                  </Typography>
                )}
                {file.num_frames !== undefined && (
                  <Typography variant="body2" color="text.secondary">
                    <strong>Frames:</strong> {file.num_frames.toLocaleString()}
                  </Typography>
                )}
                {file.size_bytes !== undefined && (
                  <Typography variant="body2" color="text.secondary">
                    <strong>Size:</strong> {(file.size_bytes / 1024 / 1024).toFixed(2)} MB
                  </Typography>
                )}
              </Stack>
            </Box>

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Processing Status
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                <Chip
                  size="small"
                  label="Filtered"
                  color={file.has_filt ? 'success' : 'default'}
                  icon={file.has_filt ? <CheckIcon /> : <ErrorIcon />}
                />
                <Chip
                  size="small"
                  label="Shifted"
                  color={file.has_shifted ? 'success' : 'default'}
                  icon={file.has_shifted ? <CheckIcon /> : <ErrorIcon />}
                />
                <Chip
                  size="small"
                  label="Templates"
                  color={file.has_templates ? 'success' : 'default'}
                  icon={file.has_templates ? <CheckIcon /> : <ErrorIcon />}
                />
                <Chip
                  size="small"
                  label="High Activity"
                  color={file.has_high_activity ? 'success' : 'default'}
                  icon={file.has_high_activity ? <CheckIcon /> : <ErrorIcon />}
                />
                <Chip
                  size="small"
                  label="Statistics"
                  color={file.has_stats ? 'success' : 'default'}
                  icon={file.has_stats ? <CheckIcon /> : <ErrorIcon />}
                />
                <Chip
                  size="small"
                  label="Preview"
                  color={file.has_preview ? 'success' : 'default'}
                  icon={file.has_preview ? <CheckIcon /> : <ErrorIcon />}
                />
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Preview */}
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Preview
          </Typography>
          {file.has_preview && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<OpenInNewIcon />}
              onClick={() => window.open(getPreviewUrl(file.filename), '_blank')}
            >
              Open in New Tab
            </Button>
          )}
        </Box>
        {file.has_preview ? (
          <Paper sx={{ p: 0, height: 'calc(100vh - 400px)', minHeight: '600px' }}>
            <iframe
              src={getPreviewUrl(file.filename)}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
              }}
              title={`Preview of ${file.filename}`}
            />
          </Paper>
        ) : (
          <Alert severity="info">
            Preview not available yet. Previews are generated after filtering and shifting.
          </Alert>
        )}
      </Box>
    </Box>
  );
}
