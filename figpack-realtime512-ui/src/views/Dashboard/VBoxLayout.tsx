import React from "react";

type Props = {
  width: number;
  height: number;
  heights?: number[] | ((height: number) => number[]);
  children: React.ReactNode;
};

const VBoxLayout: React.FC<Props> = ({ width, height, heights, children }) => {
  const childrenArray = React.Children.toArray(children);
  const childCount = childrenArray.length;

  if (childCount === 0) {
    return null;
  }

  // Resolve heights: if it's a function, call it with height; otherwise use as-is
  const resolvedHeights = typeof heights === 'function' ? heights(height) : heights;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width,
        height,
        overflow: "hidden",
      }}
    >
      {childrenArray.map((child, index) => {
        const childHeight = resolvedHeights ? resolvedHeights[index] : height / childCount;
        return (
          <div
            key={index}
            style={{
              width,
              height: childHeight,
              overflow: "hidden",
            }}
          >
            {React.isValidElement(child)
              ? React.cloneElement(child, { width, height: childHeight } as Record<string, unknown>)
              : child}
          </div>
        );
      })}
    </div>
  );
};

export default VBoxLayout;
