/**
 * Custom gesture classifier using hand landmark positions.
 * Detects gestures beyond MediaPipe's built-in 7 by analyzing
 * finger extension states and relative landmark positions.
 */

interface Landmark {
  x: number;
  y: number;
  z: number;
}

interface FingerState {
  thumb: boolean;
  index: boolean;
  middle: boolean;
  ring: boolean;
  pinky: boolean;
}

// Landmark indices
const WRIST = 0;
const THUMB_CMC = 1, THUMB_MCP = 2, THUMB_IP = 3, THUMB_TIP = 4;
const INDEX_MCP = 5, INDEX_PIP = 6, INDEX_DIP = 7, INDEX_TIP = 8;
const MIDDLE_MCP = 9, MIDDLE_PIP = 10, MIDDLE_DIP = 11, MIDDLE_TIP = 12;
const RING_MCP = 13, RING_PIP = 14, RING_DIP = 15, RING_TIP = 16;
const PINKY_MCP = 17, PINKY_PIP = 18, PINKY_DIP = 19, PINKY_TIP = 20;

function dist(a: Landmark, b: Landmark): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);
}

function dist2d(a: Landmark, b: Landmark): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function isFingerExtended(lm: Landmark[], pip: number, dip: number, tip: number, mcp: number): boolean {
  // A finger is extended if its tip is farther from wrist than its PIP joint
  // and the tip-to-pip distance is significant
  const tipToWrist = dist2d(lm[tip], lm[WRIST]);
  const pipToWrist = dist2d(lm[pip], lm[WRIST]);
  const tipToPip = dist2d(lm[tip], lm[pip]);
  const mcpToPip = dist2d(lm[mcp], lm[pip]);
  
  // Tip is further from wrist than PIP, and finger isn't curled
  return tipToWrist > pipToWrist && lm[tip].y < lm[pip].y;
}

function isThumbExtended(lm: Landmark[]): boolean {
  const thumbTipToIndex = dist2d(lm[THUMB_TIP], lm[INDEX_MCP]);
  const thumbMcpToIndex = dist2d(lm[THUMB_MCP], lm[INDEX_MCP]);
  return thumbTipToIndex > thumbMcpToIndex * 0.8;
}

function getFingerStates(lm: Landmark[]): FingerState {
  return {
    thumb: isThumbExtended(lm),
    index: isFingerExtended(lm, INDEX_PIP, INDEX_DIP, INDEX_TIP, INDEX_MCP),
    middle: isFingerExtended(lm, MIDDLE_PIP, MIDDLE_DIP, MIDDLE_TIP, MIDDLE_MCP),
    ring: isFingerExtended(lm, RING_PIP, RING_DIP, RING_TIP, RING_MCP),
    pinky: isFingerExtended(lm, PINKY_PIP, PINKY_DIP, PINKY_TIP, PINKY_MCP),
  };
}

function countExtended(f: FingerState): number {
  return [f.thumb, f.index, f.middle, f.ring, f.pinky].filter(Boolean).length;
}

export interface CustomGestureResult {
  name: string;
  emoji: string;
  confidence: number;
}

