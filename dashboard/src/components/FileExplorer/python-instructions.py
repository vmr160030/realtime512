import os
import numpy as np

experiment_dir = os.environ.get("EXPERIMENT_DIR", ".")

# File metadata
num_channels = {{ num_channels }}
sampling_frequency = {{ sampling_frequency }}
num_frames = {{ num_frames }}

# Electrode coordinates
electrode_coords = np.loadtxt(f"{experiment_dir}/electrode_coords.txt")
assert len(electrode_coords) == num_channels

raw_path = f"{experiment_dir}/raw/{{ filename }}"
filt_path = f"{experiment_dir}/computed/filt/{{ filename }}.filt"
shifted_path = f"{experiment_dir}/computed/shifted/{{ filename }}.shifted"
templates_path = f"{experiment_dir}/computed/templates/{{ filename }}.templates.npy"

# Load filtered data
filt = np.fromfile(filt_path, dtype=np.int16).reshape(-1, num_channels)
assert filt.shape[0] == num_frames

# Load templates
templates = np.load(templates_path)
num_units = templates.shape[0]
assert templates.shape[1] == num_channels

if False:
    # Show filtered data movie
    from realtime512.figpack_realtime512.MEAMovie import MEAMovie
    raw_movie = MEAMovie(
        raw_data=filt,
        electrode_coords=np.loadtxt(f"{experiment_dir}/electrode_coords.txt"),
        start_time_sec=0,
        sampling_frequency_hz=sampling_frequency
    )
    raw_movie.show(
        title="Filtered Data",
        open_in_browser=True
    )

if False:
    # Show templates view
    from realtime512.figpack_realtime512.TemplatesView import TemplatesView
    templates_view = TemplatesView(
        templates=templates,
        electrode_coords=np.loadtxt(f"{experiment_dir}/electrode_coords.txt")
    )
    templates_view.show(
        title="Templates",
        open_in_browser=True
    )
