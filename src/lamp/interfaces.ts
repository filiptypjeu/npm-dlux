import { DluxLampCommand } from "./enums";

export interface DluxLamp {
  index: number;
  state: DluxLampCommand;
}
