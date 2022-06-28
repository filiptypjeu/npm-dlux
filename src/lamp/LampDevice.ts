import { DluxLampCommand } from "./enums";
import { DluxLamp } from "./interfaces";
import { DluxMqttDevice } from "../mqtt/DluxMqttDevice";
import { IDluxSubscription } from "../mqtt/types";

type BaseOptions = ConstructorParameters<typeof DluxMqttDevice>[0];
interface Callbacks extends NonNullable<BaseOptions["callbacks"]> {
  lamps?: (newLamps: string) => void;
}
interface Options extends BaseOptions {
  callbacks?: Callbacks;
}

export class DluxLampDevice extends DluxMqttDevice<Callbacks> {
  public lamps: string = "";

  constructor(o: Options) {
    super(o);
  }

  protected override deviceSubscriptions(): IDluxSubscription[] {
    return super.deviceSubscriptions().concat([
      {
        topic: this.topic + "/lamps",
        callback: msg => {
          this.lamps = msg.toString();
          if (this.m_callbacks.lamps) this.m_callbacks.lamps(this.lamps);
        },
      },
    ]);
  }

  public setLamp(lamp: DluxLamp): void {
    if (lamp.index < 0) return;
    this._publish(`${this.topic}/l/${lamp.index + 1}`, lamp.state);
  }

  public setLamps(lamps: DluxLamp[]): void {
    if (!lamps.length) return;

    if (lamps.length === 1) {
      this.setLamp(lamps[0]);
      return;
    }

    // Search for the largest index
    let i = -1;
    for (const lamp of lamps) {
      if (lamp.index > i) {
        i = lamp.index;
      }
    }

    if (i < 0) {
      return;
    }

    const a = Array(i + 1).fill(DluxLampCommand.NO_CHANGE);
    for (const lamp of lamps) {
      if (lamp.index < 0) continue;
      a[lamp.index] = lamp.state;
    }

    this._publish(this.topic + "/l", a.join(""));
  }
}
