import React from "react";

type Props = {
  width: number;
  height: number;
  widths?: number[] | ((width: number) => number[]);
  children: React.ReactNode;
};

const HBoxLayout: React.FC<Props> = ({ width, height, widths, children }) => {
  const childrenArray = React.Children.toArray(children);
  const childCount = childrenArray.length;

  if (childCount === 0) {
    return null;
  }

  // Resolve widths: if it's a function, call it with width; otherwise use as-is
  const resolvedWidths = typeof widths === 'function' ? widths(width) : widths;
  const childLefts: number[] = [];
  if (resolvedWidths) {
    let cumulativeLeft = 0;
    for (let i = 0; i < childCount; i++) {
      childLefts.push(cumulativeLeft);
      cumulativeLeft += resolvedWidths[i];
    }
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        width,
        height,
        overflow: "hidden",
      }}
    >
      {childrenArray.map((child, index) => {
        const childWidth = resolvedWidths ? resolvedWidths[index] : width / childCount;
        return (
          <div
            key={index}
            style={{
              position: "absolute",
              left: childLefts[index] || 0,
              width: childWidth,
              height,
              overflow: "hidden",
            }}
          >
            {React.isValidElement(child)
              ? React.cloneElement(child, { width: childWidth, height } as Record<string, unknown>)
              : child}
          </div>
        );
      })}
    </div>
  );
};

export default HBoxLayout;
