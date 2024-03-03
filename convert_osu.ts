// https://osu.ppy.sh/wiki/en/Client/File_formats/osu_%28file_format%29#osu!mania

import { appendFileSync, writeFileSync } from "fs";
import { I_BEAT_INFO, I_BPM_INFO, I_SONG_LOCATION } from "./datatypes";
import { BT_Note, BT_States } from "./note";
import { info } from "okayulogger";

const resource = require('../common_resource.json').osuconverter;

const TICKS_PER_BEAT = 48;
const DEFAULT_Y = 192;
const LANES_4K = [
    64,
    192,
    320,
    448,
];

const OUTPUT_LOCATION = "D:\\osu!\\Songs\\_cocovox-test\\out.osu";

function ConvertVOXLocationToMS(location: I_SONG_LOCATION, bpm: I_BPM_INFO, timesig: I_BEAT_INFO): number {
    // example bpm: 120 = 500 ms per beat
    const MSPerBeat: number = 60000 / bpm.BPM;

    // step 1. convert it to beats
    // step 2. multiply by MSPerBeat
    const MSFromMeasures: number = location.Measure * timesig.Numerator * MSPerBeat;
    // this one is self explanatory...
    const MSFromBeats: number = location.Beat * MSPerBeat;

    const MSFromOffset: number = (MSPerBeat / TICKS_PER_BEAT) * location.Offset;

    const MS: number = MSFromMeasures + MSFromBeats + MSFromOffset;
    return MS;
}

// This function only works with luminous days rn
export function ConvertToOsuChart(track_bt_a: Array<BT_Note>, track_bt_b: Array<BT_Note>, track_bt_c: Array<BT_Note>, track_bt_d: Array<BT_Note>, BPMs: Array<I_BPM_INFO>, timesigs: Array<I_BEAT_INFO>) {
    info('osuconverter', 'Starting vox->osu! conversion...');
    const raw_lines_to_write: Array<string> = [
        resource.sections.METADATA,
        "Title:converter test",
        "Creator:okawaffles",
        "Artist:cocovox",
        "Version:4K Test\n",

        "[TimingPoints]",
        "0,413.793103,4,2,0,30,1,0\n",

        resource.sections.GENERAL,
        "AudioFilename: 1153_luminousdays_coconatsu.mp3",
        "Mode: 3",
        "AudioLeadIn: 0",
        "PreviewTime: 0",
        "SampleSet: Soft",
        "StackLeniency: 0.7",
        "LetterboxInBreaks: 0",
        "SpecialStyle: 0",
        "WidescreenStoryboard: 0\n",

        "[Difficulty]",
        "HPDrainRate:8",
        "CircleSize:4",
        "OverallDifficulty:8",
        "ApproachRate:5",
        "SliderMultiplier:1.4",
        "SliderTickRate:1\n",

        resource.sections.OBJECTS,
    ];

    // convert all BT_A to osu note syntax
    track_bt_a.forEach((note: BT_Note) => {
        let convertedLine: string;
        
        // ez chip notes:
        if (note.State == BT_States.BT_STATE_CHIP)
            convertedLine = `${LANES_4K[0]},${DEFAULT_Y},${ConvertVOXLocationToMS(note.Location, BPMs[0], timesigs[0])}:0:0:0:0:`;
        else {
            const MSPerBeat: number = 60000 / BPMs[0].BPM;
            const endTime: number = (<number> note.HoldBeats) * MSPerBeat;
            convertedLine = `${LANES_4K[0]},${DEFAULT_Y},${ConvertVOXLocationToMS(note.Location, BPMs[0], timesigs[0])},0,${endTime}:0:0:0:0:`;
        }

        raw_lines_to_write.push(convertedLine);
    });

    // write the file
    let line = 0;
    writeFileSync(OUTPUT_LOCATION, resource.signature + '\n\n');
    while(raw_lines_to_write[line] != undefined) {
        appendFileSync(OUTPUT_LOCATION, raw_lines_to_write[line] + '\r\n');
        line++;
    }

    info('osuconverter', `Done! Wrote ${line} lines.`);
}