# realtime512 Serve API Documentation

This document describes the HTTP API provided by the `realtime512 serve` command.

## Starting the Server

```bash
cd experiment_directory
realtime512 serve [--host HOST] [--port PORT]
```

- Default host: `127.0.0.1`
- Default port: `5000`
- CORS enabled for: `http://localhost:5173`

## API Endpoints

### 1. Get Configuration
**Endpoint:** `GET /api/config`

Returns the experiment configuration from `realtime512.yaml`.

**Response:**
```json
{
  "filter_params": {
    "lowcut": 300,
    "highcut": 4000,
    "order": 4
  },
  "sampling_frequency": 20000,
  "n_channels": 512,
  "detect_threshold_for_spike_stats": -40
}
```

---

### 2. Get Files List
**Endpoint:** `GET /api/files`

Returns list of available `.bin` files and their processing status.

**Response:**
```json
{
  "files": [
    {
      "filename": "data_001.bin",
      "has_filt": true,
      "has_shifted": true,
      "has_templates": true,
      "has_high_activity": true,
      "has_stats": true,
      "has_preview": true,
      "size_bytes": 20480000,
      "num_frames": 20000,
      "duration_sec": 1.0
    }
  ]
}
```

---

### 3. Get Shift Coefficients
**Endpoint:** `GET /api/shift_coefficients`

Returns the time shift coefficients used for data alignment.

**Response:**
```json
{
  "c_x": 0.000123,
  "c_y": 0.000456
}
```

---

### 4. Get Templates
**Endpoint:** `GET /api/templates/<filename>`

Returns spike templates as a binary NumPy array (`.npy` format).

**Parameters:**
- `filename`: Base name of the `.bin` file (e.g., `data_001.bin`)

**Response:** Binary data (NumPy `.npy` file)

**Example:**
```bash
curl http://localhost:5000/api/templates/data_001.bin -o templates.npy
```

---

### 5. Get Raw Data
**Endpoint:** `GET /api/raw/<filename>[?start_sec=X&end_sec=Y]`

Returns raw electrode data as binary int16 array.

**Parameters:**
- `filename`: Base name of the `.bin` file
- `start_sec` (optional): Start time in seconds
- `end_sec` (optional): End time in seconds

**Response:** Binary data (int16, shape: `[num_frames, n_channels]`)

**Response Headers:**
- `X-Start-Sec`: Actual start time
- `X-End-Sec`: Actual end time
- `X-Num-Frames`: Number of frames returned
- `X-Num-Channels`: Number of channels
- `X-Sampling-Frequency`: Sampling frequency in Hz

**Example:**
```javascript
// Fetch 1 second of data starting at 10 seconds
const response = await fetch('http://localhost:5000/api/raw/data_001.bin?start_sec=10&end_sec=11');
const arrayBuffer = await response.arrayBuffer();
const data = new Int16Array(arrayBuffer);

// Get metadata from headers
const numFrames = parseInt(response.headers.get('X-Num-Frames'));
const numChannels = parseInt(response.headers.get('X-Num-Channels'));

// Reshape: data is interleaved [frame0_ch0, frame0_ch1, ..., frame1_ch0, ...]
```

---

### 6. Get Filtered Data
**Endpoint:** `GET /api/filt/<filename>[?start_sec=X&end_sec=Y]`

Returns bandpass-filtered electrode data as binary int16 array.

Same parameters and response format as raw data endpoint.

---

### 7. Get Shifted Data
**Endpoint:** `GET /api/shifted/<filename>[?start_sec=X&end_sec=Y]`

Returns time-shift corrected electrode data as binary int16 array.

Same parameters and response format as raw data endpoint.

---

### 8. Get High Activity Intervals
**Endpoint:** `GET /api/high_activity/<filename>`

Returns detected high activity intervals.

**Parameters:**
- `filename`: Base name of the `.bin` file

**Response:**
```json
{
  "high_activity_intervals": [
    {
      "start_sec": 0.5,
      "end_sec": 1.2
    },
    {
      "start_sec": 3.1,
      "end_sec": 3.8
    }
  ]
}
```

---

### 9. Get Spike Statistics
**Endpoint:** `GET /api/stats/<filename>`

Returns per-channel spike statistics.

**Parameters:**
- `filename`: Base name of the `.bin` file

**Response:**
```json
{
  "mean_firing_rates": [2.5, 3.1, 1.8, ...],
  "mean_spike_amplitudes": [50.2, 45.3, 55.1, ...]
}
```

Arrays have length `n_channels`.

---

### 10. Get Preview Files
**Endpoint:** `GET /api/preview/<filename>/<path:filepath>`

Serves static files from the preview directory for a specific `.bin` file. Supports HTTP range requests for efficient streaming of large files.

**Parameters:**
- `filename`: Base name of the `.bin` file (e.g., `data_001.bin`)
- `filepath`: Path to the file within the preview directory (e.g., `index.html`)

**Response:** Binary data with appropriate MIME type

**Example:**
```
GET /api/preview/data_001.bin/index.html
```

This endpoint serves files from `computed/preview/{filename}.figpack/` directory. The preview directory typically contains an `index.html` file and all resources needed to render an interactive preview of the processed data.

**Range Request Support:**
- Supports HTTP range requests (partial content)
- Enables efficient streaming and seeking in large files
- Automatically handles proper headers for conditional requests

**Typical Usage:**
```html
<!-- Embed preview in iframe -->
<iframe src="http://localhost:5000/api/preview/data_001.bin/index.html"></iframe>
```

---

## Data Format Details

### Binary Data Format
- **Data type:** int16 (signed 16-bit integer)
- **Layout:** Row-major, interleaved channels
- **Shape:** `[num_frames, n_channels]`
- **Byte order:** Little-endian (system default)

### Reading Binary Data in JavaScript
```javascript
async function fetchBinaryData(url) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const data = new Int16Array(arrayBuffer);
  
  const numFrames = parseInt(response.headers.get('X-Num-Frames'));
  const numChannels = parseInt(response.headers.get('X-Num-Channels'));
  
  return { data, numFrames, numChannels };
}
```

### Reading Binary Data in Python
```python
import numpy as np
import requests

response = requests.get('http://localhost:5000/api/raw/data_001.bin?start_sec=0&end_sec=1')
data = np.frombuffer(response.content, dtype=np.int16)

num_frames = int(response.headers['X-Num-Frames'])
num_channels = int(response.headers['X-Num-Channels'])

data = data.reshape(num_frames, num_channels)
```

---

## Error Responses

All endpoints return JSON error responses with appropriate HTTP status codes:

```json
{
  "error": "Description of error"
}
```

Common status codes:
- `400`: Bad Request (invalid parameters)
- `404`: Not Found (file or resource doesn't exist)
- `500`: Internal Server Error

---

## Notes

1. **File naming:** When referencing files in API calls, use the base `.bin` filename (e.g., `data_001.bin`). The server automatically adds appropriate extensions for processed files (`.filt`, `.shifted`, etc.).

2. **Time ranges:** If `start_sec` and `end_sec` are omitted, the entire file is returned.

3. **Templates format:** Templates are returned as NumPy `.npy` files. Use `numpy.load()` in Python or appropriate libraries in other languages.

4. **Performance:** For large time ranges, consider fetching data in chunks to avoid memory issues.

5. **CORS:** The server only allows requests from `http://localhost:5173`. Modify `run_serve.py` if you need to allow other origins.
