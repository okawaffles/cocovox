import { existsSync, readFileSync, writeFileSync } from 'fs';
import { info, warn, error } from 'okayulogger';
import { Vox } from './vox';
import { I_BEAT_INFO, I_BPM_INFO } from './datatypes';
import { CountBPMPauseBeats } from './bpmutil';
import { BT_NOTE_TYPE, BT_Note } from './note';
import { ConvertToOsuChart } from './convert_osu';

let CURRENT_FILE_PATH: string = process.argv[2];

if (!existsSync(CURRENT_FILE_PATH)) {
	error('main', `File does not exist. (${CURRENT_FILE_PATH})`);
	process.exit();
}


// test various parts
const DummyTimeSig = {Location:{Measure:0,Beat:0,Offset:0},Numerator:4,Denominator:4};

let vox: Vox = new Vox(CURRENT_FILE_PATH);
if (vox.VOX_VERSION < 10) process.exit();

/*
	BPM INFO Reading test
*/
const BPMs: Array<I_BPM_INFO> = vox.GetBPMInfo();

BPMs.forEach((BPM: I_BPM_INFO) => {
	info('main', `BPM at Measure ${BPM.Location.Measure}, Beat ${BPM.Location.Beat}, with ${BPM.Location.Offset} offset sets chart BPM to ${BPM.BPM} and ${BPM.Pause?'DOES':'DOES NOT'} pause.`);
	
	// if there's a pause BPM and it's not the last BPM
	if (BPM.Pause && (BPM != BPMs.at(-1))) {
		const nextBPM: I_BPM_INFO | undefined = BPMs.at(BPMs.indexOf(BPM) + 1);
		if (nextBPM == undefined) return;

		const beatsUntilNextBPMChange: number = CountBPMPauseBeats(BPM, nextBPM, DummyTimeSig);

		info('main', `There are ${beatsUntilNextBPMChange} beats until the next BPM change.`);
	}
});

/* 
	BEAT INFO reading test
*/

const TimeSignatures: Array<I_BEAT_INFO> = vox.GetTimeSignatures();

TimeSignatures.forEach((TimeSig: I_BEAT_INFO) => {
	info('main', `There is a time signature at Measure ${TimeSig.Location.Measure}, Beat ${TimeSig.Location.Beat}, with ${TimeSig.Location.Offset} offset which sets the time signature to ${TimeSig.Numerator}/${TimeSig.Denominator}`);
});

/*
	Convert BT-A -> BT-D to osu! 4K format
*/

// get all BT-As
const BT_A: Array<BT_Note> = vox.GetBTTrackNotes(BT_NOTE_TYPE.BT_A);

ConvertToOsuChart(BT_A, BT_A, BT_A, BT_A, BPMs, TimeSignatures);