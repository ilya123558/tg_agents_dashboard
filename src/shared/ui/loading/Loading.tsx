type LoadingProps = {
  size?: number;            // px
  trackColor?: string;     // CSS color
  indicatorColor?: string; // CSS color
  speed?: number;          // seconds
  strokeWidth?: number;    // px
};

export const Loading = ({
  size = 40,
  trackColor = "#DBEAFE",      // blue-200
  indicatorColor = "#2563EB",  // blue-600
  speed = 0.8,
  strokeWidth = 4,
}: LoadingProps) => {
  return (
    <div className="flex items-center justify-center">
      <div
        className="rounded-full animate-spin"
        style={{
          width: size,
          height: size,
          borderWidth: strokeWidth,
          borderStyle: "solid",
          borderColor: trackColor,
          borderTopColor: indicatorColor,
          animationDuration: `${speed}s`,
        }}
      />
    </div>
  );
};
