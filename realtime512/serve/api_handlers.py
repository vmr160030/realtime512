"""API handlers for the realtime512 serve command."""

import os
import json
import numpy as np
import yaml
from flask import jsonify, send_file, send_from_directory, request, Response
from io import BytesIO


def get_config_handler():
    """Returns the experiment configuration."""
    config_path = os.path.join(os.getcwd(), "realtime512.yaml")
    if not os.path.exists(config_path):
        return jsonify({"error": "Configuration file not found"}), 404
    
    with open(config_path, "r") as f:
        config = yaml.safe_load(f)
    
    return jsonify(config)


def get_files_handler():
    """Returns list of available .bin files and their processing status."""
    raw_dir = os.path.join(os.getcwd(), "raw")
    computed_dir = os.path.join(os.getcwd(), "computed")
    
    if not os.path.exists(raw_dir):
        return jsonify({"error": "raw/ directory not found"}), 404
    
    bin_files = [fname for fname in os.listdir(raw_dir) if fname.endswith(".bin")]
    
    files_info = []
    for fname in sorted(bin_files):
        file_info = {
            "filename": fname,
            "has_filt": os.path.exists(os.path.join(computed_dir, "filt", fname + ".filt")),
            "has_shifted": os.path.exists(os.path.join(computed_dir, "shifted", fname + ".shifted")),
            "has_templates": os.path.exists(os.path.join(computed_dir, "templates", fname + ".templates.npy")),
            "has_high_activity": os.path.exists(os.path.join(computed_dir, "high_activity", fname + ".high_activity.json")),
            "has_stats": os.path.exists(os.path.join(computed_dir, "stats", fname + ".stats.json")),
            "has_preview": os.path.exists(os.path.join(computed_dir, "preview", fname + ".figpack")),
        }
        
        # Get file size and duration
        raw_path = os.path.join(raw_dir, fname)
        if os.path.exists(raw_path):
            file_size = os.path.getsize(raw_path)
            file_info["size_bytes"] = file_size
            
            # Load config to get n_channels and sampling_frequency
            config_path = os.path.join(os.getcwd(), "realtime512.yaml")
            if os.path.exists(config_path):
                with open(config_path, "r") as f:
                    config = yaml.safe_load(f)
                n_channels = config.get("n_channels", 512)
                sampling_frequency = config.get("sampling_frequency", 20000)
                
                num_frames = file_size // (2 * n_channels)
                duration_sec = num_frames / sampling_frequency
                file_info["num_frames"] = num_frames
                file_info["duration_sec"] = duration_sec
        
        files_info.append(file_info)
    
    return jsonify({"files": files_info})


def get_shift_coefficients_handler():
    """Returns shift coefficients."""
    computed_dir = os.path.join(os.getcwd(), "computed")
    shift_coeffs_path = os.path.join(computed_dir, "shift_coeffs.yaml")
    
    if not os.path.exists(shift_coeffs_path):
        return jsonify({"error": "Shift coefficients not found"}), 404
    
    with open(shift_coeffs_path, "r") as f:
        shift_coeffs = yaml.safe_load(f)
    
    return jsonify(shift_coeffs)


def get_templates_handler(filename):
    """Returns templates as binary blob."""
    computed_dir = os.path.join(os.getcwd(), "computed")
    templates_path = os.path.join(computed_dir, "templates", filename + ".templates.npy")
    
    if not os.path.exists(templates_path):
        return jsonify({"error": "Templates file not found"}), 404
    
    return send_file(templates_path, mimetype="application/octet-stream")


