import json

import numpy as np

import figpack.views as vv
from ..figpack_realtime512.MEAMovie import MEAMovie
from ..figpack_realtime512.MEAFiringRatesAndAmplitudes import MEAFiringRatesAndAmplitudes
from ..figpack_realtime512.TemplatesView import TemplatesView


def generate_preview(
    *,
    filt_path: str,
    shift_path: str,
    stats_path: str,
    high_activity_intervals: list,
    templates_path: str,
    n_channels: int,
    sampling_frequency: float,
    electrode_coords: np.ndarray,
    preview_path: str
):
    filt_time_series = generate_time_series_preview(
        data_path=filt_path,
        channel_indices=list(range(min(64, n_channels))),
        sampling_frequency=sampling_frequency,
        num_channels=n_channels,
        high_activity_intervals=high_activity_intervals,
        name="Filtered Data (channels 1-64)"
    )

    filt_movie = MEAMovie(
        raw_data=np.fromfile(filt_path, dtype=np.int16).reshape(-1, n_channels),
        electrode_coords=electrode_coords,
        start_time_sec=0,
        sampling_frequency_hz=sampling_frequency
    )


    with open(stats_path, 'r') as f:
        stats = json.load(f)
    mean_firing_rates = np.array(stats['mean_firing_rates'], dtype=np.float32)
    mean_spike_amplitudes = np.array(stats['mean_spike_amplitudes'], dtype=np.float32)
    spike_stats = MEAFiringRatesAndAmplitudes(
        electrode_coords=electrode_coords,
        mean_firing_rates=mean_firing_rates.reshape(1, -1),
        mean_spike_amplitudes=mean_spike_amplitudes.reshape(1, -1)
    )

    templates = np.load(templates_path)
    templates_view = TemplatesView(
        templates=templates,
        electrode_coords=electrode_coords
    )

    tab_items = [
        vv.TabLayoutItem(
            view=spike_stats,
            label="Spike Stats"
        ),
        vv.TabLayoutItem(
            view=templates_view,
            label="Templates"
        ),
        vv.TabLayoutItem(
            view=filt_movie,
            label="Filt Movie"
        ),
        vv.TabLayoutItem(
            view=filt_time_series,
            label="Filt TS"
        )
    ]
    tabs = vv.TabLayout(
        items=tab_items
    )

    tabs.save(
        preview_path,
        title=f"Realtime512 Preview"
    )

def generate_time_series_preview(
    *,
    data_path: str,
    channel_indices: list,
    sampling_frequency: float,
    num_channels: int,
    high_activity_intervals: list,
    name: str
):
    """Generate a figpack TimeSeriesGraph preview with high activity intervals."""
    V = vv.TimeseriesGraph()
    V.add_uniform_series(
        name=name,
        start_time_sec=0,
        sampling_frequency_hz=sampling_frequency,
        data=np.fromfile(data_path, dtype=np.int16).reshape(-1, num_channels)[:, channel_indices],
        auto_channel_spacing=50
    )
    t_start = np.array([i[0] for i in high_activity_intervals], dtype=np.float32)
    t_end = np.array([i[1] for i in high_activity_intervals], dtype=np.float32)
    V.add_interval_series(
        name="High Activity",
        t_start=t_start,
        t_end=t_end,
        color="yellow",
        alpha=0.3
    )
    return V
    