export function classifyCustomGesture(landmarks: Landmark[]): CustomGestureResult | null {
  if (landmarks.length < 21) return null;

  const lm = landmarks;
  const f = getFingerStates(lm);
  const extended = countExtended(f);

  // Distance helpers
  const thumbIndexDist = dist(lm[THUMB_TIP], lm[INDEX_TIP]);
  const thumbMiddleDist = dist(lm[THUMB_TIP], lm[MIDDLE_TIP]);
  const thumbRingDist = dist(lm[THUMB_TIP], lm[RING_TIP]);
  const thumbPinkyDist = dist(lm[THUMB_TIP], lm[PINKY_TIP]);
  const indexMiddleDist = dist(lm[INDEX_TIP], lm[MIDDLE_TIP]);
  const palmSize = dist(lm[WRIST], lm[MIDDLE_MCP]);

  // ===== Custom gestures (checked in priority order) =====

  // 1. OK Sign: thumb and index tips touching, other fingers extended
  if (thumbIndexDist < palmSize * 0.25 && f.middle && f.ring && f.pinky) {
    return { name: "OK Sign", emoji: "👌", confidence: 0.85 };
  }

  // 2. Pinch: thumb and index close, others curled
  if (thumbIndexDist < palmSize * 0.2 && !f.middle && !f.ring && !f.pinky) {
    return { name: "Pinch", emoji: "🤏", confidence: 0.82 };
  }

  // 3. Rock / Horns: index and pinky up, middle and ring down
  if (f.index && f.pinky && !f.middle && !f.ring) {
    return { name: "Rock On", emoji: "🤘", confidence: 0.88 };
  }

  // 4. Call Me / Shaka: thumb and pinky out, others curled
  if (f.thumb && f.pinky && !f.index && !f.middle && !f.ring) {
    return { name: "Call Me", emoji: "🤙", confidence: 0.85 };
  }

  // 5. Finger Gun: thumb and index extended, others curled
  if (f.thumb && f.index && !f.middle && !f.ring && !f.pinky) {
    return { name: "Finger Gun", emoji: "👉", confidence: 0.83 };
  }

  // 6. L Shape: thumb and index at right angle
  if (f.thumb && f.index && !f.middle && !f.ring && !f.pinky) {
    const angle = Math.abs(lm[THUMB_TIP].x - lm[INDEX_TIP].x);
    if (angle > palmSize * 0.3) {
      return { name: "L Shape", emoji: "🔷", confidence: 0.80 };
    }
  }

  // 7. Spider-Man: thumb, index, pinky extended, middle and ring curled
  if (f.thumb && f.index && !f.middle && !f.ring && f.pinky) {
    return { name: "Spider-Man", emoji: "🕷️", confidence: 0.85 };
  }

  // 8. Three Fingers: index, middle, ring up
  if (f.index && f.middle && f.ring && !f.pinky && !f.thumb) {
    return { name: "Three", emoji: "3️⃣", confidence: 0.84 };
  }

  // 9. Four Fingers: all except thumb
  if (f.index && f.middle && f.ring && f.pinky && !f.thumb) {
    return { name: "Four", emoji: "4️⃣", confidence: 0.86 };
  }

  // 10. Index + Middle (Scout): index and middle extended, others curled (not peace - different from V)
  if (f.index && f.middle && !f.ring && !f.pinky && !f.thumb) {
    if (indexMiddleDist < palmSize * 0.15) {
      return { name: "Scout Salute", emoji: "🫡", confidence: 0.80 };
    }
  }

  // 11. Crossed Fingers: index and middle close and crossing
  if (f.index && f.middle && !f.ring && !f.pinky) {
    const indexX = lm[INDEX_TIP].x;
    const middleX = lm[MIDDLE_TIP].x;
    if (Math.abs(indexX - middleX) < palmSize * 0.05) {
      return { name: "Crossed Fingers", emoji: "🤞", confidence: 0.78 };
    }
  }

  // 12. Pinky Promise: only pinky extended
  if (f.pinky && !f.index && !f.middle && !f.ring && !f.thumb) {
    return { name: "Pinky Promise", emoji: "🤙", confidence: 0.83 };
  }

  // 13. Middle Finger (only middle extended)
  if (f.middle && !f.index && !f.ring && !f.pinky && !f.thumb) {
    return { name: "Middle Finger", emoji: "🖕", confidence: 0.85 };
  }

  // 14. Ring Finger: only ring extended (rare but detectable)
  if (f.ring && !f.index && !f.middle && !f.pinky && !f.thumb) {
    return { name: "Ring Finger", emoji: "💍", confidence: 0.75 };
  }

  // 15. Index Only: just index pointing (straight up handled by MediaPipe, this catches other angles)
  if (f.index && !f.middle && !f.ring && !f.pinky && !f.thumb) {
    return { name: "Pointing", emoji: "👆", confidence: 0.84 };
  }

  // 16. Thumb Only: only thumb out (differs from thumbs up by angle)
  if (f.thumb && !f.index && !f.middle && !f.ring && !f.pinky) {
    const thumbY = lm[THUMB_TIP].y;
    const wristY = lm[WRIST].y;
    if (thumbY > wristY) {
      return { name: "Thumb Down", emoji: "👎", confidence: 0.80 };
    }
    return { name: "Thumb Out", emoji: "👍", confidence: 0.80 };
  }

  // 17. Claw / Grab: all fingers slightly curled but spread
  if (extended === 0) {
    const spread = dist2d(lm[INDEX_TIP], lm[PINKY_TIP]);
    if (spread > palmSize * 0.4) {
      return { name: "Claw", emoji: "🦀", confidence: 0.75 };
    }
  }

  // 18. Snap position: thumb touching middle finger
  if (thumbMiddleDist < palmSize * 0.15 && !f.ring && !f.pinky) {
    return { name: "Snap", emoji: "🫰", confidence: 0.78 };
  }

  // 19. Money gesture: thumb rubbing index/middle
  if (thumbIndexDist < palmSize * 0.2 && thumbMiddleDist < palmSize * 0.2 && !f.ring && !f.pinky) {
    return { name: "Money", emoji: "💰", confidence: 0.76 };
  }

  // 20. Write/Pen grip: thumb, index, middle close together
  if (thumbIndexDist < palmSize * 0.2 && thumbMiddleDist < palmSize * 0.25 && indexMiddleDist < palmSize * 0.15 && !f.ring && !f.pinky) {
    return { name: "Pen Grip", emoji: "✍️", confidence: 0.74 };
  }

  return null;
}
