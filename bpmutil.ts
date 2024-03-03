import { I_BEAT_INFO, I_BPM_INFO } from "./datatypes";

/**
 * Counts the number of beats until the next BPM change.
 * Note that the name is a bit of a lie, as it counts until the next BPM change and NOT the pause end. 
 * I will rename it to be accurate sometime.
 * @param current current BPM
 * @param next next BPM
 * @param timeSignature the current time signature
 * @returns number of beats until next time change
 */
export function CountBPMPauseBeats(current: I_BPM_INFO, next: I_BPM_INFO, timeSignature: I_BEAT_INFO): number {
    let beats: number = 0;

    // get the amount of measures between the locations
    let measuresBetween: number = next.Location.Measure - current.Location.Measure;

    // get the amount of individual beats between the locations
    // example we're working with here: xxx,00,zz -> xxx,04,zz in 4/4 time
    let beatsBetween: number = 0;
    if (current.Location.Beat <= next.Location.Beat) beatsBetween = next.Location.Beat - current.Location.Beat;
    else {
        // now that means we're working with something like xxx,03,zz -> xxx,00,zz
        // we will carry a measure over to allow this
        measuresBetween--;
        beatsBetween = timeSignature.Numerator;

        // then we just subtract how many are already used by current location
        beatsBetween -= current.Location.Beat;
    }

    // ex: 3 measures in 4/4 time is 12 beats
    beats += measuresBetween * timeSignature.Numerator;
    beats += beatsBetween;

    return beats;
}

/**
 * Check whether or not the current BPM change will end the chart's current pause.
 * Due to an unknown reason, changing the BPM in the middle of a pause with the pause flag set to true will NOT unpause the chart.
 * @param previous The previous `I_BPM_INFO` to compare against
 * @param current The current `I_BPM_INFO`
 * @returns true if it will unpause, false if it won't
 */
export function CheckIfBPMChangeUnpauses(previous: I_BPM_INFO, current: I_BPM_INFO): boolean {
    return (previous.BPM == current.BPM) && (!current.Pause);
}