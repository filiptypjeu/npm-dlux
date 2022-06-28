import { DluxLedAction } from "./enums";
import { IScene } from "./interfaces";
import { Color } from "./types";
import { DluxLedDevice } from "./LedDevice";
import { IDluxSubscription } from "../mqtt/types";

export class DluxLedMultiDevice extends DluxLedDevice {
  constructor(name: string, public readonly devices: DluxLedDevice[]) {
    super({
      name,
      topic: "",
    });
  }

  public override get online(): boolean {
    return this.devices.reduce<boolean>((res, d) => res || d.online, false);
  }

  public override get subscriptions(): IDluxSubscription[] {
    return [];
  }

  public override initialize(..._agrs: any[]): this {
    return this;
  }

  public override scene<C extends Color>(scene: IScene<C> | Buffer): void {
    this.devices.forEach(d => d.scene(scene));
  }

  public override action(a: DluxLedAction): void {
    this.devices.forEach(d => d.action(a));
  }

  public override copyTo(..._agrs: any[]): void {
    return;
  }
}
