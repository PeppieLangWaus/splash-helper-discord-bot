// World number -> hosting region code, derived from the OSRS world list.
// Regenerate by re-scraping https://oldschool.runescape.com/slu if worlds change.
const WORLD_REGIONS = {
  301: "useast", 302: "uk", 303: "ger", 304: "ger", 305: "useast", 306: "uswest", 307: "uswest", 308: "uk", 309: "uk", 310: "uk",
  311: "ger", 312: "ger", 313: "uswest", 314: "useast", 315: "uswest", 316: "uk", 317: "uk", 318: "uk", 319: "uswest", 320: "uswest",
  321: "useast", 322: "useast", 323: "uswest", 324: "uswest", 325: "uk", 326: "uk", 327: "ger", 328: "ger", 329: "useast", 330: "useast",
  331: "uswest", 332: "uswest", 333: "uk", 334: "uk", 335: "ger", 336: "ger", 337: "useast", 338: "uswest", 339: "uswest", 340: "uswest",
  341: "uk", 342: "uk", 343: "ger", 344: "ger", 345: "useast", 346: "useast", 347: "uswest", 348: "uswest", 349: "uk", 350: "uk",
  351: "ger", 352: "ger", 353: "useast", 354: "useast", 355: "uswest", 356: "uswest", 357: "uswest", 358: "uk", 359: "ger", 360: "ger",
  361: "useast", 362: "useast", 363: "uk", 364: "uk", 365: "uk", 366: "uk", 367: "ger", 368: "ger", 369: "useast", 370: "useast",
  371: "uk", 372: "uk", 373: "uk", 374: "uswest", 375: "ger", 376: "ger", 377: "useast", 378: "uswest", 379: "uk", 380: "uk",
  381: "uk", 382: "uk", 383: "ger", 384: "ger", 385: "useast", 386: "useast", 387: "aus", 388: "aus", 389: "aus", 390: "aus",
  391: "aus", 392: "aus", 393: "useast", 394: "useast", 395: "ger", 396: "ger", 397: "ger", 398: "ger", 399: "ger", 402: "useast",
  403: "useast", 404: "useast", 405: "ger", 406: "ger", 407: "uk", 408: "uk", 409: "uswest", 410: "uswest", 411: "uswest", 412: "aus",
  413: "ger", 414: "ger", 415: "useast", 416: "useast", 417: "useast", 418: "uswest", 419: "uswest", 420: "uswest", 421: "uswest", 422: "uswest",
  423: "uswest", 424: "aus", 425: "aus", 426: "aus", 427: "aus", 428: "uswest", 429: "uswest", 430: "uswest", 431: "uswest", 432: "uswest",
  433: "uswest", 434: "uswest", 435: "uswest", 436: "uswest", 437: "uswest", 438: "uswest", 439: "uswest", 440: "uswest", 441: "uswest", 442: "uswest",
  443: "uswest", 444: "uswest", 445: "uswest", 446: "uswest", 447: "ger", 448: "ger", 449: "ger", 450: "ger", 451: "ger", 452: "ger",
  453: "ger", 454: "ger", 455: "ger", 456: "ger", 457: "ger", 458: "ger", 459: "ger", 461: "ger", 462: "ger", 463: "ger",
  464: "ger", 465: "ger", 466: "ger", 467: "useast", 468: "useast", 469: "useast", 470: "useast", 471: "useast", 472: "useast", 473: "useast",
  474: "useast", 475: "useast", 476: "useast", 477: "useast", 478: "useast", 479: "useast", 480: "useast", 481: "useast", 482: "useast", 483: "useast",
  484: "useast", 485: "useast", 486: "useast", 487: "useast", 488: "useast", 489: "useast", 490: "useast", 491: "useast", 492: "useast", 493: "useast",
  494: "useast", 495: "useast", 496: "useast", 497: "uk", 498: "uk", 499: "uk", 500: "uk", 501: "uk", 502: "uk", 503: "uk",
  504: "uk", 505: "uk", 506: "uk", 507: "uk", 508: "uk", 509: "uk", 510: "uk", 511: "uk", 512: "uk", 513: "uk",
  514: "uk", 515: "uk", 516: "uk", 517: "uk", 518: "uk", 519: "uk", 520: "uk", 521: "uk", 522: "uk", 523: "uk",
  524: "uk", 525: "uk", 526: "aus", 527: "aus", 528: "aus", 529: "aus", 530: "aus", 531: "aus", 532: "aus", 533: "aus",
  534: "aus", 535: "aus", 536: "aus", 537: "aus", 538: "uswest", 539: "useast", 540: "uswest", 541: "uswest", 542: "uswest", 543: "uswest",
  544: "uswest", 545: "uswest", 546: "uswest", 547: "uswest", 549: "ger", 550: "ger", 551: "ger", 552: "ger", 553: "ger", 554: "ger",
  555: "ger", 556: "ger", 557: "ger", 558: "uk", 562: "uk", 563: "uk", 564: "uk", 565: "uk", 566: "uk", 567: "uk",
  568: "aus", 569: "aus", 570: "aus", 571: "aus", 573: "useast", 574: "useast", 575: "useast", 581: "useast", 582: "ger", 590: "aus",
  591: "aus", 595: "aus", 596: "useast", 597: "useast", 599: "uswest", 600: "uswest", 601: "uswest", 602: "uswest", 603: "uswest", 604: "uswest",
  606: "uswest", 607: "uswest", 608: "uswest", 609: "useast", 610: "useast", 611: "useast", 612: "useast", 613: "useast", 614: "useast", 615: "useast",
  616: "useast", 617: "useast", 618: "useast", 619: "uk", 620: "uk", 621: "uk", 622: "uk", 623: "uk", 624: "ger", 625: "ger",
  626: "ger", 627: "ger", 660: "sin", 661: "sin", 662: "sin", 663: "sin", 664: "sin", 667: "sa", 668: "sa", 692: "bra",
  693: "bra", 694: "bra", 695: "bra", 698: "jap", 699: "jap", 700: "jap",
};

// Region code -> emoji shown next to a world number. US East/West share a flag,
// so they're disambiguated with the same left/right arrows used by the frontend's
// location icons (public/assets/icons/location/uswest.png and useast.png).
const REGION_EMOJIS = {
  uswest: "<:uswest:1533590853506040021>",
  useast: "<:useast:1533590852054683710>",
  uk: "<:uk:1533590841590026411>",
  ger: "<:ger:1533590836699467999>",
  aus: "<:aus:1533590834434543818>",
  sin: "<:sin:1533590840063295538>",
  sa: "<:sa:1533590839132160102>",
  bra: "<:bra:1533590835625722078>",
  jap: "<:jap:1533590837701771305>",
};

function getWorldRegion(world) {
  return WORLD_REGIONS[world] ?? null;
}

function getWorldFlag(world) {
  const region = getWorldRegion(world);
  return region ? REGION_EMOJIS[region] : null;
}

module.exports = { WORLD_REGIONS, REGION_EMOJIS, getWorldRegion, getWorldFlag };
