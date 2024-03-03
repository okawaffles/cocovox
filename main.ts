import { existsSync, readFileSync, writeFileSync } from 'fs';
import { info, warn, error } from 'okayulogger';
import { Vox } from './vox';
import { I_BPM_INFO } from './datatypes';

let CURRENT_FILE_PATH: string = process.argv[2];

if (!existsSync(CURRENT_FILE_PATH)) {
	error('main', `File does not exist. (${CURRENT_FILE_PATH})`);
	process.exit();
}

let vox: Vox = new Vox(CURRENT_FILE_PATH);

const BPMs: Array<I_BPM_INFO> = vox.GetBPMInfo();

BPMs.forEach((BPM: I_BPM_INFO) => {
	info('main', `BPM at Measure ${BPM.Location.Measure}, Beat ${BPM.Location.Beat}, with ${BPM.Location.Offset} offset sets chart BPM to ${BPM.BPM} and ${BPM.Pause?'DOES':'DOES NOT'} pause.`)
})