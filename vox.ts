import { Note, BT_States, VOL_States } from "./note";
import { info, warn, error } from 'okayulogger';
import { readFileSync } from "fs";
import { I_BPM_INFO, I_SONG_LOCATION } from "./datatypes";

const resources = require('../common_resource.json');
const metaSearchStrings = resources.system.fileformat.search_meta;
const trackSearchStrings = resources.system.fileformat.search_track;


interface MarkerLocations {
    VERSION: number,
    BEAT_INFO?: number,
    BPM_INFO?: number,
    TILT_MODE_INFO?: number,
    END_POSITION_INFO?: number,
    TAB_EFFECT_INFO?: number,
    FXBUTTON_EFFECT_INFO?: number,
    TAB_PARAM_ASSIGN_INFO?: number,
    REVERB_EFFECT_PARAM?: number,
    TRACK_AUTO_TAB?: number,
    SPCONTROLLER?: number,
}
interface TrackLocations {
    BT_A?: number,
    BT_B?: number,
    BT_C?: number,
    BT_D?: number,
    FX_L?: number,
    FX_R?: number,
    VOL_L?: number,
    VOL_R?: number
}


/**
 * Holds everything related to the .vox file
 */
export class Vox {
    protected FILE_PATH: string;
    protected CHART_TIMESIG_NUM: number = 4; // numerator
    protected CHART_TIMESIG_DEN: number = 4; // denominator
    public CHART_NOTES: Array<Note> = [];
    protected VOX_VERSION: number = 0;
    protected FILE_LINES: Array<string> = [];
    public MARKERS: MarkerLocations = {
        VERSION: 0
    };
    public TRACKS: TrackLocations = {

    }

    /**
     * @param filePath The path to the .vox file to load
     */
    constructor(filePath: string) {
        this.FILE_PATH = filePath;

        // load the file and split it line-by-line
        const FILE = readFileSync(filePath, 'utf-8');
        this.FILE_LINES = FILE.split('\r\n');

        // get the version
        this.VOX_VERSION = this.ReadVoxVersion();
        if (this.VOX_VERSION != -1) {    
            // if it loaded the version successfully (confirms the .vox file is valid)
            info('VoxClass', `Initialized .vox file of version ${this.VOX_VERSION}`);

            // populate every marker we can
            this.PopulateMarkers();
        } else { 
            error('VoxClass', 'Failed to initialize .vox file.'); return; 
        }
    }

    /**
     * Get the vox file's version number
     * @returns the version of the vox file
     */
    private ReadVoxVersion(): number {
        try {
            let line = this.FILE_LINES.indexOf(metaSearchStrings.VERSION);
            
            if (line == -1) 
                throw new Error('Could not find version marker');
            else {
                // next line should be the version number
                let version: number = parseInt(<string> this.FILE_LINES.at(line + 1));
                if (Number.isNaN(version)) throw new Error('version is NaN');
                return version;
            }
        } catch (e: any) {
            error('vox.ts->Vox->ReadVoxVersion', 'Could not get .vox file version! Is this a valid .vox file?');
            error('vox.ts->Vox->ReadVoxVersion', e);
            return -1;
        }
    }
    
    /**
     * Loads all markers into `this.MARKERS`
     * Does not load VERSION as it should be initialized already.
     */
    private PopulateMarkers(): void {
        this.MARKERS.BEAT_INFO = this.FILE_LINES.indexOf(metaSearchStrings.BEAT);
        this.MARKERS.BPM_INFO = this.FILE_LINES.indexOf(metaSearchStrings.BPM);
        this.MARKERS.END_POSITION_INFO = this.FILE_LINES.indexOf(metaSearchStrings.END_POSITION);
        this.MARKERS.FXBUTTON_EFFECT_INFO = this.FILE_LINES.indexOf(metaSearchStrings.FXBUTTON_EFFECT);
        this.MARKERS.REVERB_EFFECT_PARAM = this.FILE_LINES.indexOf(metaSearchStrings.REVERB_EFFECT_PARAM);
        this.MARKERS.SPCONTROLLER = this.FILE_LINES.indexOf(metaSearchStrings.SPCONTROLLER);
        this.MARKERS.TAB_EFFECT_INFO = this.FILE_LINES.indexOf(metaSearchStrings.TAB_EFFECT);
        this.MARKERS.TAB_PARAM_ASSIGN_INFO = this.FILE_LINES.indexOf(metaSearchStrings.TAB_PARAM_ASSIGN);
        this.MARKERS.TILT_MODE_INFO = this.FILE_LINES.indexOf(metaSearchStrings.TILT_MODE);
        this.MARKERS.TRACK_AUTO_TAB = this.FILE_LINES.indexOf(metaSearchStrings.TRACK_AUTO_TAB);

        info('VoxClass', 'Populated meta markers');

        this.TRACKS.BT_A = this.FILE_LINES.indexOf(trackSearchStrings.BT_A);
        this.TRACKS.BT_B = this.FILE_LINES.indexOf(trackSearchStrings.BT_B);
        this.TRACKS.BT_C = this.FILE_LINES.indexOf(trackSearchStrings.BT_C);
        this.TRACKS.BT_D = this.FILE_LINES.indexOf(trackSearchStrings.BT_D);
        this.TRACKS.FX_L = this.FILE_LINES.indexOf(trackSearchStrings.FX_L);
        this.TRACKS.FX_R = this.FILE_LINES.indexOf(trackSearchStrings.FX_R);
        this.TRACKS.VOL_L = this.FILE_LINES.indexOf(trackSearchStrings.VOL_L);
        this.TRACKS.VOL_R = this.FILE_LINES.indexOf(trackSearchStrings.VOL_R);

        info('VoxClass', 'Populated track markers');
    }

    /**
     * Gets everything between the marker and the closest `#END` from the .vox file.
     */
    public GetRawDataAtMarker(marker: number): Array<string> {
        const line_start: number = marker;
        const lines_between: Array<string> = [];
        var line = line_start + 1;
        
        while (this.FILE_LINES[line] != metaSearchStrings.COMMON_END && line != this.FILE_LINES.length) {
            lines_between.push((<string> this.FILE_LINES.at(line)).replaceAll('\t', '<TAB>'));
            line++;
        }

        return lines_between;
    }

    /**
     * Parses the BPM INFO from the .vox file
     * @returns Array of I_BPM_INFO
     */
    public GetBPMInfo(): Array<I_BPM_INFO> {
        const raw_lines = this.GetRawDataAtMarker(<number> this.MARKERS.BPM_INFO);
        const BPM_Array: Array<I_BPM_INFO> = [];

        raw_lines.forEach((line: string) => {
            // split up the raw data line
            const line_parts: Array<string> = line.split('<TAB>');
            // split up the raw MBO info
            const measure_beat_offset: Array<string> = line_parts[0].split(',');
            // create the objects
            const location: I_SONG_LOCATION = {
                Measure: parseInt(measure_beat_offset[0]),
                Beat: parseInt(measure_beat_offset[1]),
                Offset: parseInt(measure_beat_offset[2])
            }
            const bpm_info: I_BPM_INFO = {
                Location: location,
                BPM: parseFloat(line_parts[1]),
                Pause: (line_parts[2] == '4-') // from FUBUKI's current understanding, '4' means go and '4-' means pause.
            }
            // add to the array and repeat if needed
            BPM_Array.push(bpm_info);
        });

        return BPM_Array;
    }


    public GetTimeSignatures() {

    }
}