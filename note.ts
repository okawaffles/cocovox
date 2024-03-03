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

export interface Note {
    BT_A: BT_States,
    BT_B: BT_States,
    BT_C: BT_States,
    BT_D: BT_States,
    FX_L: BT_States,
    FX_R: BT_States,
    VOL_L: VOL_States,
    VOL_R: VOL_States
}