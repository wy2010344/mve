export class MouseEvent {
  stoppedProgression = false;

  constructor(
    readonly x: number,
    readonly y: number,
    readonly globalX: number,
    readonly globalY: number,
  ) {}

  stopPropagation(): void {
    this.stoppedProgression = true;
  }
}
