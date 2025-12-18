import React, { useCallback, useMemo, useState } from "react";
import { DashboardClient } from "./DashboardClient";
import TemplateView from "./TemplateView";
import { useSelectedUnitIds, useUnitSelection } from "./context-unit-selection/UnitSelectionContext";

type Props = {
  width: number;
  height: number;
  client: DashboardClient;
};

const TemplatesView: React.FC<Props> = ({ width, height, client }) => {
  const { selectedUnitIdsArray: selectedUnitIds, allOrderedUnitIds } = useSelectedUnitIds();
  const { unitSelectionDispatch} = useUnitSelection();
  const [onlyShowSelected, setOnlyShowSelected] = useState(false);

  const selectUnitId = useCallback(
    (unitId: string) => {
      console.log('--- a', unitId, selectedUnitIds);
      unitSelectionDispatch({
        type: "SET_SELECTION",
        incomingSelectedUnitIds: [unitId]
      });
    },
    [unitSelectionDispatch, selectedUnitIds]
  );

  const toggleSelectUnitId = useCallback(
    (unitId: string) => {
      unitSelectionDispatch({
        type: "TOGGLE_UNIT",
        targetUnit: unitId
      });
    },
    [unitSelectionDispatch],
  );

  const boxMargin = 20;
  const boxWidth = useMemo(() => {
    if (width < 300) {
      return width - boxMargin * 2;
    }
    else if (width < 600) {
      return (width - boxMargin * 3) / 2;
    }
    else if (width < 900) {
      return (width - boxMargin * 4) / 3;
    }
    else {
      return (width - boxMargin * 5) / 4;
    }
  }, [width]);

  const aspectRatio = 1.6;
  const boxHeight = boxWidth / aspectRatio;

  // Determine which units to display
  const displayUnitIds = onlyShowSelected ? selectedUnitIds : allOrderedUnitIds;

  // Create a set for quick lookup of selected units
  const selectedUnitIdsSet = useMemo(
    () => new Set(selectedUnitIds),
    [selectedUnitIds]
  );

  const toolbarHeight = 50;
  const contentHeight = height - toolbarHeight;

  if (selectedUnitIds.length === 0 && onlyShowSelected) {
    return (
      <div style={{ width, height, display: "flex", flexDirection: "column" }}>
        <div
          style={{
            width,
            height: contentHeight,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontFamily: "Arial, sans-serif",
            color: "#666",
            backgroundColor: "#f8f8f8",
          }}
        >
          No units selected
        </div>
        <Toolbar
          width={width}
          height={toolbarHeight}
          onlyShowSelected={onlyShowSelected}
          onToggle={() => setOnlyShowSelected(!onlyShowSelected)}
        />
      </div>
    );
  }

  return (
    <div style={{ width, height, display: "flex", flexDirection: "column" }}>
      <div
        style={{
          width,
          height: contentHeight,
          overflowY: "auto",
          overflowX: "hidden",
          backgroundColor: "#f8f8f8",
          padding: boxMargin,
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: `${boxMargin}px`,
            alignContent: "flex-start",
          }}
        >
          {displayUnitIds.map((unitId) => {
            const isSelected = selectedUnitIdsSet.has(unitId);
            return (
              <div
                key={unitId}
                style={{
                  width: boxWidth,
                  height: boxHeight,
                  flexShrink: 0,
                  cursor: "pointer",
                  border: isSelected && !onlyShowSelected ? "3px solid #007bff" : "3px solid transparent",
                  borderRadius: "4px",
                  boxSizing: "border-box",
                }}
                onClick={(e) => {
                  if (e.ctrlKey || e.shiftKey) {
                    toggleSelectUnitId(String(unitId));
                  } else {
                    selectUnitId(String(unitId));
                  }
                }}
              >
                <TemplateView
                  client={client}
                  width={boxWidth - 6}
                  height={boxHeight - 6}
                  unitId={String(unitId)}
                />
              </div>
            );
          })}
        </div>
      </div>
      <Toolbar
        width={width}
        height={toolbarHeight}
        onlyShowSelected={onlyShowSelected}
        onToggle={() => setOnlyShowSelected(!onlyShowSelected)}
      />
    </div>
  );
};

type ToolbarProps = {
  width: number;
  height: number;
  onlyShowSelected: boolean;
  onToggle: () => void;
};

const Toolbar: React.FC<ToolbarProps> = ({ width, height, onlyShowSelected, onToggle }) => {
  return (
    <div
      style={{
        width,
        height,
        backgroundColor: "#fff",
        borderTop: "1px solid #ddd",
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        boxSizing: "border-box",
      }}
    >
      <label
        style={{
          display: "flex",
          alignItems: "center",
          cursor: "pointer",
          fontFamily: "Arial, sans-serif",
          fontSize: "14px",
          userSelect: "none",
        }}
      >
        <input
          type="checkbox"
          checked={onlyShowSelected}
          onChange={onToggle}
          style={{
            marginRight: "8px",
            cursor: "pointer",
          }}
        />
        Only show selected
      </label>
    </div>
  );
};

export default TemplatesView;
