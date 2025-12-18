import os
import yaml


def create_config_file():
    """Create a new realtime512.yaml configuration file with user input."""
    default_config = {
        'filter_params': {
            'lowcut': 300,
            'highcut': 4000,
            'order': 4
        },
        'detect_threshold_for_spike_stats': -40,
        'high_activity_threshold': 3
    }
    
    # Get sampling frequency from user
    fs = input("Enter the sampling frequency (Hz) [default: 20000]: ")
    if fs.strip() == "":
        fs = 20000
    else:
        fs = int(fs)
    default_config['sampling_frequency'] = fs

    # Get number of channels from user
    n_channels = input("Enter the number of channels [default: 512]: ")
    if n_channels.strip() == "":
        n_channels = 512
    else:
        n_channels = int(n_channels)
    default_config['n_channels'] = n_channels

    with open("realtime512.yaml", "w") as f:
        yaml.dump(default_config, f)


def check_or_create_config():
    """Check for config file existence and create if needed in empty directory."""
    config_path = os.path.join(os.getcwd(), "realtime512.yaml")
    if os.path.exists(config_path):
        print("Found existing configuration file: realtime512.yaml")
        return config_path
    
    # check if empty, except allow simulate_raw.yaml and electrode_coords.txt
    dir_contents = [f for f in os.listdir(os.getcwd()) if f not in ("simulate_raw.yaml", "electrode_coords.txt")]
    if len(dir_contents) > 0:
        print("Current directory is not empty and no configuration file found.")
        print("Please run this command in an empty directory.")
        return None
    
    print("No configuration file found.")
    print("Creating a new configuration file: realtime512.yaml")
    create_config_file()
    print("Configuration file created.")
    return config_path


def load_and_validate_config(config_path):
    """Load configuration file and validate required fields."""
    with open(config_path, "r") as f:
        config = yaml.safe_load(f)
    print("Configuration:")
    print(config)

    filter_params = config.get("filter_params")
    assert filter_params is not None, "filter_params not found in config file."
    assert "lowcut" in filter_params, "lowcut not found in filter_params."
    assert "highcut" in filter_params, "highcut not found in filter_params."
    assert "order" in filter_params, "order not found in filter_params."

    sampling_frequency = config.get("sampling_frequency")
    assert sampling_frequency is not None, "sampling_frequency not found in config file."
    assert isinstance(sampling_frequency, (int, float)), "sampling_frequency must be numeric."

    n_channels = config.get("n_channels")
    assert n_channels is not None, "n_channels not found in config file."
    assert isinstance(n_channels, int), "n_channels must be an integer."

    detect_threshold_for_spike_stats = config.get("detect_threshold_for_spike_stats")
    assert detect_threshold_for_spike_stats is not None, "detect_threshold_for_spike_stats not found in config file."
    assert isinstance(detect_threshold_for_spike_stats, (int, float)), "detect_threshold_for_spike_stats must be numeric."
    assert detect_threshold_for_spike_stats < 0, "detect_threshold_for_spike_stats must be negative."

    high_activity_threshold = config.get("high_activity_threshold")
    assert high_activity_threshold is not None, "high_activity_threshold not found in config file."
    assert isinstance(high_activity_threshold, (int, float)), "high_activity_threshold must be numeric."
    assert high_activity_threshold >= 0, "high_activity_threshold must be non-negative."

    return config
