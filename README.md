# realtime512

Real-time processing of multi-electrode array recordings during acquisition.

## Overview

This package provides tools for real-time processing and monitoring of multi-electrode array (MEA) data. It consists of two main components:

1. **Processing Pipeline** (`realtime512 start`) - Monitors raw data and processes it in real-time
2. **Web Dashboard** - Real-time visualization and monitoring interface
3. **API Server** (`realtime512 serve`) - Serves processed data to the dashboard

## Installation

```bash
pip install -e .
```

## Quick Start

### 1. Set Up Your Experiment

Create an experiment directory and initialize it:

```bash
mkdir my_experiment
cd my_experiment
realtime512 start
```

This will create a `realtime512.yaml` configuration file.

### 2. Start Real-Time Processing

In your experiment directory, start the processing pipeline:

```bash
realtime512 start
```

This monitors the `raw/` directory for `.bin` files and processes them automatically.

### 3. Start the API Server

In a separate terminal, start the API server:

```bash
cd my_experiment
realtime512 serve
```

This starts a Flask server at `http://localhost:5000` that serves processed data.

### 4. Launch the Web Dashboard

Open your browser to: https://realtime512-dashboard.vercel.app/

Or to run it locally, in another terminal, start the dashboard:

```bash
cd dashboard
npm run dev
```

If running locally, open your browser to `http://localhost:5173` to view the real-time dashboard.

## Dashboard Features

The web dashboard provides:

- **Overview**: Configuration, processing status, and file summary
- **File Explorer**: Browse processed files and their status
- **Time Series Viewer**: Visualize raw, filtered, or shifted signals
- **Electrode Heatmap**: View per-channel spike statistics and firing rates

See [dashboard/README.md](dashboard/README.md) for detailed dashboard documentation.

## Processing Pipeline

The processing pipeline performs the following steps:

1. **Filtering**: Bandpass filter raw signals
2. **Shift Estimation**: Estimate time shift coefficients
3. **High Activity Detection**: Identify periods of high neural activity
4. **Spike Statistics**: Calculate firing rates and spike amplitudes per channel
5. **Time Shift Correction**: Apply time shifts to align signals
6. **Template Extraction**: Extract spike templates

## Configuration

Edit `realtime512.yaml` in your experiment directory:

```yaml
filter_params:
  lowcut: 300
  highcut: 4000
  order: 4
sampling_frequency: 20000
n_channels: 512
detect_threshold_for_spike_stats: -40
```

## API Endpoints

The server provides the following REST API endpoints:

- `GET /api/config` - Experiment configuration
- `GET /api/files` - List of files and processing status
- `GET /api/shift_coefficients` - Time shift coefficients
- `GET /api/raw/<filename>` - Raw electrode data
- `GET /api/filt/<filename>` - Filtered data
- `GET /api/shifted/<filename>` - Time-shifted data
- `GET /api/templates/<filename>` - Spike templates
- `GET /api/high_activity/<filename>` - High activity intervals
- `GET /api/stats/<filename>` - Spike statistics

See [realtime512/serve/API.md](realtime512/serve/API.md) for complete API documentation.

## Project Structure

```
realtime512/
├── realtime512/           # Python package
│   ├── start/            # Processing pipeline
│   ├── serve/            # API server
│   └── helpers/          # Processing utilities
├── dashboard/            # React web dashboard
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── services/    # API client
│   │   └── types/       # TypeScript types
│   └── README.md
└── README.md
```

## Development

### Python Package

```bash
pip install -e .
```

### Dashboard

```bash
cd dashboard
npm install
npm run dev
```

## License

MIT
