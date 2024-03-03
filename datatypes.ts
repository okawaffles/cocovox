export interface I_SONG_LOCATION {
    Measure: number,
    Beat: number,
    Offset: number
}

export interface I_BPM_INFO {
    Location: I_SONG_LOCATION,
    BPM: number,
    Pause: boolean
}

export interface I_BEAT_INFO {
    Location: I_SONG_LOCATION,
    Numerator: number,
    Denominator: number
}