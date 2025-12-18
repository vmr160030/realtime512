import React, { useEffect, useMemo, useState } from "react";
import {
  FPViewContext,
  FPViewContexts,
  RenderParams,
  ZarrGroup,
} from "../../figpack-interface";
import { useProvideFPViewContext } from "../../figpack-utils";
import { useTimeseriesSelection } from "../../TimeseriesSelectionContext";
import FPMEAMovie from "../MEAMovie/FPMEAMovie";
import UnitSelectionContext, {
  UnitSelection,
  UnitSelectionAction
} from "./context-unit-selection/UnitSelectionContext";
import { DashboardClient } from "./DashboardClient";
import FPViewWrapper from "./FPViewWrapper";
import HBoxLayout from "./HBoxLayout";
import TabLayout from "./TabLayout";
import TemplatesView from "./TemplatesView";
import VBoxLayout from "./VBoxLayout";

type Props = {
  zarrGroup: ZarrGroup;
  width: number;
  height: number;
  contexts: FPViewContexts;
  renderFPView: (params: RenderParams) => void;
};

const DashboardView: React.FC<Props> = ({
  zarrGroup,
  width,
  height,
  contexts,
  renderFPView,
}) => {
  return (
    <ProvideUnitSelectionContext context={contexts.unitSelection}>
      <DashboardViewChild
        zarrGroup={zarrGroup}
        width={width}
        height={height}
        contexts={contexts}
        renderFPView={renderFPView}
      />
    </ProvideUnitSelectionContext>
  );
};

const DashboardViewChild: React.FC<Props> = ({
  zarrGroup,
  width,
  height,
  contexts,
  renderFPView,
}) => {
  const [client, setClient] = useState<DashboardClient | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const { currentTime, setCurrentTime, initializeTimeseriesSelection } =
    useTimeseriesSelection();

  // Load the client
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const dashboardClient = await DashboardClient.create(zarrGroup);
        setClient(dashboardClient);

        // Initialize timeseries selection context
        initializeTimeseriesSelection({
          startTimeSec: dashboardClient.startTimeSec,
          endTimeSec: dashboardClient.endTimeSec,
          initialVisibleStartTimeSec: dashboardClient.startTimeSec,
          initialVisibleEndTimeSec: dashboardClient.endTimeSec,
        });

        // Set initial current time to start
        setCurrentTime(dashboardClient.startTimeSec);
      } catch (err) {
        console.error("Error loading Dashboard client:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [zarrGroup, initializeTimeseriesSelection, setCurrentTime]);

  // // Calculate current time index from currentTime
  // const currentFrameIndex = useMemo(() => {
  //   if (!client || currentTime === undefined) return 0;
  //   return client.getFrameIndexFromTime(currentTime);
  // }, [client, currentTime]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width,
          height,
          fontFamily: "Arial, sans-serif",
        }}
      >
        Loading dashboard data...
      </div>
    );
  }

  if (error || !client) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width,
          height,
          fontFamily: "Arial, sans-serif",
          color: "red",
        }}
      >
        Error: {error || "Failed to load MEA Movie data"}
      </div>
    );
  }

  // const currentTimeSec =
  //   currentTime !== undefined ? currentTime : client.startTimeSec;
  // const totalDurationSec = client.endTimeSec - client.startTimeSec;

  const filteredMovie = (
    <FPMEAMovie
      zarrGroup={client.filteredDataMovieGroup}
      width={0}
      height={0}
      contexts={contexts}
    />
  );

  const shiftCorrectedMovie = (
    <FPMEAMovie
      zarrGroup={client.shiftCorrectedDataMovieGroup}
      width={0}
      height={0}
      contexts={contexts}
    />
  );

  const spikeTemplatesMovie = (
    <FPMEAMovie
      zarrGroup={client.spikeTemplatesMovieGroup}
      width={0}
      height={0}
      contexts={contexts}
    />
  );

  const timeseriesPlot = (
    <FPViewWrapper
      zarrGroup={client.filteredDataTimeseriesGraphGroup}
      width={0}
      height={0}
      contexts={contexts}
      renderFPView={renderFPView}
    />
  );

  const shiftCorrectedTimeseriesPlot = (
    <FPViewWrapper
      zarrGroup={client.shiftCorrectedDataTimeseriesGraphGroup}
      width={0}
      height={0}
      contexts={contexts}
      renderFPView={renderFPView}
    />
  );

  const spikeClusteringScatterPlot = (
    <FPViewWrapper
      zarrGroup={client.spikeClusteringScatterPlotGroup}
      width={0}
      height={0}
      contexts={contexts}
      renderFPView={renderFPView}
    />
  );

  // projected_data_timeseries_graph
  const projectedDataTimeseriesGraph = (
    <FPViewWrapper
      zarrGroup={client.projectedDataTimeseriesGraphGroup}
      width={0}
      height={0}
      contexts={contexts}
      renderFPView={renderFPView}
    />
  );

  const unitsTable = (
    <FPViewWrapper
      zarrGroup={client.unitsTableGroup}
      width={0}
      height={0}
      contexts={contexts}
      renderFPView={renderFPView}
    />
  );

  const templatesView = (
    <TemplatesView
      width={0}
      height={0}
      client={client}
    />
  );

  const autocorrelogramsView = (
    <FPViewWrapper
      zarrGroup={client.autocorrelogramsGroup}
      width={0}
      height={0}
      contexts={contexts}
      renderFPView={renderFPView}
    />
  );

  return (
    <MainLayout width={width} height={height}>
      {timeseriesPlot}
      {shiftCorrectedTimeseriesPlot}
      {filteredMovie}
      {shiftCorrectedMovie}
      {spikeTemplatesMovie}
      {spikeClusteringScatterPlot}
      {projectedDataTimeseriesGraph}
      {unitsTable}
      {templatesView}
      {autocorrelogramsView}
    </MainLayout>
  );
};

