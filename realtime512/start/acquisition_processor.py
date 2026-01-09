"""
Acquisition processor module for rechunking variable-sized acquisition files
into fixed-duration raw files.

This module uses a stateless approach - it determines what needs to be done
based on existing acquisition and raw files, so it can recover from restarts.
"""

import os
import time
import numpy as np


class AcquisitionProcessor:
    """
    Processes acquisition files (variable-sized chunks from acquisition system)
    and rechunks them into fixed-duration files in the raw/ directory.
    
    This uses a stateless approach: each time process_acquisition_files() is called,
    it examines existing acquisition and raw files to determine what needs to be created.
    """
    
    def __init__(
        self,
        acquisition_dir: str,
        raw_dir: str,
        computed_dir: str,
        n_channels: int,
        sampling_frequency: float,
        chunk_duration_sec: float
    ):
        self.acquisition_dir = acquisition_dir
        self.raw_dir = raw_dir
        self.computed_dir = computed_dir
        self.n_channels = n_channels
        self.sampling_frequency = sampling_frequency
        self.chunk_duration_sec = chunk_duration_sec
        self.frames_per_chunk = int(sampling_frequency * chunk_duration_sec)
        self.bytes_per_frame = 2 * n_channels  # int16
        self.bytes_per_chunk = self.frames_per_chunk * self.bytes_per_frame
    
    def process_acquisition_files(self) -> bool:
        """
        Process any new acquisition files and rechunk to raw/.
        
        This method is stateless: it looks at what raw files already exist,
        calculates how much data has been chunked, and creates new raw files
        as needed based on the acquisition files.
        
        Returns True if any processing was done, False otherwise.
        """
        # Get sorted list of acquisition .bin files
        acq_files = sorted([
            fname for fname in os.listdir(self.acquisition_dir)
            if fname.endswith(".bin")
        ])
        
        if len(acq_files) == 0:
            return False
        
        # Skip acquisition files still being written (modified in last 5 seconds)
        acq_files = [
            fname for fname in acq_files
            if time.time() - os.path.getmtime(os.path.join(self.acquisition_dir, fname)) > 5
        ]
        
        if len(acq_files) == 0:
            return False
        
        # Calculate total frames available from acquisition files
        total_acq_bytes = 0
        for fname in acq_files:
            filepath = os.path.join(self.acquisition_dir, fname)
            file_size = os.path.getsize(filepath)
            
            # Validate file size
            if file_size % self.bytes_per_frame != 0:
                print(f"Warning: {fname} has invalid size ({file_size} bytes), skipping")
                continue
            
            total_acq_bytes += file_size
        
        total_acq_frames = total_acq_bytes // self.bytes_per_frame
        
        # Count existing raw files and their total frames
        raw_files = sorted([
            fname for fname in os.listdir(self.raw_dir)
            if fname.startswith("raw_") and fname.endswith(".bin")
        ])
        
        total_raw_frames = 0
        for fname in raw_files:
            filepath = os.path.join(self.raw_dir, fname)
            file_size = os.path.getsize(filepath)
            total_raw_frames += file_size // self.bytes_per_frame
        
        # Determine how many new raw chunks we can create
        # We can create a chunk if we have enough unprocessed frames
        frames_available = total_acq_frames
        frames_already_chunked = total_raw_frames
        frames_remaining = frames_available - frames_already_chunked

        # debug print
        print(
            f"Acquisition frames: {frames_available}, "
            f"Raw frames: {frames_already_chunked}, "
            f"Frames remaining: {frames_remaining}"
        )
        
        if frames_remaining < self.frames_per_chunk:
            # Not enough data for a new chunk yet
            return False
        
        # debug print
        print(f"Processing acquisition files to create new raw chunks...")
        
        # Determine next raw file index
        if len(raw_files) == 0:
            next_raw_index = 1
        else:
            # Extract index from last raw file (e.g., raw_0005.bin -> 5)
            last_file = raw_files[-1]
            try:
                last_index = int(last_file.replace("raw_", "").replace(".bin", ""))
                next_raw_index = last_index + 1
            except ValueError:
                next_raw_index = len(raw_files) + 1

        # debug print
        print(f"Next raw file index: {next_raw_index}")

        # Create new raw chunks
        something_processed = False
        while frames_remaining >= self.frames_per_chunk:
            # Read data starting from offset frames_already_chunked
            data = self._read_frames_from_acquisition(
                acq_files,
                start_frame=frames_already_chunked,
                num_frames=self.frames_per_chunk
            )
            
            if data is None or data.nbytes < self.bytes_per_chunk:
                break
            
            # Write raw chunk
            filename = f"raw_{next_raw_index:04d}.bin"
            filepath = os.path.join(self.raw_dir, filename)
            data[:self.bytes_per_chunk].tofile(filepath)
            
            print(f"Created {filename} ({self.chunk_duration_sec}s, {self.frames_per_chunk} frames)")
            
            frames_already_chunked += self.frames_per_chunk
            frames_remaining -= self.frames_per_chunk
            next_raw_index += 1
            something_processed = True
        
        return something_processed
    
    def _read_frames_from_acquisition(
        self,
        acq_files: list,
        start_frame: int,
        num_frames: int
    ) -> np.ndarray:
        """
        Read num_frames frames starting from start_frame across the acquisition files.
        
        Returns int16 array of data (flat), or None if not enough data available.
        """
        # Calculate byte offset within the acquisition data
        start_byte = start_frame * self.bytes_per_frame
        bytes_needed = num_frames * self.bytes_per_frame
        
        # Find which acquisition files we need to read from
        current_byte = 0
        data_parts = []
        
        for fname in acq_files:
            filepath = os.path.join(self.acquisition_dir, fname)
            file_size = os.path.getsize(filepath)
            
            # Skip invalid files
            if file_size % self.bytes_per_frame != 0:
                continue
            
            # Check if this file contains any of the bytes we need
            file_start_byte = current_byte
            file_end_byte = current_byte + file_size
            
            if file_end_byte <= start_byte:
                # This file is entirely before our start offset
                current_byte = file_end_byte
                continue
            
            if file_start_byte >= start_byte + bytes_needed:
                # This file is entirely after what we need
                break
            
            # This file contains some portion of the data we need
            # Calculate offset within this file
            offset_in_file = max(0, start_byte - file_start_byte)
            bytes_from_this_file = min(
                file_size - offset_in_file,
                bytes_needed - sum(len(p) for p in data_parts) * 2
            )
            
            # Read the needed portion
            file_data = np.fromfile(filepath, dtype=np.int16, count=-1)
            start_idx = offset_in_file // 2  # Convert bytes to int16 samples
            end_idx = start_idx + (bytes_from_this_file // 2)
            data_parts.append(file_data[start_idx:end_idx])
            
            current_byte = file_end_byte
            
            # Check if we have all the data we need
            if sum(len(p) for p in data_parts) * 2 >= bytes_needed:
                break
        
        if len(data_parts) == 0:
            return None
        
        # Concatenate all parts
        data = np.concatenate(data_parts)
        
        return data