def get_binary_data_handler(data_type, filename):
    """Returns binary data (raw, filt, or shifted) for a time range."""
    # Load configuration
    config_path = os.path.join(os.getcwd(), "realtime512.yaml")
    if not os.path.exists(config_path):
        return jsonify({"error": "Configuration file not found"}), 404
    
    with open(config_path, "r") as f:
        config = yaml.safe_load(f)
    
    n_channels = config.get("n_channels", 512)
    sampling_frequency = config.get("sampling_frequency", 20000)
    
    # Determine file path based on data type
    if data_type == "raw":
        data_path = os.path.join(os.getcwd(), "raw", filename)
    elif data_type == "filt":
        data_path = os.path.join(os.getcwd(), "computed", "filt", filename + ".filt")
    elif data_type == "shifted":
        data_path = os.path.join(os.getcwd(), "computed", "shifted", filename + ".shifted")
    else:
        return jsonify({"error": "Invalid data type"}), 400
    
    if not os.path.exists(data_path):
        return jsonify({"error": f"{data_type} file not found"}), 404
    
    # Get file size and calculate total duration
    file_size = os.path.getsize(data_path)
    total_frames = file_size // (2 * n_channels)
    total_duration_sec = total_frames / sampling_frequency
    
    # Get time range parameters
    start_sec = request.args.get("start_sec", type=float)
    end_sec = request.args.get("end_sec", type=float)
    
    # If no time range specified, return entire file
    if start_sec is None and end_sec is None:
        return send_file(data_path, mimetype="application/octet-stream")
    
    # Validate time range
    if start_sec is None:
        start_sec = 0.0
    if end_sec is None:
        end_sec = total_duration_sec
    
    if start_sec < 0 or end_sec > total_duration_sec or start_sec >= end_sec:
        return jsonify({
            "error": "Invalid time range",
            "start_sec": start_sec,
            "end_sec": end_sec,
            "total_duration_sec": total_duration_sec
        }), 400
    
    # Calculate frame range
    start_frame = int(start_sec * sampling_frequency)
    end_frame = int(end_sec * sampling_frequency)
    num_frames = end_frame - start_frame
    
    # Calculate byte offset and size
    bytes_per_frame = 2 * n_channels
    byte_offset = start_frame * bytes_per_frame
    num_bytes = num_frames * bytes_per_frame
    
    # Read the data segment
    with open(data_path, "rb") as f:
        f.seek(byte_offset)
        data_bytes = f.read(num_bytes)
    
    # Return as binary response
    return Response(
        data_bytes,
        mimetype="application/octet-stream",
        headers={
            "X-Start-Sec": str(start_sec),
            "X-End-Sec": str(end_sec),
            "X-Num-Frames": str(num_frames),
            "X-Num-Channels": str(n_channels),
            "X-Sampling-Frequency": str(sampling_frequency)
        }
    )


def get_high_activity_handler(filename):
    """Returns high activity intervals JSON."""
    computed_dir = os.path.join(os.getcwd(), "computed")
    high_activity_path = os.path.join(computed_dir, "high_activity", filename + ".high_activity.json")
    
    if not os.path.exists(high_activity_path):
        return jsonify({"error": "High activity file not found"}), 404
    
    with open(high_activity_path, "r") as f:
        data = json.load(f)
    
    return jsonify(data)


def get_stats_handler(filename):
    """Returns spike statistics JSON."""
    computed_dir = os.path.join(os.getcwd(), "computed")
    stats_path = os.path.join(computed_dir, "stats", filename + ".stats.json")
    
    if not os.path.exists(stats_path):
        return jsonify({"error": "Stats file not found"}), 404
    
    with open(stats_path, "r") as f:
        data = json.load(f)
    
    return jsonify(data)

def get_preview_file_handler(filename, filepath):
    """Serves static files from preview directories with range request support."""
    computed_dir = os.path.join(os.getcwd(), "computed")
    preview_dir = os.path.join(computed_dir, "preview", filename + ".figpack")
    
    if not os.path.exists(preview_dir):
        return jsonify({"error": "Preview directory not found"}), 404
    
    # Serve the file with range request support
    return send_from_directory(
        preview_dir,
        filepath,
        conditional=True  # Enables range request support
    )
