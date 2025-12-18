import os
import requests
import yaml

def download_simulated_data():
    """Download simulated raw data and electrode coordinates if simulate_raw.yaml exists."""
    simulate_config_path = os.path.join(os.getcwd(), "simulate_raw.yaml")
    if not os.path.exists(simulate_config_path):
        return
    
    with open(simulate_config_path, "r") as f:
        simulate_config = yaml.safe_load(f)
    
    electrode_coords_url = simulate_config.get("electrode_coords_url")
    if electrode_coords_url is not None:
        coords_filepath = os.path.join(os.getcwd(), "electrode_coords.txt")
        if not os.path.exists(coords_filepath):
            print(f"Downloading electrode coordinates from {electrode_coords_url} to {coords_filepath}...")
            response = requests.get(electrode_coords_url)
            with open(coords_filepath, "wb") as f:
                f.write(response.content)
        else:
            print(f"Electrode coordinates file {coords_filepath} already exists. Skipping download.")
    
    raw_data_urls = simulate_config.get("raw_data_urls", [])
    for i in range(len(raw_data_urls)):
        url = raw_data_urls[i]
        filename = f"simulated_{i+1:04d}.bin"
        raw_dir = os.path.join(os.getcwd(), "raw")
        if not os.path.exists(raw_dir):
            os.makedirs(raw_dir)
        filepath = os.path.join(raw_dir, filename)
        if not os.path.exists(filepath):
            print(f"Downloading simulated raw data from {url} to {filepath}...")
            response = requests.get(url)
            with open(filepath, "wb") as f:
                f.write(response.content)
        else:
            print(f"Simulated raw data file {filepath} already exists. Skipping download.")

def load_electrode_coords(n_channels):
    """Load and validate electrode coordinates from electrode_coords.txt."""
    coords_path = os.path.join(os.getcwd(), "electrode_coords.txt")
    if not os.path.exists(coords_path):
        print("Error: electrode_coords.txt file not found in current directory.")
        print("Please create this file with electrode coordinates and try again.")
        print("Each line of this file should be a whitespace separated pair of X Y coordinates.")
        return None
    
    print("Found electrode_coords.txt file.")
    
    electrode_coords = []
    with open(coords_path, "r") as f:
        for line in f:
            parts = line.strip().split()
            if len(parts) != 2:
                continue
            x, y = float(parts[0]), float(parts[1])
            electrode_coords.append((x, y))
    
    if len(electrode_coords) != n_channels:
        print(
            f"Error: Number of electrode coordinates ({len(electrode_coords)}) does not match n_channels ({n_channels})."
        )
        return None
    
    print(f"Read {len(electrode_coords)} electrode coordinates.")
    return electrode_coords

def setup_directories():
    """Create raw/ and computed/ directories if they don't exist."""
    raw_dir = os.path.join(os.getcwd(), "raw")
    if not os.path.exists(raw_dir):
        os.makedirs(raw_dir)
        print("Created raw/ directory for incoming data files.")
    else:
        print("Found existing raw/ directory.")
    
    computed_dir = os.path.join(os.getcwd(), "computed")
    if not os.path.exists(computed_dir):
        os.makedirs(computed_dir)
        print("Created computed/ directory for computed data files.")
    else:
        print("Found existing computed/ directory.")
    
    return raw_dir, computed_dir
