// https://osu.ppy.sh/wiki/en/Client/File_formats/osu_%28file_format%29#osu!mania

import { appendFileSync, writeFileSync } from "fs";
import { I_BEAT_INFO, I_BPM_INFO, I_SONG_LOCATION } from "./datatypes";
import { BT_Note, BT_States } from "./note";
import { info, warn } from "okayulogger";

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

    const MS: number = MSFromMeasures + MSFromBeats + MSFromOffset - (MSPerBeat*5); // 5 measures off for some reason?!
    return MS;
}

interface osumania_chip {
    x: number,
    y: number,
    time: number,
    someParamA: number,
    someParamB: number,
}
interface osumania_long {
    x: number,
    y: number,
    time: number,
    endTime: number,
    someParamA: number,
    someParamB: number,
}

function SortByMS(a: osumania_chip | osumania_long, b: osumania_chip | osumania_long) {
    return a.time - b.time;
}

export function ConvertToOsuChart(track_bt_a: Array<BT_Note>, track_bt_b: Array<BT_Note>, track_bt_c: Array<BT_Note>, track_bt_d: Array<BT_Note>, BPMs: Array<I_BPM_INFO>, timesigs: Array<I_BEAT_INFO>) {
    info('osuconverter', 'Starting vox->osu! conversion...');
    
    if (timesigs.length > 1) {
        warn('osuconverter', 'The vox->osu! converter currently **DOES NOT** support multiple time signatures, and will always use the first one! Your map may be UNPLAYABLE!');
    }

    const TimingPoints: Array<string> = [];

    if (BPMs.length == 1) {
        TimingPoints.push(`0,${60000/BPMs[0].BPM},4,2,0,100,1,0\n`);
    } else {
        BPMs.forEach((BPM: I_BPM_INFO) => {
            const time = ConvertVOXLocationToMS(BPM.Location, BPM, timesigs[0]);
            TimingPoints.push(`${time},${60000/BPM.BPM},4,2,0,100,1,0`);
        });
    }
    
    const raw_lines_to_write: Array<string> = [
        resource.sections.METADATA,
        "Title:converter test",
        "Creator:okawaffles",
        "Artist:cocovox",
        "Version:4K Test\n",

        resource.sections.GENERAL,
        "AudioFilename: audio.mp3",
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

    // this allows us to forEach loop through all the tracks:
    const tracks: Array<Array<BT_Note>> = [
        track_bt_a,
        track_bt_b,
        track_bt_c,
        track_bt_d
    ]

    let object_count = 0;
    let notes: Array<any> = [];

    // convert all BT_A to osu note syntax
    tracks.forEach((track: Array<BT_Note>) => {
        track.forEach((note: BT_Note) => {
            const NoteBeat: number = (note.Location.Measure*timesigs[0].Numerator) + note.Location.Beat;
            let CurrentBPM: I_BPM_INFO = BPMs[0];

            // go through every BPM (very efficient, i know :3) to find which BPM is active.
            BPMs.forEach((BPM: I_BPM_INFO) => {
                const BPMBeat: number = (BPM.Location.Measure*timesigs[0].Numerator) + BPM.Location.Beat;
                if (BPMBeat <= NoteBeat) CurrentBPM = BPM;
            });

            object_count++;
            let convertedLine: string;
            
            //ex hold: 64,192,1630,128,2,2446:0:0:0:0:
            //ex chip: 448,192,1630,1,4,0:0:0:0:

            console.log(`note ${object_count} with bpm ${CurrentBPM.BPM}`);

            // ez chip notes:
            if (note.State == BT_States.BT_STATE_CHIP) {
                notes.push(<osumania_chip> {
                    x: LANES_4K[tracks.indexOf(track)],
                    y: DEFAULT_Y,
                    time: ConvertVOXLocationToMS(note.Location, CurrentBPM, timesigs[0]),
                    someParamA: 1,
                    someParamB: 0
                });
            } else {
                // long note
                const MSPerBeat: number = 60000 / CurrentBPM.BPM;
                const endTime: number = (<number> note.HoldBeats) * MSPerBeat;
                notes.push(<osumania_long> {
                    x: LANES_4K[tracks.indexOf(track)],
                    y: DEFAULT_Y,
                    time: ConvertVOXLocationToMS(note.Location, CurrentBPM, timesigs[0]),
                    endTime: endTime,
                    someParamA: 1,
                    someParamB: 0
                });
            }
        });
    });

    // sort all the notes by time
    notes.sort(SortByMS);

    notes.forEach((note) => {
        let convertedLine: string;

        if (note.endTime != 'undefined') {
            // is a long
            convertedLine = `${note.x},${note.y},${note.time},${note.someParamA},${note.someParamB},0:0:0:0:`;
        } else {
            // is a chip
            convertedLine = `${note.x},${note.y},${note.time},0,${note.endTime},${note.someParamA},${note.someParamB},0:0:0:0:`;
        }
        raw_lines_to_write.push(convertedLine);
    });


    // write the file
    let line = 0;
    writeFileSync(OUTPUT_LOCATION, resource.signature + '\n\n');
    while(raw_lines_to_write[line] != undefined) {
        if (raw_lines_to_write[line] == '[HitObjects]') {
            // write all our timingpoints before hitobjects
            appendFileSync(OUTPUT_LOCATION, '[TimingPoints]\n')
            TimingPoints.forEach((point: string) => {
                appendFileSync(OUTPUT_LOCATION, point + '\n');
            });
            appendFileSync(OUTPUT_LOCATION, '\n');
        }

        appendFileSync(OUTPUT_LOCATION, raw_lines_to_write[line] + '\n');
        line++;
    }

    info('osuconverter', `Done! Wrote ${object_count} objects.`);
}