import React, { useState } from "react";

type Props = {
  width: number;
  height: number;
  tabLabels: string[];
  children: React.ReactNode;
};

const TabLayout: React.FC<Props> = ({ width, height, tabLabels, children }) => {
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const childrenArray = React.Children.toArray(children);

  const tabHeight = 40;
  const contentHeight = height - tabHeight;

  return (
    <div
      style={{
        width,
        height,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Tab Headers */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          height: tabHeight,
          borderBottom: "1px solid #ccc",
          backgroundColor: "#f5f5f5",
        }}
      >
        {tabLabels.map((label, index) => (
          <button
            key={index}
            onClick={() => setActiveTabIndex(index)}
            style={{
              padding: "10px 20px",
              cursor: "pointer",
              border: "none",
              borderBottom: activeTabIndex === index ? "2px solid #007bff" : "none",
              backgroundColor: activeTabIndex === index ? "#fff" : "transparent",
              fontWeight: activeTabIndex === index ? "bold" : "normal",
              color: activeTabIndex === index ? "#007bff" : "#666",
              transition: "all 0.2s",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div
        style={{
          flex: 1,
          height: contentHeight,
          overflow: "hidden",
        }}
      >
        {childrenArray.map((child, index) => (
          <div
            key={index}
            style={{
              width,
              height: contentHeight,
              display: index === activeTabIndex ? "block" : "none",
            }}
          >
            {React.isValidElement(child)
              ? React.cloneElement(child, {
                  width,
                  height: contentHeight,
                } as Record<string, unknown>)
              : child}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TabLayout;
