import React, { useEffect, useState } from "react";

// 爆炸总帧数（与你的图片数量保持一致）
const frameCount = 16;

// 每帧持续时间（毫秒），数值越小动画越快
const frameDuration = 32;

/**
 * 爆炸动画组件
 * @param {number} x - 爆炸左上角的横坐标（像素，相对于棋盘容器）
 * @param {number} y - 爆炸左上角的纵坐标（像素）
 * @param {number} size - 动画显示尺寸（通常填格子宽度）
 * @param {function} onFinish - 播放完毕回调
 */
export default function Explosion({ x, y, size = 48, onFinish }) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (frame < frameCount - 1) {
      const timer = setTimeout(() => setFrame(frame + 1), frameDuration);
      return () => clearTimeout(timer);
    } else {
      // 最后一帧显示结束后回调
      const timer = setTimeout(() => {
        if (onFinish) onFinish();
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [frame, onFinish]);

  return (
    <img
      src={`/explosion/explosion${frame + 1}.png`}
      alt=""
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
        pointerEvents: "none",
        zIndex: 20,
        userSelect: "none"
      }}
      draggable={false}
    />
  );
}
