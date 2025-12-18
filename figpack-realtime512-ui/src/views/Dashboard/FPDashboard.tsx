import React from "react";
import {
  FPViewContext,
  FPViewContexts,
  RenderParams,
  ZarrGroup,
} from "../../figpack-interface";
import DashboardView from "./DashboardView";
import { useProvideFPViewContext } from "../../figpack-utils";
import {
  TimeseriesSelectionAction,
  TimeseriesSelectionContext,
  TimeseriesSelectionState,
} from "../../TimeseriesSelectionContext";

type Props = {
  zarrGroup: ZarrGroup;
  contexts: FPViewContexts;
  width: number;
  height: number;
  renderFPView: (params: RenderParams) => void;
};

const FPDashboard: React.FC<Props> = ({
  zarrGroup,
  width,
  height,
  contexts,
  renderFPView
}) => {
  return (
    <ProvideTimeseriesSelectionContext context={contexts.timeseriesSelection}>
      <DashboardView zarrGroup={zarrGroup} width={width} height={height} contexts={contexts} renderFPView={renderFPView} />
    </ProvideTimeseriesSelectionContext>
  );
};

const ProvideTimeseriesSelectionContext: React.FC<{
  context: FPViewContext;
  children: React.ReactNode;
}> = ({ context, children }) => {
  const { state, dispatch } = useProvideFPViewContext<
    TimeseriesSelectionState,
    TimeseriesSelectionAction
  >(context);

  if (!state || !dispatch) {
    return <>Waiting for context...</>;
  }

  return (
    <TimeseriesSelectionContext.Provider
      value={{ timeseriesSelection: state, dispatch }}
    >
      {children}
    </TimeseriesSelectionContext.Provider>
  );
};

export default FPDashboard;
