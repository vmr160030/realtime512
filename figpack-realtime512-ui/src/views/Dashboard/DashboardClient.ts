import { ZarrDataset, ZarrGroup } from "../../figpack-interface";

export class DashboardClient {
  // #zarrGroup: ZarrGroup;

  constructor(
    // zarrGroup: ZarrGroup,
    public numFrames: number,
    public numChannels: number,
    public numUnits: number,
    public samplingFrequencyHz: number,
    public startTimeSec: number,
    public electrodeCoords: ([number, number])[],
    public filteredDataMovieGroup: ZarrGroup,
    public shiftCorrectedDataMovieGroup: ZarrGroup,
    public filteredDataTimeseriesGraphGroup: ZarrGroup,
    public shiftCorrectedDataTimeseriesGraphGroup: ZarrGroup,
    public spikeClusteringScatterPlotGroup: ZarrGroup,
    public projectedDataTimeseriesGraphGroup: ZarrGroup,
    public autocorrelogramsGroup: ZarrGroup,
    public unitsTableGroup: ZarrGroup,
    public templatesDataset: ZarrDataset,
  ) {
    // this.#zarrGroup = zarrGroup;
  }

  static async create(zarrGroup: ZarrGroup): Promise<DashboardClient> {
    const attrs = zarrGroup.attrs;

    const numFrames = attrs["num_frames"] as number;
    const numChannels = attrs["num_channels"] as number;
    const numUnits = attrs["num_units"] as number;
    const samplingFrequencyHz = attrs["sampling_frequency_hz"] as number;
    const startTimeSec = attrs["start_time_sec"] as number;

    if (
      numFrames === undefined ||
      numChannels === undefined ||
      numUnits === undefined ||
      samplingFrequencyHz === undefined ||
      startTimeSec === undefined
    ) {
      throw new Error("Missing required attributes in zarr group");
    }

    const coordsDataset = await zarrGroup.getDataset("electrode_coordinates");
    if (!coordsDataset) {
      throw new Error("No electrode_coords dataset found");
    }
    const coordsData = await coordsDataset.getData({});
    const electrodeCoords = coordsData as Float32Array;
    const coords: ([number, number])[] = [];
    for (let i = 0; i < electrodeCoords.length / 2; i++) {
      coords.push([
        electrodeCoords[i * 2],
        electrodeCoords[i * 2 + 1],
      ]);
    }

    const shiftCorrectedDataMovieGroup = await zarrGroup.getGroup(
      "shift_corrected_data_movie"
    );
    if (!shiftCorrectedDataMovieGroup) {
      throw new Error("No shift_corrected_data_movie group found");
    }

    const filteredDataMovieGroup = await zarrGroup.getGroup(
      "filtered_data_movie"
    );
    if (!filteredDataMovieGroup) {
      throw new Error("No filtered_data_movie group found");
    }

    const filteredDataTimeseriesGraphGroup = await zarrGroup.getGroup(
      "filtered_data_timeseries_graph"
    );
    if (!filteredDataTimeseriesGraphGroup) {
      throw new Error("No filtered_data_timeseries_graph group found");
    }

    const shiftCorrectedDataTimeseriesGraphGroup = await zarrGroup.getGroup(
      "shift_corrected_data_timeseries_graph"
    );
    if (!shiftCorrectedDataTimeseriesGraphGroup) {
      throw new Error("No shift_corrected_data_timeseries_graph group found");
    }

    // spike_clustering_scatter_plot
    const spikeClusteringScatterPlotGroup = await zarrGroup.getGroup(
      "spike_clustering_scatter_plot"
    );
    if (!spikeClusteringScatterPlotGroup) {
      throw new Error("No spike_clustering_scatter_plot group found");
    }

    // projected_data_timeseries_graph
    const projectedDataTimeseriesGraphGroup = await zarrGroup.getGroup(
      "projected_data_timeseries_graph"
    );
    if (!projectedDataTimeseriesGraphGroup) {
      throw new Error("No projected_data_timeseries_graph group found");
    }

    // units_table
    const unitsTableGroup = await zarrGroup.getGroup("units_table");
    if (!unitsTableGroup) {
      throw new Error("No units_table group found");
    }

    // templates dataset
    const templatesDataset = await zarrGroup.getDataset("templates");
    if (!templatesDataset) {
      throw new Error("No templates dataset found");
    }

    // autocorrelograms group
    const autocorrelogramsGroup = await zarrGroup.getGroup("autocorrelograms");
    if (!autocorrelogramsGroup) {
      throw new Error("No autocorrelograms group found");
    }

    const client = new DashboardClient(
      // zarrGroup,
      numFrames,
      numChannels,
      numUnits,
      samplingFrequencyHz,
      startTimeSec,
      coords,
      filteredDataMovieGroup,
      shiftCorrectedDataMovieGroup,
      filteredDataTimeseriesGraphGroup,
      shiftCorrectedDataTimeseriesGraphGroup,
      spikeClusteringScatterPlotGroup,
      projectedDataTimeseriesGraphGroup,
      autocorrelogramsGroup,
      unitsTableGroup,
      templatesDataset
    );

    return client;
  }

  get endTimeSec(): number {
    return this.startTimeSec + this.numFrames / this.samplingFrequencyHz;
  }

  getFrameIndexFromTime(timeSec: number): number {
    const index = Math.round(
      (timeSec - this.startTimeSec) * this.samplingFrequencyHz,
    );
    return Math.max(0, Math.min(this.numFrames - 1, index));
  }
}
