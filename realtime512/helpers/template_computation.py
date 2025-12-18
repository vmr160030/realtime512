import numpy as np
from sklearn.neighbors import NearestNeighbors
import sklearn.cluster


def find_nearest_neighbors(data: np.ndarray, *, num_neighbors: int):
    """
    Find nearest neighbors for each data point.
    
    Parameters
    ----------
    data : np.ndarray
        Data array where each row is a data point
    num_neighbors : int
        Number of nearest neighbors to find
    
    Returns
    -------
    np.ndarray
        Array of indices of nearest neighbors for each data point
    """
    nbrs = NearestNeighbors(n_neighbors=num_neighbors, algorithm='auto').fit(data)
    distances, indices = nbrs.kneighbors(data)
    return indices


def cluster_kmeans(data: np.ndarray, *, num_clusters: int):
    """
    Cluster data using K-means algorithm.
    
    Parameters
    ----------
    data : np.ndarray
        Data array where each row is a data point
    num_clusters : int
        Number of clusters to create
    
    Returns
    -------
    np.ndarray
        Array of cluster labels (1-based)
    """
    kmeans = sklearn.cluster.KMeans(n_clusters=num_clusters, n_init=10)
    labels = kmeans.fit_predict(data)
    return labels + 1  # make labels 1-based


def compute_template_peak_channel_x_coordinate(templates: np.ndarray, electrode_coords: np.ndarray):
    """
    Compute the x-coordinate of the peak channel for each template.
    
    Parameters
    ----------
    templates : np.ndarray
        Array of templates, shape (num_templates, num_channels)
    electrode_coords : np.ndarray
        Array of electrode coordinates, shape (num_channels, 2)
    
    Returns
    -------
    np.ndarray
        Array of x-coordinates, shape (num_templates, 1)
    """
    num_templates = templates.shape[0]
    template_x_coords = np.zeros((num_templates, 1), dtype=np.float32)
    electrode_coords = np.array(electrode_coords)
    for k in range(num_templates):
        template = templates[k, :]
        peak_channel = np.argmin(template)
        template_x_coords[k, 0] = electrode_coords[peak_channel, 0]
    return template_x_coords


def compute_templates_from_frames(
    frames: np.ndarray,
    *,
    num_nearest_neighbors: int,
    num_clusters: int,
    electrode_coords: np.ndarray
):
    """
    Compute spike templates from extracted spike frames.
    
    This function performs the following steps:
    1. Find nearest neighbors for each frame
    2. Perform non-local means denoising
    3. Cluster the denoised frames
    4. Compute average template for each cluster
    5. Sort templates by peak channel x-coordinate
    
    Parameters
    ----------
    frames : np.ndarray
        Array of spike frames, shape (num_spikes, num_channels)
    num_nearest_neighbors : int
        Number of nearest neighbors for denoising
    num_clusters : int
        Number of clusters to create
    electrode_coords : np.ndarray
        Array of electrode coordinates, shape (num_channels, 2)
    
    Returns
    -------
    np.ndarray
        Array of templates sorted by peak channel x-coordinate,
        shape (num_clusters, num_channels)
    """
    n_channels = frames.shape[1]
    
    # Find nearest neighbors
    nearest_neighbors = find_nearest_neighbors(frames, num_neighbors=num_nearest_neighbors)
    
    # Non-local means averaging of nearest neighbors (denoising)
    # Vectorized computation: use advanced indexing to gather all neighbors at once
    denoised_frames = np.mean(frames[nearest_neighbors], axis=1)
    
    # Cluster denoised frames
    labels = cluster_kmeans(denoised_frames, num_clusters=num_clusters)
    num_clusters_found = np.max(labels)
    
    # Compute cluster templates
    templates = np.zeros((num_clusters_found, n_channels), dtype=np.float32)
    for k in range(1, num_clusters_found + 1):
        templates[k - 1, :] = np.mean(denoised_frames[labels == k, :], axis=0)
    
    # Sort templates by peak channel x-coordinate
    template_x_coords = compute_template_peak_channel_x_coordinate(templates, np.array(electrode_coords))
    sorted_indices = np.argsort(template_x_coords[:, 0])
    templates = templates[sorted_indices, :]
    
    return templates
