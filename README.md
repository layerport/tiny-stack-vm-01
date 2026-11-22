[![make.fun · tiny-stack-vm-01-run-20261122](https://make.fun/badge/tiny-stack-vm-01-run-20261122.svg)](https://make.fun/bounty/tiny-stack-vm-01-run-20261122?utm_source=github&utm_medium=readme&utm_campaign=tiny-stack-vm-01-run-20261122)
[![rank](https://make.fun/badge/tiny-stack-vm-01-run-20261122/layerport/tiny-stack-vm-01/rank.svg)](https://make.fun/bounty/tiny-stack-vm-01-run-20261122/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=tiny-stack-vm-01-run-20261122)
[![reward](https://make.fun/badge/tiny-stack-vm-01-run-20261122/layerport/tiny-stack-vm-01/reward.svg)](https://make.fun/bounty/tiny-stack-vm-01-run-20261122?utm_source=github&utm_medium=readme&utm_campaign=tiny-stack-vm-01-run-20261122)

# tiny-stack-vm-01

A tiny stack virtual machine for [make.fun's tiny-stack-vm-01 bounty](https://make.fun/bounty/tiny-stack-vm-01-run-20261122).

`main.ts` runs all 40 programs of a set in one run (Node 22, stdlib only): 32-bit
wrapping arithmetic, a 256-value stack, calls, 256 words of memory, input/output,
and all ten traps with their exact exit codes — including the hard rules
(exact `MUL`, unsigned `DIVU`/`MODU`/`LTU`, shift masking, `INT_MIN` edges).
