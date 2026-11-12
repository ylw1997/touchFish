export interface DashAudioSegment {
  start: number;
  end: number;
  time: number;
  duration: number;
}

export interface DashAudioIndex {
  urls: string[];
  initialization: string;
  segments: DashAudioSegment[];
}
