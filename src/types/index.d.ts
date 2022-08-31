import * as PIXI from 'pixi.js';

export as namespace PIXI;
export = PIXI;

declare global {
  namespace PIXI {}
  const app: PIXI.Application;
}
