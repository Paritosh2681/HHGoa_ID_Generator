#!/usr/bin/env bash
# One-shot council review of the HH Goa ID Generator, run after the CF quota reset.
# Regenerates the review prompt from the CURRENT source files, then runs the 4-model council.
set -u
cd "/d/Paritosh Codes and Projects/HHGoa_ID_Generator" || { echo "FAIL: project dir not found"; exit 1; }

if ! python build-council-prompt.py > /dev/null 2>&1; then
  echo "FAIL: could not rebuild council prompt"; exit 2
fi

OUT=$(python "C:/Users/parit/AppData/Local/Temp/hhgoa-council-run.py" 2>&1)

if echo "$OUT" | grep -q "All models failed to respond"; then
  echo "Council ran at $(date -u) but all models failed (quota may not have reset yet — check the CF 4006 error)."
  echo "Ask the assistant to re-run the council manually once the quota is back."
else
  echo "$OUT"
fi
