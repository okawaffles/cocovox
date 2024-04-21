# What is this?
A TypeScript-based reader and soon-to-be editor for .vox files. If you don't know what a .vox file is, you don't need to worry about this repository.

# If you DO know what a .vox file is
In order to run:
1. Compile with `tsc`
2. Run `node build/main.js <path to your .vox file>`

These steps are subject to change so be prepared to read code to figure it out yourself if you need. 

# NOTES (PLEASE READ)
- Currently, this only supports single BPM + single timesig charts. Other charts **WILL NOT** BE TIMED PROPERLY.
- You will need to change the signature at the top of the vox file (`// S**** V***** OUTPUT TEXT FILE`) to be the full phrase. Otherwise, the chart may not be read by S\*\*\*\* V\*\*\*\*\* correctly.