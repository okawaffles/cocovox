import { I_SONG_LOCATION } from "./datatypes"

export enum BT_States {
    BT_STATE_NONE,
    BT_STATE_CHIP,
    BT_STATE_HOLD,
    BT_STATE_HOLD_START,
    BT_STATE_HOLD_END
}
export enum VOL_States {
    VOL_STATE_NONE,
    VOL_STATE_SLAM,
    VOL_STATE_CONTINUE,
    VOL_STATE_END
}

export enum BT_NOTE_TYPE {
    BT_A = 0,
    BT_B,
    BT_C,
    BT_D,
    FX_L,
    FX_R
}

export enum VOL_TYPE {
    VOL_L = 0,
    VOL_R
}

export interface BT_Note {
    Location: I_SONG_LOCATION,
    Type: BT_NOTE_TYPE,
    State: BT_States,
    HoldBeats?: number
    some_param_b: number
}

export interface VOL_Note {
    Location: I_SONG_LOCATION,
    Type: VOL_TYPE,
    State: VOL_States
}