const MainLayout: React.FC<{
  width: number;
  height: number;
  children: React.ReactNode;
}> = ({ width, height, children }) => {
  const timeseriesPlot = React.Children.toArray(children)[0];
  const shiftCorrectedTimeseriesPlot = React.Children.toArray(children)[1];
  const filteredMovie = React.Children.toArray(children)[2];
  const shiftCorrectedMovie = React.Children.toArray(children)[3];
  const spikeClusteringScatterPlot = React.Children.toArray(children)[5];
  const projectedDataTimeseriesGraph = React.Children.toArray(children)[6];
  const unitsTable = React.Children.toArray(children)[7];
  const templatesView = React.Children.toArray(children)[8];
  const autocorrelogramsView = React.Children.toArray(children)[9];

  const widths = useMemo(() => (w: number) => {
    const width1 = 250;
    const width2 = (w - width1) / 2;
    const width3 = w - width1 - width2;
    return [width1, width2, width3]
  }, []);
  const rightHeights = useMemo(() => (h: number) => [h / 2, h / 2], []);

  return (
    <HBoxLayout width={width} height={height} widths={widths}>
      {unitsTable}
      <TabLayout
        width={0}
        height={0}
        tabLabels={["Templates", "Autocorrelograms"]}
      >
        {templatesView}
        {autocorrelogramsView}
      </TabLayout>
      <VBoxLayout width={0} height={0} heights={rightHeights}>
        <TabLayout
          width={0}
          height={0}
          tabLabels={[
            "Projected Data Timeseries",
            "Spike Clustering Scatter Plot",
          ]}
        >
          {projectedDataTimeseriesGraph}
          {spikeClusteringScatterPlot}
        </TabLayout>
        <TabLayout
          width={0}
          height={0}
          tabLabels={[
            "Filtered",
            "Shift Corrected",
            "Filtered TS",
            "Shift Corrected TS",
          ]}
        >
          {filteredMovie}
          {shiftCorrectedMovie}
          {timeseriesPlot}
          {shiftCorrectedTimeseriesPlot}
        </TabLayout>
      </VBoxLayout>
    </HBoxLayout>
  );
};

export const ProvideUnitSelectionContext: React.FC<{
  context: FPViewContext;
  children: React.ReactNode;
}> = ({ context, children }) => {
  const { state, dispatch } = useProvideFPViewContext<
    UnitSelection,
    UnitSelectionAction
  >(context);

  if (!dispatch || !state) {
    return <>Waiting for context...</>;
  }

  return (
    <UnitSelectionContext.Provider
      value={{ unitSelection: state, unitSelectionDispatch: dispatch }}
    >
      {children}
    </UnitSelectionContext.Provider>
  );
};

export default DashboardView;
