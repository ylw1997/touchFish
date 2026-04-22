import { window, StatusBarAlignment, StatusBarItem, Disposable, EventEmitter, Event } from "vscode";

export type MusicModule = "qqmusic" | "xiaoyuzhou";

export interface PlaybackStatus {
  title: string;
  artist?: string;
  isPlaying: boolean;
  module: MusicModule;
}

export class MusicStatusBar implements Disposable {
  private static instance: MusicStatusBar;
  private statusBarItem: StatusBarItem;
  private playPauseButton: StatusBarItem;
  private nextButton: StatusBarItem;

  private _onPlaybackInterrupt = new EventEmitter<MusicModule>();
  public readonly onPlaybackInterrupt: Event<MusicModule> = this._onPlaybackInterrupt.event;

  private activeModule: MusicModule | null = null;
  private isPlaying = false;
  private title = "";

  private constructor() {
    this.statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left, 100);
    this.playPauseButton = window.createStatusBarItem(StatusBarAlignment.Left, 99);
    this.nextButton = window.createStatusBarItem(StatusBarAlignment.Left, 98);

    this.statusBarItem.command = "touchfish.music.openActive";
    this.playPauseButton.command = "touchfish.music.playPause";
    this.nextButton.command = "touchfish.music.next";

    this.statusBarItem.text = "$(music) 摸鱼播放器";
    this.playPauseButton.text = "$(debug-start)";
    this.nextButton.text = "$(chevron-right)";
    
    // 初始状态隐藏，只有当有播放任务时才显示
    this.hide();
  }

  public static getInstance(): MusicStatusBar {
    if (!MusicStatusBar.instance) {
      MusicStatusBar.instance = new MusicStatusBar();
    }
    return MusicStatusBar.instance;
  }

  public update(status: PlaybackStatus) {
    if (status.isPlaying) {
      if (this.activeModule && this.activeModule !== status.module) {
        // 另一个播放器开始播放了，通知原播放器暂停
        this._onPlaybackInterrupt.fire(status.module);
      }
      this.activeModule = status.module;
      this.title = status.title;
      this.isPlaying = true;
    } else {
      // 如果它不是当前激活的模块（比如它只是被互斥逻辑暂停了），就不理它
      if (this.activeModule !== status.module) {
        return;
      }
      this.isPlaying = false;
    }

    const moduleName = this.activeModule === "qqmusic" ? "QQ音乐" : "小宇宙";
    
    this.statusBarItem.text = `$(music) ${this.title}`;
    this.statusBarItem.tooltip = `正在播放 (${moduleName}): ${this.title}${status.artist ? ` - ${status.artist}` : ""}\n点击: 打开播放器面板`;
    
    this.playPauseButton.text = this.isPlaying ? "$(debug-pause)" : "$(debug-start)";
    this.playPauseButton.tooltip = this.isPlaying ? "暂停" : "播放";

    this.statusBarItem.show();
    this.playPauseButton.show();
    this.nextButton.show();
  }

  public hide() {
    this.statusBarItem.hide();
    this.playPauseButton.hide();
    this.nextButton.hide();
  }

  public getActiveModule(): MusicModule | null {
    return this.activeModule;
  }

  public dispose() {
    this.statusBarItem.dispose();
    this.playPauseButton.dispose();
    this.nextButton.dispose();
  }
}
