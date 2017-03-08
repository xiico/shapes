var levelOne = {tiles:
"MMMMMMMM\n"+
"MMMMMMMM\n"+
"MMMMMMMM\n"+
"MMMMMMMM\n"+
"M  MMMMM\n"+
"MMMMMMMM\n"+
"MMMMMMMM\n"+
"MMMMMMMM",
    movingPlatforms: [{ id: "3-51", features: { moving: true }, settings: { movingOnX: true } }],
    levelSwiches: [//{ id: "8-54", features: { moveTarget: true }, settings: { targetId: "6-58", defaulTimer: 120, direction: "U" } },
                   { id: "8-55", features: { moveTarget: true }, settings: { targetId: "6-58", timed: true, defaulTimer: 120, direction: "D" } },
                   { id: "8-56", features: { moveTarget: true }, settings: { targetId: "6-58", timed: true, defaulTimer: 120, direction: "L" } },
                   //{ id: "8-57", features: { moveTarget: true }, settings: { targetId: "6-58", defaulTimer: 120, direction: "R" } }
                   { id: "8-32", features: { moveTarget: true }, settings: { targetId: "8-33", timed: true, defaulTimer: 120, direction: "U", distance: 1 } },
                   ],
    customProperties: [{ id: "4-12", settings: { searchDepth: 8 } }],
backGround:
"X X \n" +
" X X\n" +
"X X \n" +
" X X"}