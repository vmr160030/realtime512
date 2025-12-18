import numpy as np


def set_high_activity_to_zero(*, data, sampling_frequency_hz, high_activity_intervals, start_frame, end_frame):
    """
    Sets data points within high activity intervals to zero.
    
    Parameters
    ----------
    data : np.ndarray
        The data array to process
    sampling_frequency_hz : float
        Sampling frequency in Hz
    high_activity_intervals : list of tuple
        List of (start_sec, end_sec) tuples defining high activity intervals
    start_frame : int
        Start frame of the current data chunk
    end_frame : int
        End frame of the current data chunk
    
    Returns
    -------
    np.ndarray
        Copy of data with high activity intervals set to zero
    """
    data_copy = data.copy()
    for interval in high_activity_intervals:
        seg_start_sec, seg_end_sec = interval
        seg_start_frame = int(seg_start_sec * sampling_frequency_hz)
        seg_end_frame = int(seg_end_sec * sampling_frequency_hz)
        
        # Clip to current data chunk
        seg_start_frame_clipped = max(seg_start_frame, start_frame)
        seg_end_frame_clipped = min(seg_end_frame, end_frame)
        
        if seg_start_frame_clipped < seg_end_frame_clipped:
            relative_start = seg_start_frame_clipped - start_frame
            relative_end = seg_end_frame_clipped - start_frame
            data_copy[relative_start:relative_end, :] = 0
    return data_copy
