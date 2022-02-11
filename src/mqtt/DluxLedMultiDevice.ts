import { DluxLedAction } from "../led/enums";
import { DluxLedStatus, IScene } from "../led/interfaces";
import { Color } from "../led/types";
import { DluxLedDevice } from "./DluxLedDevice";
import { IDluxSubscription } from "./DluxMqttDevice";

export class DluxLedMultiDevice extends DluxLedDevice {
  constructor(name: string, public readonly devices: DluxLedDevice[]) {
    super({
      name,
      topic: "",
    });
  }

  public override get state(): DluxLedStatus {
    throw new Error(`DluxLedMultiDevice "${this.name}" does not have a state"`);
  }

  public override get online(): boolean {
    return this.devices.reduce<boolean>((res, d) => res || d.online, false);
  }

  public override get statusString(): string {
    return this.devices.map(d => d.statusString).join(", ");
  }

  public override get subscriptions(): IDluxSubscription[] {
    return [];
  }

  public override initialize(): this {
    return this;
  }
  public override scene<C extends Color>(scene: IScene<C> | Buffer): void {
    this.devices.forEach(d => d.scene(scene));
  }

  public override action(a: DluxLedAction): void {
    this.devices.forEach(d => d.action(a));
  }

  public override copyTo(): void {
    return;
  }
}
