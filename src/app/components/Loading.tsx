import React from "react";

interface LoadingProps {
  text?: string;
}

const Loading: React.FC<LoadingProps> = ({ text = "Đang tải dữ liệu..." }) => (
  <div className="flex flex-col items-center justify-center py-12">
    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    <p className="mt-4 text-slate-300">{text}</p>
  </div>
);

export default Loading; 