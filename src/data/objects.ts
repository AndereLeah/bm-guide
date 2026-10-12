import type { Fact, FactKind, MuseumObject, RoomId, TagId } from "@/lib/types";

/**
 * Curated object dataset.
 *
 * Every record was checked against its British Museum Collection online page on 12 October 2026
 * (museum number, title, date, culture, materials, findspot, "Location" display status).
 * Images: each image's own "Use this image" page (britishmuseum.org/collection/image/{asset})
 * was checked for the CC BY-NC-SA 4.0 statement. Images without a confirmed statement are not shown.
 *
 * Text: Collection online text is not marked with a Creative Commons logo, so summaries and facts
 * below are original paraphrases written for this prototype, grounded in the record and gallery page.
 * They are not official Museum text and carry no Museum approval.
 */

export const DATA_VERIFIED_ON = "2026-10-12";
const CREDIT =
  "© The Trustees of the British Museum. Shared under a Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0) licence.";
const CC_URL = "https://creativecommons.org/licenses/by-nc-sa/4.0/";
const MEDIA = "https://media.britishmuseum.org/media/Repository/Documents/";
const COLL = "https://www.britishmuseum.org/collection/object/";
const GAL = "https://www.britishmuseum.org/collection/galleries/";

type F = [FactKind, string, ("record" | "gallery")?];

interface Input {
  id: string;
  museumNumber: string;
  registrationNumber?: string;
  title: string;
  shortTitle: string;
  objectType: string;
  date: string;
  culture: string;
  materials: string[];
  findspot?: string;
  dimensions?: string;
  acquisition?: string;
  summary: string;
  facts: F[];
  tags: TagId[];
  highlight?: boolean;
  room: RoomId | null;
  recordLocation: string;
  placement?: string;
  displayNote?: string;
  viewMinutes: number;
  imagePath: string | null;
  assetId: string | null;
  imageVerified?: boolean;
  imageNote?: string;
  gallery?: string;
}

function make(i: Input): MuseumObject {
  const verified = i.imageVerified !== false && !!i.imagePath && !!i.assetId;
  const facts: Fact[] = i.facts.map(([kind, text, source], n) => ({
    id: `${i.id}#${n + 1}`,
    kind,
    text,
    source: source ?? "record",
  }));
  const sources = [{ label: "Collection online record", url: COLL + i.id }];
  if (i.gallery) sources.push({ label: "Gallery page", url: GAL + i.gallery });
  if (i.assetId) sources.push({ label: "Image permissions page", url: `https://www.britishmuseum.org/collection/image/${i.assetId}` });
  return {
    id: i.id,
    museumNumber: i.museumNumber,
    registrationNumber: i.registrationNumber,
    title: i.title,
    shortTitle: i.shortTitle,
    objectType: i.objectType,
    date: i.date,
    culture: i.culture,
    materials: i.materials,
    findspot: i.findspot,
    dimensions: i.dimensions,
    acquisition: i.acquisition,
    summary: i.summary,
    facts,
    tags: i.tags,
    highlight: !!i.highlight,
    display: {
      status: i.room ? "on-display" : "not-on-display",
      roomId: i.room,
      recordLocation: i.recordLocation,
      placement: i.placement,
      note: i.displayNote,
    },
    viewMinutes: i.viewMinutes,
    image: {
      url: i.imagePath ? MEDIA + i.imagePath : null,
      assetId: i.assetId,
      credit: verified ? CREDIT : "© The Trustees of the British Museum",
      license: verified ? "CC BY-NC-SA 4.0" : null,
      licenseUrl: verified ? CC_URL : null,
      usePermitted: verified,
      permissionPage: i.assetId ? `https://www.britishmuseum.org/collection/image/${i.assetId}` : null,
      note: i.imageNote,
    },
    sources,
    verifiedOn: DATA_VERIFIED_ON,
  };
}

const RAW: Input[] = [
  // ───────────── Room 4: Egyptian sculpture ─────────────
  {
    id: "Y_EA24", museumNumber: "EA24", title: "The Rosetta Stone", shortTitle: "Rosetta Stone", objectType: "Stela",
    date: "196 BC", culture: "Ptolemaic", materials: ["granodiorite"], findspot: "Fort Saint Julien, near el-Rashid (Rosetta), Egypt",
    dimensions: "112.3 cm high (max), 75.7 cm wide, 28.4 cm thick", acquisition: "Donated by King George III",
    summary: "A broken granite stela carrying one priestly decree for King Ptolemy V written three times, in hieroglyphs, Demotic and Greek. The Greek text gave scholars the key to reading hieroglyphs again.",
    facts: [
      ["overview", "The stone is part of a stela inscribed in 196 BC with a decree issued by a council of Egyptian priests about King Ptolemy V."],
      ["look", "Look for three bands of writing: hieroglyphs at the top (14 surviving lines), Demotic in the middle (32 lines) and Greek at the bottom (54 lines). All three record the same decree."],
      ["context", "The decree supported the royal cult of the 13-year-old Ptolemy V on the first anniversary of his coronation, at a time when his family was still regaining control over parts of Egypt."],
      ["context", "Each script had a role: hieroglyphs suited a priestly decree, Demotic was the native script for daily use, and Greek was the language of the government."],
      ["detail", "Knowledge of hieroglyphs was lost after the late 4th century AD. In the early 1800s Thomas Young showed that some signs spelled the royal name Ptolemy, and Jean-François Champollion then realised hieroglyphs also recorded the sounds of the Egyptian language."],
      ["provenance", "Soldiers in Napoleon's army found it in 1799 while digging foundations at a fort near el-Rashid (Rosetta). After the French defeat it passed to the British under the Treaty of Alexandria (1801), and it has been on show at the Museum since 1802."],
      ["detail", "In 1917, fearing bombing during the First World War, the Museum moved it to a Postal Tube Railway station about 50 feet under Holborn, where it stayed for two years."],
      ["material", "It is grey and pink granodiorite, about 112 cm tall at most, 76 cm wide and 28 cm thick."],
    ],
    tags: ["egypt", "writing", "power", "science", "collecting"], highlight: true,
    room: "4", recordLocation: "On display (Room 4 - Egyptian sculpture, Central Saloon East)", placement: "Central Saloon East",
    viewMinutes: 6, imagePath: "2014_9/30_14/850117f8_773c_4b7e_af44_a3b600f6de6d/preview_00016456_004.jpg", assetId: "16456004", gallery: "egyptian-sculpture",
  },
  {
    id: "Y_EA19", museumNumber: "EA19", title: "The Younger Memnon: colossal bust of Ramesses II", shortTitle: "Ramesses II (Younger Memnon)", objectType: "Statue",
    date: "19th Dynasty (reign of Ramesses II)", culture: "19th Dynasty", materials: ["granodiorite", "red granite"], findspot: "Ramesseum (Thebes), doorway",
    dimensions: "266.8 cm high, 203.3 cm across the shoulders", acquisition: "Donated by Henry Salt and Johann Ludwig Burckhardt, 1817",
    summary: "The head and upper body of a colossal statue of Ramesses II that once stood at the doorway of his memorial temple, the Ramesseum, at Thebes.",
    facts: [
      ["overview", "This is the head and upper body of a monumental statue of Ramesses II, one of a pair placed in front of the door of the Ramesseum at Thebes."],
      ["look", "The sculptor used the stone's two colours so the face and the body sit in different tones. The king wears the striped nemes head-cloth and a circlet of cobras, about half of which is now lost."],
      ["detail", "The back pillar carries columns of hieroglyphs giving the king's names and titles and part of a dedication to the god Amun-Ra."],
      ["detail", "Traces of colour were noticed on the statue in 1817, so it may originally have been painted."],
      ["provenance", "The Museum's gallery page explains that Henry Salt, the British Consul-General, employed Giovanni Belzoni to remove sculptures including this colossal bust.", "gallery"],
      ["material", "It is about 2.7 metres tall and over 2 metres across the shoulders."],
    ],
    tags: ["egypt", "power", "colossal", "sculpture", "collecting"], highlight: true,
    room: "4", recordLocation: "On display (Room 4 - Egyptian sculpture, Bay 9)", placement: "Bay 9",
    viewMinutes: 5, imagePath: "2014_10/11_7/26cb5b78_4496_4437_a2cd_a3c1007638f6/preview_00612374_001.jpg", assetId: "612374001", gallery: "egyptian-sculpture",
  },
  {
    id: "Y_EA15", museumNumber: "EA15", title: "Colossal head, probably of Amenhotep III", shortTitle: "Head of Amenhotep III", objectType: "Statue (head)",
    date: "About 1370 BC", culture: "18th Dynasty", materials: ["red granite"], findspot: "In front of the temple of Khonsupakhered, Mut enclosure, Karnak",
    dimensions: "290 cm high; estimated 3,600 kg", acquisition: "Purchased from Henry Salt, 1823",
    summary: "A huge red granite head, probably of Amenhotep III, wearing the double crown of Upper and Lower Egypt. Its arm is also in the Museum.",
    facts: [
      ["overview", "This red granite head, from about 1370 BC, probably shows King Amenhotep III. The record keeps a question mark on the identification."],
      ["look", "He wears the double crown, symbol of rule over both Upper and Lower Egypt."],
      ["provenance", "Belzoni and Beechey uncovered it in 1817 in front of the temple of Khonsupakhered at Karnak. Moving it one mile to Luxor took eight days."],
      ["detail", "An arm from the same statue is also in the Museum (EA 55), and the body has been identified at the Mut enclosure at Karnak."],
      ["detail", "For many years it was wrongly thought to show Thutmose III."],
      ["material", "The head alone is about 2.9 metres tall and is estimated to weigh 3,600 kg."],
    ],
    tags: ["egypt", "power", "colossal", "sculpture", "collecting"], highlight: true,
    room: "4", recordLocation: "On display (Room 4 - Egyptian sculpture, Bay 15)", placement: "Bay 15",
    viewMinutes: 4, imagePath: "2014_9/29_20/84ebaa81_8219_4331_b9e7_a3b50159432a/preview_00167400_001.jpg", assetId: "167400001", gallery: "egyptian-sculpture",
  },
  {
    id: "Y_EA117", museumNumber: "EA117", title: "King list from the temple of Ramesses II at Abydos", shortTitle: "Abydos king list", objectType: "King list; temple relief",
    date: "About 1250 BC", culture: "19th Dynasty", materials: ["limestone"], findspot: "Temple of Ramesses II, Abydos",
    dimensions: "135 cm high, 370 cm long", acquisition: "Purchased from Jean François Mimaut, 1837",
    summary: "Part of a carved list of royal names from Ramesses II's temple at Abydos: a king placing himself at the end of a long line of predecessors.",
    facts: [
      ["overview", "This limestone relief, from about 1250 BC, is part of a list of Egyptian kings carved in the temple of Ramesses II at Abydos. It preserves 34 names."],
      ["look", "Look at the rows of cartouches (oval name-rings). The upper two rows name earlier kings. The bottom row repeats Ramesses II's own two names."],
      ["context", "Abydos was the cult centre of Osiris. The temples of Sety I and of his son Ramesses II both had king lists. Sety's is complete and still in its temple."],
      ["detail", "A figure of Ramesses II probably stood at the right, making offerings to his predecessors and to Osiris."],
      ["provenance", "William Bankes excavated the fragments in 1818. The French Consul-General J.F. Mimaut took them to France in 1837, and the Museum acquired his collection that year."],
    ],
    tags: ["egypt", "writing", "power", "religion"],
    room: "4", recordLocation: "On display (Room 4 - Egyptian sculpture, Bay 30)", placement: "Bay 30",
    viewMinutes: 4, imagePath: "2014_9/30_7/21b34e3f_83e5_428c_9dd3_a3b6007fe951/preview_00178382_001.jpg", assetId: "178382001", gallery: "egyptian-sculpture",
  },
  {
    id: "Y_EA64391", museumNumber: "EA64391", title: "The Gayer-Anderson Cat", shortTitle: "Gayer-Anderson Cat", objectType: "Animal coffin; figure",
    date: "Late Period", culture: "Late Period", materials: ["copper alloy", "gold", "silver"], findspot: "Saqqara (Memphis) (?)",
    dimensions: "34 cm high without base; about 7.6 kg", acquisition: "Donated by Major Robert Grenville Gayer-Anderson",
    summary: "A seated bronze cat, adorned with gold jewellery, that was made as a coffin and probably once held a mummified cat.",
    facts: [
      ["overview", "This hollow-cast copper-alloy cat is a coffin. It probably once held a mummified cat and is now empty."],
      ["look", "Spot the gold earrings and nose-ring, the scarab beetle on its forehead, and the silver sun-disc held by a winged scarab on its chest."],
      ["look", "An incised collar carries a protective wedjat-eye pendant. The eyes were once inlaid. The inlays are now missing."],
      ["detail", "Its striped tail wraps around its right side. Small tangs under the front paws and tail were probably used to fix it to a plinth."],
      ["provenance", "It was given by Major Robert Grenville Gayer-Anderson, and the record suggests it came from Saqqara (with a question mark)."],
    ],
    tags: ["egypt", "animals", "religion", "afterlife", "craft"], highlight: true,
    room: "4", recordLocation: "On display (Room 4 - Egyptian sculpture, Bay 10)", placement: "Bay 10",
    viewMinutes: 4, imagePath: "2014_11/12_17/80ecfb29_12b1_4ca0_8b4c_a3e101252dbf/preview_00119116_001.jpg", assetId: "119116001", gallery: "egyptian-sculpture",
  },
  {
    id: "Y_EA74", museumNumber: "EA74", title: "Colossal scarab beetle", shortTitle: "Colossal scarab", objectType: "Sculpture",
    date: "4th century BC (?)", culture: "Egyptian", materials: ["diorite"], findspot: "Istanbul (Constantinople)",
    dimensions: "153.5 cm long, 89.1 cm high; about 2,320 kg", acquisition: "Purchased from Thomas Bruce, 7th Earl of Elgin",
    summary: "A giant stone dung beetle, probably the sun-god Khepri, that travelled from Egypt to Constantinople and then to London.",
    facts: [
      ["overview", "This monumental diorite scarab probably represents Khepri, the scarab-beetle form of the rising sun."],
      ["provenance", "It was found in Constantinople (Istanbul), not in Egypt. It is mentioned in a letter to Lord Elgin in 1801, and the Museum bought it from his collection."],
      ["context", "An 1833 Museum guide noted that Constantinople, like Rome, had been decorated with Egyptian works of art."],
      ["material", "It is about 1.5 metres long and weighs over two tonnes."],
    ],
    tags: ["egypt", "animals", "religion", "colossal", "collecting"],
    room: "4", recordLocation: "On display (Room 4 - Egyptian sculpture, Bay 4)", placement: "Bay 4",
    viewMinutes: 3, imagePath: "2014_10/2_21/85d0ab0d_6058_447e_a53c_a3b8016823af/preview_00337076_001.jpg", assetId: "337076001", gallery: "egyptian-sculpture",
  },
  {
    id: "Y_EA1779", museumNumber: "EA1779", title: "Ram sphinx protecting King Taharqo", shortTitle: "Ram of Amun with Taharqo", objectType: "Statue",
    date: "690–664 BC", culture: "Kushite; Napatan", materials: ["gneiss"], findspot: "Kawa, Temple T",
    dimensions: "106 cm high; base 163 cm long",
    summary: "A sphinx with a ram's head, the animal of the god Amun, sheltering a small figure of the Kushite king Taharqo between its paws.",
    facts: [
      ["overview", "This gneiss sphinx shows the ram of the god Amun protecting a figure of King Taharqo, who stands between its folded front legs. It dates to 690–664 BC."],
      ["look", "Compare the small king with the huge ram. The god is shown as his protector."],
      ["detail", "The rectangular base, partly restored, carries a continuous line of hieroglyphs."],
      ["provenance", "It was excavated at Temple T at Kawa."],
    ],
    tags: ["egypt", "animals", "religion", "power", "sculpture"],
    room: "4", recordLocation: "On display (Room 4 - Egyptian sculpture, Bay 9)", placement: "Bay 9",
    viewMinutes: 3, imagePath: "2014_10/1_7/e8b52b78_5325_4205_b444_a3b70077149c/preview_00035342_001.jpg", assetId: "35342001", gallery: "egyptian-sculpture",
  },
  {
    id: "Y_EA32", museumNumber: "EA32", title: "Sarcophagus of Ankhnesneferibra", shortTitle: "Sarcophagus of Ankhnesneferibra", objectType: "Sarcophagus",
    date: "About 530 BC", culture: "26th Dynasty; Roman Period (later inscription)", materials: ["siltstone"], findspot: "Deir el-Medina (Thebes), re-used in a pit 125 feet deep",
    dimensions: "259 cm long, 112 cm high with lid", acquisition: "Purchased, 1836",
    summary: "The stone coffin of Ankhnesneferibra, a royal daughter who held the powerful religious office of God's Adorer of Amun. Centuries later a priest took it over.",
    facts: [
      ["overview", "This black siltstone sarcophagus belonged to Ankhnesneferibra, daughter of King Psamtek II and holder of the office of God's Adorer of Amun, about 530 BC."],
      ["look", "Inside and out it is covered in columns of hieroglyphic prayers, some from the ancient Pyramid Texts. A relief of the goddess Hathor, as goddess of the west, decorates the inside floor."],
      ["detail", "In the early Roman Period a priest of Montu named Amenhotep-Pimontu re-used it. He added a band of text around the rim and took over her cartouches."],
      ["material", "It was hollowed from a single block of stone and is about 2.6 metres long."],
      ["provenance", "It was found re-used in a deep pit at Deir el-Medina in Thebes and was purchased in 1836."],
    ],
    tags: ["egypt", "afterlife", "religion", "writing", "women"],
    room: "4", recordLocation: "On display (Room 4 - Egyptian sculpture, Bay 6)", placement: "Bay 6",
    viewMinutes: 4, imagePath: "2014_11/7_19/44d148d4_84b5_4e18_89a4_a3dc01407e97/preview_01316979_001.jpg", assetId: "1316979001", gallery: "egyptian-sculpture",
  },

  // ───────────── Room 6 ─────────────
  {
    id: "W_1848-1104-1", museumNumber: "118885", registrationNumber: "1848,1104.1", title: "The Black Obelisk of Shalmaneser III", shortTitle: "Black Obelisk", objectType: "Obelisk",
    date: "825 BC", culture: "Neo-Assyrian", materials: ["black limestone"], findspot: "Nimrud",
    dimensions: "197.5 cm high",
    summary: "A black stone monument celebrating Assyrian king Shalmaneser III, with five rows of tribute scenes, one of which names King Jehu of Israel.",
    facts: [
      ["overview", "This black limestone obelisk from Nimrud, dated 825 BC, celebrates the achievements of King Shalmaneser III and his chief minister."],
      ["look", "Walk around it: five rows of tribute scenes run around the four sides, each labelled with a caption."],
      ["detail", "The tribute comes from Gilzanu in north-west Iran (horses), the 'House of Omri' (ancient Israel, tribute from King Jehu in 841 BC), Musri (Egypt, with an elephant, apes and other exotic animals), Suhi on the Euphrates and Patina in southern Turkey."],
      ["detail", "Casts of the obelisk have been made. One appeared on the set of the film 'Troy' (2004)."],
      ["context", "The gallery page notes it is shown with obelisks and stelae from four generations of Assyrian kings.", "gallery"],
    ],
    tags: ["mesopotamia", "power", "writing", "animals"], highlight: true,
    room: "6", recordLocation: "On display (Room 6a - Assyrian sculpture)", placement: "Room 6a",
    viewMinutes: 4, imagePath: "2014_10/5_2/fd60bada_bbbe_4310_a90f_a3bb002a6a26/preview_00290479_001.jpg", assetId: "290479001", gallery: "assyrian-sculpture-and-balawat-gates",
  },

  // ───────────── Rooms 7–8 ─────────────
  {
    id: "W_1847-0623-11", museumNumber: "124534", registrationNumber: "1847,0623.11", title: "Relief: Ashurnasirpal II hunting lions", shortTitle: "Ashurnasirpal's lion hunt", objectType: "Wall panel; relief",
    date: "865–860 BC", culture: "Neo-Assyrian", materials: ["gypsum"], findspot: "North-West Palace, Nimrud, Room B panel 19 (top)",
    dimensions: "88.7 cm high, 223.5 cm long",
    summary: "A palace relief of King Ashurnasirpal II fighting a lion from his chariot, with attendants ready to step in.",
    facts: [
      ["overview", "This gypsum relief from the North-West Palace at Nimrud shows King Ashurnasirpal II hunting lions."],
      ["look", "A lion attacks the back of the king's chariot. Two attendants in pointed helmets, with bows and shields, stand ready to finish it off with daggers."],
      ["context", "The Nimrud reliefs once lined the throne room and royal apartments. They show the king at war, performing rituals with protective spirits, and hunting, a royal sport in ancient Mesopotamia.", "gallery"],
      ["detail", "It was originally the upper part of panel 19 in the palace's Room B. The libation scene displayed nearby was the lower part."],
    ],
    tags: ["mesopotamia", "power", "conflict", "animals"],
    room: "7", recordLocation: "On display (Room 7 - Assyria: Nimrud)",
    viewMinutes: 3, imagePath: "2014_10/1_6/6cac9bf3_ca6e_4353_a1a5_a3b7006c88e4/preview_00032396_001.jpg", assetId: "32396001", gallery: "assyria-nimrud",
  },
  {
    id: "W_1847-0623-13", museumNumber: "124535", registrationNumber: "1847,0623.13", title: "Relief: Ashurnasirpal II pouring a libation over a dead lion", shortTitle: "Libation over a lion", objectType: "Wall panel; relief",
    date: "865–860 BC", culture: "Neo-Assyrian", materials: ["gypsum"], findspot: "North-West Palace, Nimrud, Room B panel 19 (bottom)",
    dimensions: "86.8 cm high, 225.5 cm wide",
    summary: "After the hunt: the king, with courtiers and musicians, pours a ritual offering over the lion he has killed.",
    facts: [
      ["overview", "This relief shows Ashurnasirpal II, with bowmen, a fan-bearer and courtiers, about to pour a libation (a liquid offering) over a dead lion."],
      ["look", "Find the two musicians playing horizontal harps, and the line of cuneiform inscription."],
      ["detail", "It was the lower half of the same palace panel as the lion-hunt scene, so the two scenes tell a before-and-after story."],
    ],
    tags: ["mesopotamia", "religion", "power", "animals"],
    room: "7", recordLocation: "On display (Room 7 - Assyria: Nimrud)",
    viewMinutes: 3, imagePath: "2014_10/3_21/0f0088db_32c6_4402_8a63_a3b9015e0b52/preview_00228517_001.jpg", assetId: "228517001", gallery: "assyria-nimrud",
  },
  {
    id: "W_1850-1228-1", museumNumber: "118873", registrationNumber: "1850,1228.1", title: "Winged human-headed lion relief from Nimrud", shortTitle: "Winged lion guardian", objectType: "Wall panel; relief",
    date: "865–860 BC", culture: "Neo-Assyrian", materials: ["gypsum"], findspot: "North-West Palace, Nimrud, Room G door b panel 2",
    dimensions: "317 cm high, 281 cm long",
    summary: "A towering protective spirit, a winged lion with a human head, that guarded a doorway in Ashurnasirpal II's palace.",
    facts: [
      ["overview", "This gypsum relief shows a winged, human-headed lion, a protective spirit that guarded an entrance in the North-West Palace at Nimrud."],
      ["look", "Look for the cuneiform inscription carved across the figure."],
      ["detail", "Its matching partner is in the Metropolitan Museum of Art in New York."],
      ["material", "It is over 3 metres tall."],
    ],
    tags: ["mesopotamia", "religion", "animals", "colossal"],
    room: "8", recordLocation: "On display (Room 8 - Assyria: Nimrud)",
    viewMinutes: 3, imagePath: "2014_10/5_18/6920d9fc_5163_4951_8467_a3bb012c36c2/preview_00361950_001.jpg", assetId: "361950001", gallery: "assyria-nimrud",
  },

  // ───────────── Room 9 ─────────────
  {
    id: "W_1851-0902-30", museumNumber: "124772", registrationNumber: "1851,0902.30", title: "Relief of a Phoenician warship", shortTitle: "Phoenician ship relief", objectType: "Wall panel; relief",
    date: "705–681 BC", culture: "Neo-Assyrian", materials: ["gypsum"], findspot: "South-West Palace, Nineveh, Room VII panel 11",
    dimensions: "66 cm high, 100.3 cm wide", acquisition: "From Sir Austen Henry Layard",
    summary: "A Mediterranean galley with rows of oars and shields, carved for King Sennacherib's palace at Nineveh.",
    facts: [
      ["overview", "This relief from Sennacherib's South-West Palace at Nineveh shows a Phoenician galley, a Mediterranean warship."],
      ["look", "Spot the shields hung along the upper deck, the ram at the front, and a bird carrying off a fish near the ram's point."],
      ["detail", "The record notes something odd about the number of oars, and that a line on the hull may show an outrigger."],
      ["context", "Layard described this palace room as showing a royal military expedition and the king receiving captives and spoil."],
    ],
    tags: ["mesopotamia", "conflict", "science"],
    room: "9", recordLocation: "On display (Room 9 - Assyria: Nineveh)",
    viewMinutes: 3, imagePath: "2014_10/1_6/f3dd7b81_99df_4354_95e4_a3b7006cd42c/preview_00032471_001.jpg", assetId: "32471001", gallery: "assyria-nineveh",
  },
  {
    id: "W_1851-0902-2", museumNumber: "124824", registrationNumber: "1851,0902.2", title: "Relief: moving a colossal winged bull for Sennacherib", shortTitle: "Moving a colossal bull", objectType: "Wall panel; relief",
    date: "700–692 BC", culture: "Neo-Assyrian", materials: ["gypsum"], findspot: "South-West Palace, Nineveh, Court VI",
    dimensions: "203.2 cm high, 199.4 cm wide", acquisition: "From Sir Austen Henry Layard",
    summary: "An ancient engineering scene: King Sennacherib inspects the transport of a giant winged-bull sculpture for his palace.",
    facts: [
      ["overview", "This relief shows a colossal winged-bull sculpture being moved for Sennacherib's palace, with the king inspecting the work."],
      ["look", "The king stands in a chariot pulled by two servants. Another fans him and a fourth holds a sunshade over his head."],
      ["look", "Search the reeds behind: three deer and a wild sow with her young are hidden there."],
      ["context", "The gallery page explains that such guardian bulls weighed up to 30 tons, and that these panels give an insight into ancient quarrying and transport, and into Sennacherib's interest in building.", "gallery"],
    ],
    tags: ["mesopotamia", "power", "science", "colossal", "animals"],
    room: "9", recordLocation: "On display (Room 9 - Assyria: Nineveh)",
    viewMinutes: 4, imagePath: "2014_10/4_18/dbada9ba_26b4_49c1_bcb0_a3ba01290a05/preview_00247577_001.jpg", assetId: "247577001", gallery: "assyria-nineveh",
  },

  // ───────────── Room 10 ─────────────
  {
    id: "W_1856-0909-14", museumNumber: "124905", registrationNumber: "1856,0909.14", title: "Relief: the assault on Lachish begins", shortTitle: "Siege of Lachish", objectType: "Wall panel; relief",
    date: "700–692 BC", culture: "Neo-Assyrian", materials: ["gypsum"], findspot: "South-West Palace, Nineveh, Room XXXVI panel 6",
    dimensions: "177.8 cm high, 228.6 cm wide",
    summary: "Assyrian archers and assault troops begin the attack on Lachish, a city of the kingdom of Judah, in a war also recorded in the Bible.",
    facts: [
      ["overview", "This relief from Sennacherib's palace at Nineveh shows the beginning of the Assyrian assault on the city of Lachish."],
      ["look", "At the back, long-range archers shoot. In front, assault troops get ready, and some soldiers seem to carry stones."],
      ["context", "Lachish was a leading city of the kingdom of Judah. Sennacherib captured it in 701 BC after it refused to pay tribute, and the siege is mentioned in the Bible.", "gallery"],
    ],
    tags: ["mesopotamia", "conflict", "power"], highlight: true,
    room: "10", recordLocation: "On display (Room 10a - Assyria: Lion Hunts, Section A)", placement: "Recorded as Room 10a, Section A",
    displayNote: "The gallery page describes the Lachish reliefs as being in Room 10b; this record gives 10a Section A. Check the gallery signage.",
    viewMinutes: 4, imagePath: "2014_10/5_7/49dfe51d_1ce1_4df2_a938_a3bb0080ce20/preview_00316033_001.jpg", assetId: "316033001", gallery: "assyria-lion-hunts",
  },
  {
    id: "W_1856-0909-15", museumNumber: "124883", registrationNumber: "1856,0909.15", title: "Relief: lions released for Ashurbanipal's hunt", shortTitle: "Royal lion hunt", objectType: "Wall panel; relief",
    date: "645–635 BC", culture: "Neo-Assyrian", materials: ["gypsum"], findspot: "North Palace, Nineveh, Room C panel 28",
    dimensions: "63.5 cm high, 68.6 cm wide",
    summary: "Lions released into an arena are driven towards King Ashurbanipal's chariot. These are some of the most admired carvings in Assyrian art.",
    facts: [
      ["overview", "This relief from Ashurbanipal's North Palace at Nineveh shows lions released from cages into an arena, then driven or lured towards the king's chariot."],
      ["look", "The death throes of the wounded lions are carved with striking realism. Some tails were first carved too long and later shortened."],
      ["context", "In Assyria lion hunting was the sport of kings, a symbol of the king's duty to protect his people. These hunt scenes rank among the finest achievements of Assyrian art.", "gallery"],
    ],
    tags: ["mesopotamia", "animals", "conflict", "power"], highlight: true,
    room: "10", recordLocation: "On display (Room 10a - Assyria: Lion Hunts, Section C)", placement: "Room 10a, Section C",
    viewMinutes: 4, imagePath: "2014_10/6_16/9989b931_66cd_4efe_b588_a3bc010b1347/preview_00431090_001.jpg", assetId: "431090001", gallery: "assyria-lion-hunts",
  },
  {
    id: "W_1856-0909-16", museumNumber: "124870", registrationNumber: "1856,0909.16", title: "Relief: soldiers ring the hunting arena", shortTitle: "The hunting arena", objectType: "Wall panel; relief",
    date: "645–635 BC", culture: "Neo-Assyrian", materials: ["gypsum"], findspot: "North Palace, Nineveh, Room C panel 17",
    dimensions: "About 165 cm high, 91 cm wide",
    summary: "The staging of a royal hunt: a wall of shields, a lion let out of its cage, and horsemen waiting.",
    facts: [
      ["overview", "This relief shows soldiers with tall shields forming a ring around the arena so the lions cannot escape."],
      ["look", "A small person, perhaps a child, releases a lion from its cage while sheltering in a cage of his own."],
      ["look", "Horsemen get ready to drive the lion towards Ashurbanipal's chariot."],
    ],
    tags: ["mesopotamia", "animals", "conflict"],
    room: "10", recordLocation: "On display (Room 10a - Assyria: Lion Hunts, Section C)", placement: "Room 10a, Section C",
    viewMinutes: 3, imagePath: "2014_10/6_16/ac6cdac2_a1e9_4131_88ad_a3bc010b482f/preview_00431065_001.jpg", assetId: "431065001", gallery: "assyria-lion-hunts",
  },
  {
    id: "W_1850-1228-3", museumNumber: "118808,a", registrationNumber: "1850,1228.3", title: "Colossal winged bull from Khorsabad", shortTitle: "Khorsabad winged bull", objectType: "Sculpture",
    date: "710–705 BC", culture: "Neo-Assyrian", materials: ["gypsum"], findspot: "Khorsabad, Gate B",
    dimensions: "403.9 cm high, 486 cm long", acquisition: "Purchased from Sir Henry Creswicke Rawlinson",
    summary: "A four-metre guardian bull from a gateway of Sargon II's citadel at Khorsabad, made to keep evil out.",
    facts: [
      ["overview", "This colossal gypsum winged bull, a protective spirit, came from a gateway in the citadel wall at Khorsabad, the city built for King Sargon II."],
      ["look", "Beside it, panels show a winged divine figure about to anoint with a 'cone' dipped in liquid from a bucket."],
      ["detail", "It is one of a pair intended to stop evil from entering. The record notes the side panels are currently arranged differently from their original position behind the bull."],
      ["material", "It is about 4 metres tall and nearly 5 metres long."],
    ],
    tags: ["mesopotamia", "religion", "animals", "colossal"], highlight: true,
    room: "10", recordLocation: "On display (Room 10c - Assyria: Khorsabad)", placement: "Room 10c",
    viewMinutes: 4, imagePath: "2014_10/2_20/960f22b5_fc39_47c0_a7d8_a3b80149b3e2/preview_00328779_001.jpg", assetId: "328779001", gallery: "assyria-lion-hunts",
  },

  // ───────────── Room 17 ─────────────
  {
    id: "G_1848-1020-81", museumNumber: "1848,1020.81", title: "Statue of a Nereid from the Nereid Monument", shortTitle: "Running Nereid", objectType: "Statue",
    date: "About 390–380 BC", culture: "Classical Greek (made in Lycia)", materials: ["marble"], findspot: "Nereid Monument, Xanthos",
    dimensions: "137 cm high", acquisition: "From Sir Charles Fellows",
    summary: "A running sea nymph in windblown drapery, one of the statues between the columns of a Lycian ruler's temple-like tomb.",
    facts: [
      ["overview", "This marble statue probably shows a Nereid, a sea nymph, and stood between the columns of the Nereid Monument at Xanthos in Lycia, about 390–380 BC."],
      ["look", "She runs to the right in a long, unbelted dress. Look below the folds of drapery for a sea bird with outspread wings floating over the water."],
      ["detail", "Her style and costume differ noticeably from the other Nereids. Her head, right forearm and both feet are missing."],
      ["context", "The monument was probably built for Erbinna (Arbinas), ruler of Xanthos. It looks like a Greek Ionic temple set on a high podium in the local Lycian tradition.", "gallery"],
      ["context", "In Greek myth the Nereids were sea nymphs who helped sailors caught in storms.", "gallery"],
    ],
    tags: ["greece-rome", "religion", "sculpture", "women", "afterlife"],
    room: "17", recordLocation: "On display (Room 17 - Nereid Monument)",
    viewMinutes: 4, imagePath: "2014_10/9_19/099b81f6_eace_4e6b_98ec_a3bf01462e68/preview_00543898_001.jpg", assetId: "543898001", gallery: "nereid-monument",
  },

  // ───────────── Room 18 ─────────────
  {
    id: "G_1816-0610-98", museumNumber: "1816,0610.98", title: "Horse of Selene from the Parthenon East pediment", shortTitle: "Horse of Selene", objectType: "Statue; pediment",
    date: "438–432 BC", culture: "Classical Greek", materials: ["marble"], findspot: "Parthenon, Athens",
    dimensions: "62.6 cm high, 83.3 cm long", acquisition: "Purchased from Thomas Bruce, 7th Earl of Elgin",
    summary: "The straining head of a horse that drew the moon goddess's chariot, from the corner of the Parthenon's east pediment.",
    facts: [
      ["overview", "This marble horse's head (East pediment figure O) is one of the horses drawing the chariot of the moon goddess Selene, or Nyx, goddess of night."],
      ["look", "Notice the flattened ears, gaping jaw, flared nostrils and bulging eyes. Drill holes show where a metal bridle was fixed, and eleven small holes along the mane once held metal ornaments."],
      ["context", "The East pediment showed the birth of Athena from the head of Zeus. Figures in its corners marked the time of day."],
      ["detail", "Two other horses and Selene's torso are in the Acropolis Museum in Athens."],
    ],
    tags: ["greece-rome", "animals", "religion", "sculpture", "collecting"], highlight: true,
    room: "18", recordLocation: "On display (Room 18 - Greece: Parthenon)",
    viewMinutes: 4, imagePath: "2014_9/30_15/3a419042_c771_41c3_ae8b_a3b600fb4f7c/preview_00018006_001.jpg", assetId: "18006001", gallery: "greece-parthenon",
  },
  {
    id: "G_1816-0610-1", museumNumber: "1816,0610.1", title: "Parthenon South metope II: Lapith and Centaur", shortTitle: "Lapith and Centaur metope", objectType: "Metope",
    date: "447–438 BC", culture: "Classical Greek", materials: ["marble"], findspot: "Parthenon, Athens",
    dimensions: "134 cm high (with restoration), 127 cm wide", acquisition: "Purchased from Thomas Bruce, 7th Earl of Elgin",
    summary: "A mythical wrestling match between a Lapith and a Centaur, carved for the outside of the Parthenon.",
    facts: [
      ["overview", "This marble metope (South metope II) belongs to the series showing the battle between Centaurs and Lapiths at the wedding feast of Peirithoos."],
      ["look", "The Lapith kneels on the Centaur's back and grips its throat. The Centaur, forced down on one foreleg, throws its head back with its mouth open and clutches the Lapith's shoulder."],
      ["detail", "The Centaur's left arm and right foreleg and the Lapith's head and right arm are missing. Parts of the frame are restored."],
      ["context", "The gallery page explains that the metopes and pediments showed myths, while the frieze showed the people of Athens in procession.", "gallery"],
    ],
    tags: ["greece-rome", "religion", "conflict", "sculpture"],
    room: "18", recordLocation: "On display (Room 18 - Greece: Parthenon)",
    viewMinutes: 4, imagePath: "2014_11/10_23/b474c6f6_1873_4e60_bbd8_a3df017df073/preview_01560804_001.jpg", assetId: "1560804001", gallery: "greece-parthenon",
  },
  {
    id: "G_1816-0610-46-b", museumNumber: "1816,0610.46.b", title: "Parthenon North frieze, block XLVII: horsemen", shortTitle: "Parthenon frieze horsemen", objectType: "Temple relief",
    date: "438–432 BC", culture: "Classical Greek", materials: ["marble"], findspot: "Parthenon, Athens",
    acquisition: "Purchased from Thomas Bruce, 7th Earl of Elgin",
    summary: "Riders in the great procession of the Panathenaic festival, held for the goddess Athena's birthday.",
    facts: [
      ["overview", "This marble block from the North frieze shows part of the procession of the Panathenaic festival, which celebrated the birthday of the goddess Athena."],
      ["look", "Compare the riders: some wear a heavy mantle and tunic, some are almost naked, and some wear caps or helmets. Drill holes once held metal reins."],
      ["detail", "The North frieze squeezes its 60 riders into 19 blocks, where the South frieze uses 24, so the riders here are packed more tightly."],
      ["detail", "This block is also counted as West frieze block I."],
    ],
    tags: ["greece-rome", "religion", "animals", "sculpture"],
    room: "18", recordLocation: "On display (Room 18 - Greece: Parthenon)",
    viewMinutes: 4, imagePath: "2014_9/29_18/2dcbb55c_f69e_4358_ae4b_a3b50131b707/preview_00154403_001.jpg", assetId: "154403001", gallery: "greece-parthenon",
  },
  {
    id: "G_1816-0610-93", museumNumber: "1816,0610.93", title: "Reclining figure from the Parthenon East pediment (figure D)", shortTitle: "Reclining figure (Dionysos?)", objectType: "Statue; pediment",
    date: "438–432 BC", culture: "Classical Greek", materials: ["marble"], findspot: "Parthenon, Athens",
    acquisition: "Purchased from Thomas Bruce, 7th Earl of Elgin",
    summary: "A relaxed reclining male figure, the only Parthenon pediment sculpture whose head survives. The gallery page calls him Dionysos.",
    facts: [
      ["overview", "This marble figure from the East pediment (figure D) is a naked man reclining on a rock, turned towards the chariot of the sun god Helios in the corner."],
      ["look", "He rests on a mantle thrown over an animal skin. The claws suggest a big cat."],
      ["detail", "It is the only pediment sculpture to survive with its head intact. Look for traces of two braids at the nape of the neck."],
      ["detail", "The hands and feet are missing. The left foot was still there when Jacques Carrey drew it in 1674."],
      ["context", "The Museum's gallery page lists this sculpture as 'Figure of Dionysos'; the collection record describes it without naming him.", "gallery"],
    ],
    tags: ["greece-rome", "religion", "sculpture"],
    room: "18", recordLocation: "On display (Room 18 - Greece: Parthenon)",
    viewMinutes: 4, imagePath: "2015_3/26_15/db0d1edd_e917_4950_be4d_a4670103c193/preview_GAA6842.jpg", assetId: null, imageVerified: false,
    imageNote: "No 'Use this image' licence page could be confirmed for this image, so it is not displayed.", gallery: "greece-parthenon",
  },

  // ───────────── Room 24 ─────────────
  {
    id: "E_Oc1869-1005-1", museumNumber: "Oc1869,1005.1", title: "Hoa Hakananaiʻa ('lost, hidden or stolen friend'), moai (ancestor figure)", shortTitle: "Hoa Hakananaiʻa", objectType: "Figure",
    date: "About AD 1000–1200", culture: "Rapa Nui", materials: ["basalt (ma'ea pupura)"], findspot: "Orongo ceremonial centre, Rapa Nui",
    dimensions: "2.42 m high", acquisition: "Donated by Queen Victoria and the Lords of the Admiralty",
    summary: "A basalt ancestor figure from Rapa Nui, whose back is carved with images linked to the birdman religion.",
    facts: [
      ["overview", "Hoa Hakananaiʻa is a moai, an ancestor figure from Rapa Nui (Easter Island), dated to about AD 1000–1200. The name means 'lost, hidden or stolen friend'."],
      ["look", "Walk round to the back to see petroglyphs linked to the birdman religion (tangata manu): birds, dance paddles in the form of stylised human figures, a ring and a girdle design."],
      ["context", "It is one of only fourteen moai carved from basalt. Most were carved from the island's softer volcanic tuff. It once stood at the sacred site of Orongo."],
      ["detail", "The eye sockets were originally inlaid with red stone and coral, and the figure was painted with red and white designs. The paint washed off when it was rafted out to a ship in 1869."],
      ["detail", "In April 2022, during an examination with M. Tuki, the stone was identified as the basalt called ma'ea pupura."],
    ],
    tags: ["world", "religion", "colossal", "sculpture", "collecting"], highlight: true,
    room: "24", recordLocation: "On display (Room 24 - Living and Dying)",
    viewMinutes: 5, imagePath: "2014_9/30_14/075fadd4_0ca9_4147_a598_a3b600e6e577/preview_00012842_001.jpg", assetId: "12842001", gallery: "living-and-dying",
  },

  // ───────────── Room 1 ─────────────
  {
    id: "H_SLMathInstr-54", museumNumber: "SLMathInstr.54", title: "The Sloane Astrolabe", shortTitle: "Sloane Astrolabe", objectType: "Astrolabe",
    date: "1290–1300", culture: "Medieval England", materials: ["copper alloy (brass?)"], dimensions: "46.2 cm diameter", acquisition: "Bequeathed by Sir Hans Sloane",
    summary: "The earliest and largest English astrolabe to survive from the Middle Ages, a brass star-calculator decorated with dog-headed star pointers.",
    facts: [
      ["overview", "This large brass astrolabe, made in England in 1290–1300, is the earliest and largest English astrolabe surviving from the Middle Ages. It shows knowledge of Arabic astronomy and instrument-making."],
      ["look", "Look at the Gothic star map (the rete). Many star pointers are shaped like dogs' heads, and the tip of each dog's tongue marks the star. Forty stars are named."],
      ["detail", "Its plates are engraved for the latitudes of places including Rome and Paris. The saints' days of Dunstan, Augustine of Canterbury and Edmund point to an English origin."],
      ["provenance", "It belonged to Sir Hans Sloane and so was part of the Museum's founding collection in 1753."],
    ],
    tags: ["science", "collecting", "craft"],
    room: "1", recordLocation: "On display (Room 1 - Enlightenment, Classification of Knowledge, Floor Case 12)", placement: "Classification of Knowledge, Floor Case 12",
    viewMinutes: 4, imagePath: "2014_10/1_6/9c7990a6_ca20_4152_98a8_a3b70065c509/preview_00030533_001.jpg", assetId: "30533001", gallery: "enlightenment",
  },
  {
    id: "H_SLAntiq-246", museumNumber: "SLAntiq.246", title: "The Grays Inn Lane handaxe", shortTitle: "Grays Inn Lane handaxe", objectType: "Handaxe",
    date: "About 350,000 BC", culture: "Palaeolithic", materials: ["flint"], findspot: "Near Grays Inn Lane (beneath modern Farringdon Road), London",
    dimensions: "16.5 cm high", acquisition: "Bequeathed by Sir Hans Sloane",
    summary: "A stone tool found in London in 1673 with elephant remains: the first handaxe ever recorded and illustrated.",
    facts: [
      ["overview", "This pointed flint handaxe, about 350,000 years old, was found in London in 1673 with the remains of an elephant."],
      ["context", "It is the first known handaxe to be recorded and published with an illustration (in 1715). It helped people realise how very long humans have existed."],
      ["detail", "Sir Hans Sloane's catalogue called it 'a British weapon' found with an elephant's tooth near Grays Inn Lane."],
      ["look", "Its orange-brown staining comes from lying in river gravel for thousands of years."],
    ],
    tags: ["science", "collecting", "craft"],
    room: "1", recordLocation: "On display (Room 1 - Enlightenment, Birth of Archaeology, Floor Case 6)", placement: "Birth of Archaeology, Floor Case 6",
    viewMinutes: 3, imagePath: "2014_10/2_16/a16006d7_9717_471d_873a_a3b80113dc7a/preview_00015136_003.jpg", assetId: "15136003", gallery: "enlightenment",
  },
  {
    id: "G_1805-0703-43", museumNumber: "1805,0703.43", title: "The Townley Diskobolos (discus thrower)", shortTitle: "Townley Diskobolos", objectType: "Statue",
    date: "2nd century AD", culture: "Roman", materials: ["marble"], findspot: "Hadrian's Villa, Tivoli",
    dimensions: "1.70 m high", acquisition: "Purchased from Peregrine Edward Towneley",
    summary: "A Roman marble copy of Myron's famous discus thrower, with a head that was put back on the wrong way.",
    facts: [
      ["overview", "This Roman marble statue copies the famous bronze discus thrower by the Greek sculptor Myron (about 460–450 BC), which is lost."],
      ["look", "Look at the head. It was restored facing down, but versions found with their heads intact show the athlete looking back towards the discus."],
      ["context", "In the 18th century, collectors generally wanted sculptures to look complete rather than authentic, so missing parts were often 'restored'."],
      ["provenance", "It was excavated at Hadrian's Villa at Tivoli in 1791, restored by Carlo Albacini, and bought by Charles Townley for £400."],
    ],
    tags: ["greece-rome", "sculpture", "collecting"],
    room: "1", recordLocation: "On display (Room 1 - Enlightenment, Near Wall Press 64)", placement: "Near Wall Press 64",
    viewMinutes: 4, imagePath: "2014_10/6_8/14e72733_cc42_46e7_a996_a3bc00932d94/preview_00396999_001.jpg", assetId: "396999001", gallery: "enlightenment",
  },
  {
    id: "G_1814-0704-703", museumNumber: "1814,0704.703", title: "Bronze cista (container for cosmetic items)", shortTitle: "Bronze cista", objectType: "Cista; cosmetic container",
    date: "3rd century BC (lid assembled in the 17th century)", culture: "Etrusco-Latin; Hellenistic", materials: ["bronze"],
    summary: "An engraved bronze box for cosmetics, standing on lion feet, from the collection of Charles Townley.",
    facts: [
      ["overview", "This bronze cista was a container for cosmetic items, made in the 3rd century BC."],
      ["look", "Its feet are lion's paws topped by crouching lions. Engraved scenes run around the body, though nobody has identified them with certainty."],
      ["detail", "The lid was assembled from pieces in the 17th century and does not belong to this vessel. The rim is restored."],
      ["context", "The Room 1 gallery page presents it as a 'cista mystica' (a casket used in the mysteries) from Charles Townley's collection.", "gallery"],
    ],
    tags: ["greece-rome", "craft", "collecting", "women"],
    room: "1", recordLocation: "On display (Room 1 - Enlightenment, Religions, Floor Case 20)", placement: "Religions, Floor Case 20",
    viewMinutes: 3, imagePath: "2014_10/1_6/ffec0938_8c84_40a4_b9ba_a3b7006bc1b3/preview_00032227_001.jpg", assetId: "32227001", gallery: "enlightenment",
  },

  // ───────────── Great Court ─────────────
  {
    id: "G_1859-1226-24", museumNumber: "1859,1226.24", title: "The Lion of Knidos", shortTitle: "Lion of Knidos", objectType: "Statue",
    date: "2nd century BC", culture: "Hellenistic", materials: ["marble", "glass (eyes, missing)"], findspot: "Lion Tomb, Knidos",
    dimensions: "1.82 m high, 2.89 m long", acquisition: "From Sir Charles Thomas Newton",
    summary: "A colossal reclining marble lion that once crowned a tomb at Knidos, now resting under the Great Court roof.",
    facts: [
      ["overview", "This colossal marble statue of a reclining lion, from the 2nd century BC, comes from the Lion Tomb at Knidos."],
      ["look", "Look at the empty eye sockets. They were inlaid, probably with glass."],
      ["material", "It is nearly 3 metres long and almost 2 metres high."],
    ],
    tags: ["greece-rome", "animals", "colossal", "afterlife"],
    room: "GC", recordLocation: "On display (The Great Court)",
    viewMinutes: 2, imagePath: "2014_10/2_17/0f9b8be3_02c4_48e8_8cad_a3b801203313/preview_00318080_001.jpg", assetId: "318080001", gallery: "great-court",
  },
  {
    id: "E_Am1903-0314-1", museumNumber: "Am1903,0314.1", title: "Totem pole from Kayang, Masset", shortTitle: "Totem pole", objectType: "Totem pole",
    date: "About 1850", culture: "Northwest Coast, British Columbia (Canada)", materials: ["cedar wood"], findspot: "Kayang, Masset, British Columbia",
    dimensions: "About 11.6 m high", acquisition: "Purchased from Dr Charles Frederick Newcombe",
    summary: "A towering cedar totem pole, about 11.6 metres high, carved around 1850 at Kayang, Masset, in British Columbia.",
    facts: [
      ["overview", "This totem pole was carved from solid cedar around 1850 and comes from Kayang, Masset, in British Columbia, Canada."],
      ["material", "It is about 11.6 metres tall."],
      ["detail", "The Museum's pictorial collection holds two photographs of the pole in its original location."],
    ],
    tags: ["world", "colossal", "craft", "collecting"],
    room: "GC", recordLocation: "On display (The Great Court)",
    viewMinutes: 3, imagePath: "2014_10/2_17/6a1aa24d_485c_4b1f_88cb_a3b8011f6bf9/preview_00317940_001.jpg", assetId: "317940001", gallery: "great-court",
  },

  // ═════════════ Added 12 Oct 2026 (second batch, balanced across themes) ═════════════

  // ───────────── Room 4: Egyptian sculpture ─────────────
  {
    id: "Y_EA686", museumNumber: "EA686", title: "Statue of Senusret III", shortTitle: "Senusret III", objectType: "Statue",
    date: "About 1874–1855 BC", culture: "12th Dynasty", materials: ["granodiorite"], findspot: "Temple of Mentuhotep II, Deir el-Bahri (Thebes)",
    dimensions: "142 cm high (max)", acquisition: "Donated by the Egypt Exploration Fund",
    summary: "A standing king with his hands flat on his kilt in a gesture of prayer. His young, smooth body contrasts with a tired, deeply lined face — a famous feature of this king's portraits.",
    facts: [
      ["overview", "Senusret III stands in a pose of prayer, with his open hands resting on the front of his pleated kilt."],
      ["look", "Compare the face and the body: the torso is soft and youthful, but the face has hooded eyes, sharp cheekbones and heavy lines."],
      ["look", "He wears the striped nemes head-cloth with a cobra at the brow. A cartouche with his name sits on the front of his belt."],
      ["context", "It is one of six very similar statues of this king found beneath the platform of Mentuhotep II's funerary temple, where they had been thrown down in antiquity."],
      ["provenance", "All six had lost their legs and only four kept their heads. One is in Cairo; the Museum has three."],
    ],
    tags: ["egypt", "power", "sculpture", "religion"],
    room: "4", recordLocation: "On display (Room 4 - Egyptian sculpture, Bay 21)", placement: "Bay 21",
    viewMinutes: 3, imagePath: "2014_9/30_11/f12b4ee9_7205_49cd_854e_a3b600c5aaaa/preview_00006094_001.jpg", assetId: "6094001", gallery: "egyptian-sculpture",
  },
  {
    id: "Y_EA10", museumNumber: "EA10", title: "Sarcophagus of Nectanebo II", shortTitle: "Nectanebo II sarcophagus", objectType: "Sarcophagus",
    date: "About 345 BC", culture: "30th Dynasty", materials: ["conglomerate"], findspot: "Courtyard of the Attarin Mosque, Alexandria",
    dimensions: "313.5 cm long, 162 cm wide, 118.5 cm high (max)", acquisition: "Donated by King George III, 1802",
    summary: "A huge stone coffin made for King Nectanebo II. Centuries later it was reused as a ritual washing basin in a mosque in Alexandria.",
    facts: [
      ["overview", "This massive sarcophagus was made for Nectanebo II, around 345 BC."],
      ["look", "The outside is covered in hieroglyphic texts and images from the Amduat, a guide to the sun god's night journey through the underworld."],
      ["look", "Near the base you can see twelve drilled holes, made when it was reused as a bath for ritual washing in the Attarin Mosque."],
      ["detail", "Inside there were once figures of funerary gods, including Isis and Nephthys at the ends, but water has worn most of them away."],
      ["provenance", "When it came to the Museum it was believed to be linked to Alexander the Great. It was donated by King George III in 1802."],
      ["material", "It is carved from a hard, speckled conglomerate stone, once labelled 'green breccia'."],
    ],
    tags: ["egypt", "afterlife", "religion", "writing", "colossal", "collecting"],
    room: "4", recordLocation: "On display (Room 4 - Egyptian sculpture, Bay 8)", placement: "Bay 8",
    viewMinutes: 4, imagePath: "2014_10/6_8/94fa0a8a_6098_4cf9_b80e_a3bc008e06c5/preview_00395294_001.jpg", assetId: "395294001", gallery: "egyptian-sculpture",
  },
  {
    id: "Y_EA1203", museumNumber: "EA1203", title: "Stela of Intef, son of Ka", shortTitle: "Stela of Intef", objectType: "Stela",
    date: "About 2101–2070 BC", culture: "11th Dynasty", materials: ["limestone"], findspot: "Tomb of Intef, Thebes",
    dimensions: "72 cm high, 102 cm long", acquisition: "Purchased 1897",
    summary: "A painted tomb stela showing an official named Intef with his three wives, Mery, Iutu and Iru, receiving offerings so that he would be provided for after death.",
    facts: [
      ["overview", "This limestone stela comes from the tomb of an official called Intef at Thebes, from around 2100 BC."],
      ["look", "Intef stands receiving an offering from a much smaller man. Behind him are three women, all named as his wives: Mery, Iutu and Iru."],
      ["context", "The unusual proportions and placing of the figures are typical of the period between the Old and Middle Kingdoms."],
      ["detail", "The text runs along the top and down the side. It mixes standard offering prayers with an idealised life story and some historical information."],
    ],
    tags: ["egypt", "afterlife", "writing", "women"],
    room: "4", recordLocation: "On display (Room 4 - Egyptian sculpture, Bay 23)", placement: "Bay 23",
    viewMinutes: 3, imagePath: "2014_9/29_15/3c72542c_e95b_4f3a_889a_a3b50105f527/preview_00141188_001.jpg", assetId: "141188001", gallery: "egyptian-sculpture",
  },
  {
    id: "Y_EA57", museumNumber: "EA57", title: "Seated statue of the goddess Sekhmet", shortTitle: "Sekhmet", objectType: "Statue",
    date: "18th Dynasty", culture: "18th Dynasty", materials: ["granodiorite"], findspot: "Probably the Temple of Mut, Thebes",
    dimensions: "192 cm high",
    summary: "A lion-headed goddess seated on a throne, almost two metres tall, carved in dark granodiorite.",
    facts: [
      ["overview", "This granodiorite statue shows the lion-headed goddess Sekhmet seated on a throne."],
      ["look", "Look above her head: much of the sun disc she once wore has broken away."],
      ["context", "The record suggests, with a question mark, that it came from the Temple of Mut at Thebes."],
      ["material", "It is carved from dark granodiorite and is almost two metres tall."],
    ],
    tags: ["egypt", "religion", "animals", "women", "sculpture"],
    room: "4", recordLocation: "On display (Room 4 - Egyptian sculpture, Bay 15)", placement: "Bay 15",
    viewMinutes: 2, imagePath: "2014_10/1_16/0b2dc637_e08f_48b9_8b30_a3b701174fa0/preview_00088519_001.jpg", assetId: "88519001", gallery: "egyptian-sculpture",
  },
  {
    id: "Y_EA682", museumNumber: "EA682", title: "False door and architrave of Ptahshepses", shortTitle: "False door of Ptahshepses", objectType: "False door; architrave",
    date: "5th Dynasty", culture: "5th Dynasty", materials: ["limestone"], findspot: "Tomb of Ptahshepses, Saqqara",
    dimensions: "366 cm high, 417 cm wide (architrave)", acquisition: "Purchased 1897",
    summary: "A carved stone 'door' from a tomb, through which the spirit of the dead man could come and go to receive offerings. Its texts tell the life story of a high official who served several kings.",
    facts: [
      ["overview", "A false door was a carved doorway in a tomb chapel, a symbolic point where the spirit could pass between the world of the dead and the living to collect offerings."],
      ["look", "The panels on either side carry Ptahshepses' biography in sharply cut hieroglyphs. Long side panels show piles of food offerings."],
      ["detail", "He describes being born under King Menkaure (Mycerinus), marrying a princess named Khamaat and serving under several later kings."],
      ["detail", "The top beam (architrave) carries five lines of prayers to Osiris and Anubis."],
      ["material", "The limestone was painted mottled pink to imitate granite, and much of that colour survives."],
      ["provenance", "A fragment of the same door is in the Oriental Institute in Chicago."],
    ],
    tags: ["egypt", "afterlife", "writing", "power"],
    room: "4", recordLocation: "On display (Room 4 - Egyptian sculpture, Bay 24)", placement: "Bay 24",
    viewMinutes: 4, imagePath: "2014_10/1_7/d0644dee_0d7a_46d5_9b28_a3b700785c5b/preview_00035767_001.jpg", assetId: "35767001", gallery: "egyptian-sculpture",
  },

  // ───────────── The Great Court ─────────────
  {
    id: "Y_EA6", museumNumber: "EA6", title: "Head of Amenhotep III wearing the red crown", shortTitle: "Amenhotep III (red crown)", objectType: "Statue (head)",
    date: "18th Dynasty", culture: "18th Dynasty", materials: ["quartzite"], findspot: "Memorial temple of Amenhotep III, Thebes",
    dimensions: "117 cm high (max)", acquisition: "Purchased from Henry Salt, 1823",
    summary: "The head of a giant quartzite statue of Amenhotep III, wearing the red crown of Lower Egypt. It stands out in the open space of the Great Court.",
    facts: [
      ["overview", "This is the head from a monumental statue of King Amenhotep III."],
      ["look", "He wears the tall red crown associated with Lower (northern) Egypt."],
      ["context", "It comes from Amenhotep III's memorial temple at Thebes, the same king shown by the colossal granite head in Room 4."],
      ["provenance", "The Museum bought it from Henry Salt, the British Consul-General in Egypt, in 1823."],
      ["material", "It is made of quartzite and is over a metre tall even without the rest of the body."],
    ],
    tags: ["egypt", "power", "colossal", "sculpture", "collecting"],
    room: "GC", recordLocation: "On display (The Great Court)",
    viewMinutes: 2, imagePath: "2014_10/2_21/d312c0b3_ac8a_4409_bbf2_a3b80167a9db/preview_00336874_001.jpg", assetId: "336874001", gallery: "great-court",
  },
  {
    id: "H_1866-0511-3", museumNumber: "1866,0511.3", title: "Ogham stone from Roovesmore, County Cork", shortTitle: "Ogham stone", objectType: "Standing stone",
    date: "5th–7th century AD", culture: "Early medieval Irish", materials: ["red sandstone"], findspot: "Roovesmore Rath, Aglish, County Cork, Ireland",
    dimensions: "191 cm high", acquisition: "Donated by Augustus Henry Lane Fox Pitt-Rivers",
    summary: "A tall standing stone with notches cut along its edges. The notches are letters in ogham, an early medieval alphabet used in Ireland.",
    facts: [
      ["overview", "This red sandstone slab comes from Roovesmore in County Cork, Ireland, and dates to about the 5th–7th centuries AD."],
      ["look", "Look along the edges: the groups of short strokes and notches are letters in the ogham alphabet."],
      ["detail", "The stone was studied in a recent research project (2021–2024) by the universities of Glasgow and Maynooth on ogham writing."],
      ["provenance", "It was donated by the archaeologist Augustus Pitt-Rivers, who published it in 1867."],
    ],
    tags: ["writing", "world", "collecting"],
    room: "GC", recordLocation: "On display (The Great Court)",
    viewMinutes: 2, imagePath: "2014_10/1_7/c3fdc158_3cf4_4da2_90a4_a3b7007d69ec/preview_00037373_001.jpg", assetId: "37373001", gallery: "great-court",
  },

  // ───────────── Room 1: Enlightenment ─────────────
  {
    id: "H_1756-0619-1", museumNumber: "1756,0619.1", title: "Bust of Sir Hans Sloane by Michael Rysbrack", shortTitle: "Bust of Hans Sloane", objectType: "Portrait bust",
    date: "18th century", culture: "British", materials: ["terracotta"],
    dimensions: "68.5 cm high", acquisition: "Donated 1756",
    summary: "A terracotta portrait of Hans Sloane, the physician and collector whose collection founded the British Museum in 1753.",
    facts: [
      ["overview", "This terracotta bust portrays Sir Hans Sloane (1660–1753) and is by the sculptor Michael Rysbrack."],
      ["look", "He wears an elaborate wig and a lace collar. The sculptor even included a mole on his lower left cheek."],
      ["context", "Sloane's collection became the founding collection of the British Museum. The bust is shown in the Room 1 section on the classification of knowledge."],
      ["provenance", "It was given to the Museum in 1756, only three years after its foundation."],
    ],
    tags: ["collecting", "science", "sculpture"],
    room: "1", recordLocation: "On display (Room 1 - Enlightenment, Classification of Knowledge, Floor Case 14)", placement: "Classification of Knowledge, Floor Case 14",
    viewMinutes: 2, imagePath: "2014_9/30_11/2bfe2d40_91e2_4b70_9c8f_a3b600c59997/preview_00006091_003.jpg", assetId: "6091003", gallery: "enlightenment",
  },
  {
    id: "G_1868-0512-1", museumNumber: "1868,0512.1", title: "The Piranesi Vase", shortTitle: "Piranesi Vase", objectType: "Vase",
    date: "2nd century AD (ancient parts); assembled 18th century", culture: "Roman (ancient parts)", materials: ["marble"], findspot: "Hadrian's Villa, Tivoli (ancient parts)",
    dimensions: "About 272 cm high", acquisition: "Purchased 1868",
    summary: "A towering marble vase pieced together in the 1700s by the workshop of Giovanni Battista Piranesi from ancient Roman fragments and new carving.",
    facts: [
      ["overview", "This huge vase combines ancient Roman marble fragments from Hadrian's Villa with 18th-century carving by Piranesi's workshop."],
      ["look", "Find the frieze of satyrs gathering grapes around the bowl. It stands on three legs over a triangular base."],
      ["context", "Scholars long treated it as a pastiche, but the record notes that the satyr frieze is a careful restoration of many original pieces, matching a scene on a complete Roman altar in Naples."],
      ["context", "It shows how 18th-century collectors and dealers 'completed' ancient sculpture for display and sale."],
      ["material", "It is marble and stands about 2.7 metres tall in the centre of the gallery."],
    ],
    tags: ["greece-rome", "collecting", "craft", "colossal"],
    room: "1", recordLocation: "On display (Room 1 - Enlightenment, Centre of Gallery)", placement: "Centre of Gallery",
    viewMinutes: 2, imagePath: "2014_10/1_6/1bad5b31_85a7_4fca_9b24_a3b7006f669c/preview_00033325_001.jpg", assetId: "33325001", gallery: "enlightenment",
  },
  {
    id: "A_As1942-01-1", museumNumber: "As1942,01.1", title: "'Merman' figure with storage box", shortTitle: "Japanese 'merman'", objectType: "Figure; storage box",
    date: "18th century (?)", culture: "Edo period, Japan", materials: ["fish parts", "metal", "clay", "plaster", "hair"],
    dimensions: "Figure 38 cm long", acquisition: "Donated by Princess Arthur of Connaught, 1942",
    summary: "A small, unsettling 'merman' made from a fish tail and other materials — one of many fake sea-creatures made in Japan and shown as curiosities in Europe.",
    facts: [
      ["overview", "This figure of a merman is a composite made from a fish tail over an armature, with other materials forming the head and body."],
      ["look", "The head has no skull inside. The teeth and jaw are probably from a fish. It comes with its own wooden storage box."],
      ["context", "From at least the 1600s, mermaids and mermen like this were shown in European drawing rooms and sideshows. Many seem to have been made in Japan."],
      ["provenance", "It was said to have been 'caught' in Japan in the 18th century, and was donated by Princess Arthur of Connaught."],
      ["detail", "Similar figures are in the Wellcome collection and the Horniman Museum."],
    ],
    tags: ["world", "animals", "collecting", "craft", "science"],
    room: "1", recordLocation: "On display (Room 1 - Enlightenment, Classification of Knowledge, Wall Press 155, Shelf 6)", placement: "Classification of Knowledge, Wall Press 155",
    viewMinutes: 2, imagePath: "2014_10/11_0/e77e1ae7_a502_47e0_bcfe_a3c1000496d7/preview_00578106_001.jpg", assetId: "578106001", gallery: "enlightenment",
  },
  {
    id: "E_Oc1978-Q-839", museumNumber: "Oc1978,Q.839", title: "Bark shield from New South Wales", shortTitle: "Bark shield (NSW)", objectType: "Shield",
    date: "1771 or earlier", culture: "Aboriginal Australian", materials: ["red mangrove wood", "bark"], findspot: "Botany Bay, New South Wales (recorded)",
    dimensions: "97.3 cm high, 32.3 cm wide", acquisition: "Donated by the Lords of the Admiralty",
    summary: "A bark and wood shield from south-east Australia, with a hole near its centre. It was long linked to Captain Cook's landing at Botany Bay in 1770 — a link that recent research questions.",
    facts: [
      ["overview", "This oval shield of bark and red mangrove wood was made in New South Wales, Australia, by 1771 at the latest."],
      ["look", "Look for the ragged hole near the centre and traces of white clay on the blackened outer surface. A thin handle is fixed to the back."],
      ["provenance", "It was once thought to have been taken during Cook's first voyage, when the Endeavour reached Botany Bay in 1770, based on voyage journals and drawings."],
      ["context", "More recent research (2018) argues it is probably not the shield shown in the voyage drawings. How it came to be linked with Cook is still being studied."],
    ],
    tags: ["world", "conflict", "collecting", "craft"],
    room: "1", recordLocation: "On display (Room 1 - Enlightenment, Trade & Discovery, Wall Press 96)", placement: "Trade & Discovery, Wall Press 96",
    viewMinutes: 3, imagePath: "2014_10/11_1/d426428c_8628_4574_983f_a3c10019fa10/preview_00585093_001.jpg", assetId: "585093001", gallery: "enlightenment",
  },
  {
    id: "G_1805-0703-79", museumNumber: "1805,0703.79", title: "Portrait bust known as 'Clytie'", shortTitle: "'Clytie' bust", objectType: "Portrait bust",
    date: "About AD 40–50 (debated)", culture: "Roman", materials: ["marble"], findspot: "Said to be from Naples",
    dimensions: "63 cm high", acquisition: "Purchased from Peregrine Edward Towneley, 1805",
    summary: "A marble bust of a young woman — Charles Townley's favourite sculpture. Who she is, and even whether it is ancient, is still debated.",
    facts: [
      ["overview", "This marble portrait bust shows a young woman. It may portray Antonia the Younger, mother of the Emperor Claudius."],
      ["context", "It was long called 'Clytie', after a nymph in Greek myth who was turned into a flower because of her unrequited love for the sun god."],
      ["detail", "It was Charles Townley's favourite piece. He bought it in Naples in 1772, and it was the only marble he took with him when he fled his house during the Gordon Riots of 1780."],
      ["context", "Scholars disagree about its date: some accept it as Roman, from about AD 40–50, while others think it is an 18th-century work. It was probably recut in the 1700s."],
    ],
    tags: ["greece-rome", "women", "sculpture", "collecting"],
    room: "1", recordLocation: "On display (Room 1 - Enlightenment, Near Wall Press 41)", placement: "Near Wall Press 41",
    viewMinutes: 2, imagePath: "2014_10/1_6/3e340e6b_f914_4167_bf53_a3b7006f6817/preview_00033326_001.jpg", assetId: "33326001", gallery: "enlightenment",
  },

  // ───────────── Room 6: Assyrian sculpture ─────────────
  {
    id: "W_1851-0902-509", museumNumber: "118802", registrationNumber: "1851,0902.509", title: "Human-headed winged lion from Nimrud", shortTitle: "Winged lion (Room 6)", objectType: "Sculpture",
    date: "865–860 BC", culture: "Neo-Assyrian", materials: ["gypsum"], findspot: "North-West Palace of Ashurnasirpal II, Nimrud (throne-room doorway)",
    dimensions: "350 cm high, 371 cm long",
    summary: "A colossal winged lion with a human head, one of a pair that guarded the throne-room door of King Ashurnasirpal II. Count its legs.",
    facts: [
      ["overview", "This human-headed winged lion was one of a pair flanking the doorway of Ashurnasirpal II's throne room at Nimrud."],
      ["look", "Count the legs: there are five. From the front it looks as if it is standing still; from the side it seems to be striding forward."],
      ["context", "Creatures like this were believed to give magical protection to the palace and the king."],
      ["detail", "Its partner, 1851,0902.508, was made to stand on the other side of the same door."],
      ["material", "Carved from gypsum, it is 3.5 metres tall."],
    ],
    tags: ["mesopotamia", "religion", "colossal", "animals", "power"],
    room: "6", recordLocation: "On display (Room 6a - Assyrian sculpture)", placement: "Room 6a",
    viewMinutes: 2, imagePath: "2014_10/1_6/68d3eebc_a6ee_4aea_b88f_a3b7006dce84/preview_00032860_001.jpg", assetId: "32860001", gallery: "assyrian-sculpture-and-balawat-gates",
  },
  {
    id: "W_1851-0902-32", museumNumber: "118805", registrationNumber: "1851,0902.32", title: "Stela of Ashurnasirpal II", shortTitle: "Stela of Ashurnasirpal II", objectType: "Stela",
    date: "865–860 BC", culture: "Neo-Assyrian", materials: ["limestone"], findspot: "Temple of Ninurta, Nimrud (beside the entrance)",
    dimensions: "About 294 cm high; about 4 tonnes",
    summary: "A tall stone portrait of King Ashurnasirpal II pointing towards the symbols of five gods, with a cuneiform inscription wrapped around the back and sides.",
    facts: [
      ["overview", "This stela stood beside the entrance of the Temple of Ninurta at Nimrud and shows King Ashurnasirpal II."],
      ["look", "The king holds a mace and raises his right hand with a pointing finger, a gesture of respect to the gods."],
      ["look", "Find the five divine symbols: a horned helmet (Ashur), a winged disc (Shamash, the sun), a crescent (Sin, the moon), a forked thunderbolt (Adad, the storm) and a star (Ishtar). He wears similar symbols on his chest."],
      ["detail", "Cuneiform text covers the back and sides."],
      ["detail", "The excavator Layard noted that the fire which destroyed the temple had broken it into two pieces."],
      ["material", "It is limestone, although it has often been mislabelled as alabaster or gypsum."],
    ],
    tags: ["mesopotamia", "power", "religion", "writing"],
    room: "6", recordLocation: "On display (Room 6a - Assyrian sculpture)", placement: "Room 6a",
    viewMinutes: 3, imagePath: "2014_10/1_6/5c473d05_08e6_4647_b0d1_a3b70063492d/preview_00029940_001.jpg", assetId: "29940001", gallery: "assyrian-sculpture-and-balawat-gates",
  },
  {
    id: "W_1849-1222-9", museumNumber: "118881", registrationNumber: "1849,1222.9", title: "Relief: captured sheep and goats", shortTitle: "Sheep and goats relief", objectType: "Wall panel; relief",
    date: "733–732 BC", culture: "Neo-Assyrian", materials: ["gypsum"], findspot: "Central Palace of Tiglath-pileser III, Nimrud",
    dimensions: "162.6 cm high, 101.6 cm wide",
    summary: "Three rows of captured goats and sheep driven away as plunder — including a young goat cheekily leaping onto another's back.",
    facts: [
      ["overview", "This worn relief from the palace of Tiglath-pileser III shows flocks taken from a defeated people."],
      ["look", "In the middle row, a kid goat jumps onto the back of its companion — a lively detail among the orderly rows."],
      ["look", "The rows include spiral-horned goats and fat-tailed sheep. A soldier driving them is now almost invisible on the right."],
      ["context", "Livestock were a major part of the plunder recorded in Assyrian campaign scenes."],
    ],
    tags: ["mesopotamia", "animals", "conflict"],
    room: "6", recordLocation: "On display (Room 6a - Assyrian sculpture)", placement: "Room 6a",
    viewMinutes: 2, imagePath: "2014_10/2_20/97b81983_2daa_42c5_a62c_a3b8014b4b7b/preview_00329121_001.jpg", assetId: "329121001", gallery: "assyrian-sculpture-and-balawat-gates",
  },

  // ───────────── Rooms 7–8: Nimrud ─────────────
  {
    id: "W_1849-0502-1", museumNumber: "124560", registrationNumber: "1849,0502.1", title: "Relief: protective spirit carrying a deer", shortTitle: "Spirit with deer", objectType: "Wall panel; relief",
    date: "865–860 BC", culture: "Neo-Assyrian", materials: ["gypsum"], findspot: "North-West Palace of Ashurnasirpal II, Nimrud",
    dimensions: "225 cm high, 135 cm wide",
    summary: "A winged protective spirit carrying a deer and a palm branch, carved to guard a doorway to the royal throne room.",
    facts: [
      ["overview", "This panel shows a winged protective spirit holding a deer in one arm and a palm branch in the other."],
      ["context", "It once guarded a doorway to Ashurnasirpal II's throne room at Nimrud."],
      ["look", "A band of cuneiform inscription runs across the relief."],
      ["context", "It is featured on the Museum's Nimrud gallery page.", "gallery"],
    ],
    tags: ["mesopotamia", "religion", "animals", "writing"],
    room: "7", recordLocation: "On display (Room 7 - Assyria: Nimrud)",
    viewMinutes: 2, imagePath: "2014_10/1_6/78dfd53a_16cb_48ee_9c66_a3b7006c79eb/preview_00032390_001.jpg", assetId: "32390001", gallery: "assyria-nimrud",
  },
  {
    id: "W_1849-0502-6", museumNumber: "118882", registrationNumber: "1849,0502.6", title: "Relief: a captured city and its people deported", shortTitle: "Captured city relief", objectType: "Wall panel; relief",
    date: "728 BC", culture: "Neo-Assyrian", materials: ["gypsum"], findspot: "Central Palace of Tiglath-pileser III, Nimrud",
    dimensions: "99 cm high, 290 cm long (with its neighbouring slab)",
    summary: "After a city falls, a scribe takes notes while women and children are carried off in ox-carts — a rare glimpse of the people caught up in war.",
    facts: [
      ["overview", "This relief shows a walled city in Babylonia after its capture, with its people and animals being taken away."],
      ["look", "Find the scribe writing as an officer dictates to him."],
      ["look", "In the loaded ox-cart, two women and a boy sit on top. One woman holds a bottle, the other a staff, with her veil over her shoulders."],
      ["look", "The city has a double wall with towers and three gateways. A date palm inside tells you it is in Babylonia. Two battering rams stand idle — the city has already fallen."],
      ["detail", "The excavator Layard realised this slab and a neighbouring one formed a single scene."],
    ],
    tags: ["mesopotamia", "conflict", "women", "writing", "power"],
    room: "8", recordLocation: "On display (Room 8 - Assyria: Nimrud)",
    viewMinutes: 3, imagePath: "2014_10/1_6/36c10197_5f2b_4f9d_836d_a3b7006c31ba/preview_00032419_001.jpg", assetId: "32419001", gallery: "assyria-nimrud",
  },
  {
    id: "W_1851-0902-35", museumNumber: "118925", registrationNumber: "1851,0902.35", title: "Inscribed door sill of Adad-nirari III", shortTitle: "Inscribed door sill", objectType: "Door sill",
    date: "Reign of Adad-nirari III", culture: "Neo-Assyrian", materials: ["alabaster"], findspot: "Nimrud",
    dimensions: "195.6 cm by 144.8 cm",
    summary: "A stone threshold covered in cuneiform, laid in a palace doorway so that everyone walking in stepped over the king's family tree.",
    facts: [
      ["overview", "This alabaster slab was the sill of a doorway in a palace built under King Adad-nirari III."],
      ["look", "The whole surface is filled with cuneiform: a genealogical inscription tracing the king's ancestry."],
      ["context", "Inscribed thresholds placed the king's name and lineage at the very entrance of the building."],
    ],
    tags: ["mesopotamia", "writing", "power"],
    room: "8", recordLocation: "On display (Room 8 - Assyria: Nimrud)",
    viewMinutes: 2, imagePath: "2014_11/2_15/0ea499cd_0a81_4816_a046_a3d700fb3c15/preview_01089185_001.jpg", assetId: "1089185001", gallery: "assyria-nimrud",
  },

  // ───────────── Room 10: Lion hunts ─────────────
  {
    id: "W_1856-0909-21_2", museumNumber: "124897", registrationNumber: "1856,0909.21", title: "Relief: going out to the hunt", shortTitle: "Going out to the hunt", objectType: "Wall panel; relief",
    date: "645–635 BC", culture: "Neo-Assyrian", materials: ["gypsum"], findspot: "North Palace of Ashurbanipal, Nineveh (Room R)",
    dimensions: "152.4 cm by 101.6 cm",
    summary: "A quieter moment before the royal lion hunt: an attendant leads a donkey along the corridor the king probably used on his way out.",
    facts: [
      ["overview", "This panel shows an attendant with a donkey, part of a procession setting out for the hunt."],
      ["context", "It lined a corridor leading to the palace's eastern gate, which the king probably passed through on his way to hunt."],
      ["context", "It belongs to a set of panels from the same corridor, all registered as 1856,0909.21.", "record"],
      ["context", "It is featured on the Museum's Lion Hunts gallery page.", "gallery"],
    ],
    tags: ["mesopotamia", "animals", "conflict"],
    room: "10", recordLocation: "On display (Room 10a - Assyria: Lion Hunts, Section C)", placement: "Room 10a, Section C",
    viewMinutes: 2, imagePath: "2014_10/5_17/1f1f4390_6adb_409e_9ab3_a3bb011e4df9/preview_00358233_001.jpg", assetId: "358233001", gallery: "assyria-lion-hunts",
  },

  // ───────────── Room 17: Nereid Monument ─────────────
  {
    id: "G_1848-1020-62", museumNumber: "1848,1020.62", title: "Nereid Monument frieze: a ruler receives envoys", shortTitle: "Nereid frieze: the ruler", objectType: "Frieze",
    date: "About 390–380 BC", culture: "Classical Greek (Lycian)", materials: ["marble"], findspot: "Nereid Monument, Xanthos (Lycia, modern Turkey)",
    dimensions: "129 cm long", acquisition: "Brought to Britain by Sir Charles Fellows",
    summary: "A seated ruler in a Persian head-dress, shaded by a parasol, receives two elderly men — probably the tomb's owner, the Lycian dynast Arbinas.",
    facts: [
      ["overview", "This slab comes from the smaller upper frieze of the Nereid Monument's base, which showed scenes of military campaigns."],
      ["look", "The ruler sits on a lion-footed seat with his feet on a footstool, while an attendant holds a parasol over him."],
      ["look", "On the right, two bearded old men in civilian dress raise their hands — perhaps townspeople asking for terms after their city surrendered."],
      ["context", "The ruler is probably Arbinas, whose tomb this was. His Persian costume reflects his position under the Great King of Persia, while his entourage dresses in Greek style."],
    ],
    tags: ["greece-rome", "power", "conflict", "afterlife"],
    room: "17", recordLocation: "On display (Room 17 - Nereid Monument)",
    viewMinutes: 2, imagePath: "2014_11/12_11/542956c7_2d4b_4f5e_8648_a3e100c060b6/preview_00100680_001.jpg", assetId: "100680001", gallery: "nereid-monument",
  },
  {
    id: "G_1848-1020-82", museumNumber: "1848,1020.82", title: "Nereid statue with a crab", shortTitle: "Nereid with crab", objectType: "Statue",
    date: "About 390–380 BC", culture: "Classical Greek (Lycian)", materials: ["marble"], findspot: "Nereid Monument, Xanthos (Lycia, modern Turkey)",
    dimensions: "About 99 cm high", acquisition: "Brought to Britain by Sir Charles Fellows",
    summary: "The lower half of a running sea-nymph, her dress swirling around her legs — with a large crab at her feet to show she belongs to the sea.",
    facts: [
      ["overview", "This statue probably shows a Nereid, a sea-nymph, and once stood between the columns of the Nereid Monument."],
      ["look", "Only the figure from the waist down survives. Look beneath the hem of her dress for the large crab."],
      ["look", "Her fine dress parts to reveal her right leg as she runs to the right."],
      ["context", "The statue is part of the Museum's reconstruction of the monument's front."],
    ],
    tags: ["greece-rome", "women", "sculpture", "animals", "religion"],
    room: "17", recordLocation: "On display (Room 17 - Nereid Monument)",
    viewMinutes: 2, imagePath: "2014_9/29_21/41a66f1a_90ed_4a36_a185_a3b50167f73c/preview_00173438_001.jpg", assetId: "173438001", gallery: "nereid-monument",
  },

  // ───────────── Room 18: Parthenon ─────────────
  {
    id: "G_1816-0610-97", museumNumber: "1816,0610.97", title: "Two goddesses from the East pediment of the Parthenon", shortTitle: "Parthenon goddesses", objectType: "Pediment sculpture",
    date: "438–432 BC", culture: "Classical Greek", materials: ["marble"], findspot: "Parthenon, Athens",
    dimensions: "About 123 cm high, 233 cm long", acquisition: "Purchased from the 7th Earl of Elgin, 1816",
    summary: "Two female figures carved from a single block, one reclining in the other's lap, their thin clothing falling in deep folds. They watched the birth of Athena.",
    facts: [
      ["overview", "These two figures come from the East pediment of the Parthenon, which showed Athena being born from the head of her father Zeus."],
      ["look", "One sits upright and the other reclines across her lap, her right shoulder bare. Look at how the folds of their clothing ripple over their bodies."],
      ["look", "A small hole on the reclining figure's arm shows where a bracelet was once attached."],
      ["context", "They may be the goddesses Dione and her daughter Aphrodite, or personifications of the Sea in the lap of the Earth."],
      ["detail", "Both figures are carved from one block of marble. Their heads, hands and feet are missing."],
    ],
    tags: ["greece-rome", "women", "religion", "sculpture", "collecting"], highlight: true,
    room: "18", recordLocation: "On display (Room 18 - Greece: Parthenon)",
    viewMinutes: 3, imagePath: "2014_10/9_11/3ebd48d8_fa5d_46b0_82ca_a3bf00bac562/preview_00507103_001.jpg", assetId: "507103001", gallery: "greece-parthenon",
  },
  {
    id: "G_1816-0610-99", museumNumber: "1816,0610.99", title: "River-god from the West pediment of the Parthenon (Ilissos?)", shortTitle: "River-god (Ilissos?)", objectType: "Pediment sculpture",
    date: "438–432 BC", culture: "Classical Greek", materials: ["marble"], findspot: "Parthenon, Athens",
    dimensions: "81 cm high, 188 cm long", acquisition: "Purchased from the 7th Earl of Elgin, 1816",
    summary: "A reclining male figure, probably the Athenian river-god Ilissos, caught as he lifts himself up to watch Athena and Poseidon's contest.",
    facts: [
      ["overview", "This reclining naked man comes from the far left corner of the Parthenon's West pediment, which showed Athena and Poseidon competing to rule Attica."],
      ["look", "He seems to be pushing himself up and turning towards the centre. A cloth falls over his left arm and flows behind him."],
      ["detail", "His back is carved in surprising detail, even though nobody would have seen it once it was set in the pediment."],
      ["context", "He is thought to be the river-god Ilissos, named after a stream in Athens."],
      ["detail", "The head and several limbs were already missing when Carrey drew the pediment in 1674."],
    ],
    tags: ["greece-rome", "religion", "sculpture", "collecting"],
    room: "18", recordLocation: "On display (Room 18 - Greece: Parthenon)",
    viewMinutes: 2, imagePath: null, assetId: null,
    imageNote: "No image on the record could be confirmed with a CC BY-NC-SA 4.0 licence page, so none is shown.", gallery: "greece-parthenon",
  },

  // ───────────── Room 24: Living and Dying ─────────────
  {
    id: "E_2013-2035-1", museumNumber: "2013,2035.1", title: "Pukara, painting by Spinifex artists", shortTitle: "Pukara painting", objectType: "Painting",
    date: "2013", culture: "Spinifex People, Western Australia", materials: ["acrylic on canvas"], findspot: "Painted at Tjuntjuntjara, Western Australia",
    dimensions: "198 × 219 cm", acquisition: "Purchased 2013",
    summary: "A large collaborative painting by four senior Spinifex men about Pukara and the Wati Kutjara (two men), ancestral beings whose journey forms a songline across the Western Desert.",
    facts: [
      ["overview", "This acrylic painting was made in 2013 by Simon Hogan, Roy Underwood, Lennard Walker and Ian Rictor of the Spinifex People."],
      ["look", "On a purple background, circles in black and white mark features of the land, and five black snakes move across the canvas."],
      ["context", "It tells of a place called Pukara and two ancestral men, father and son, shown as water serpents. Their travels form a songline (or 'Dreaming') across a large part of the Western Desert."],
      ["context", "Room 24 places it among displays on how people relate to their ancestors.", "record"],
      ["provenance", "It was painted under the Spinifex Arts Project at Tjuntjuntjara and shown in the Museum's 2015 exhibition 'Indigenous Australia: enduring civilisation'."],
    ],
    tags: ["world", "religion", "animals", "craft"],
    room: "24", recordLocation: "On display (Room 24 - Living and Dying, Display Case 2, Relating to Ancestors)", placement: "Display Case 2",
    viewMinutes: 3, imagePath: null, assetId: null,
    imageNote: "No image on the record could be confirmed with a CC BY-NC-SA 4.0 licence page, so none is shown.", gallery: "living-and-dying",
  },
  {
    id: "E_Am1947-10-39", museumNumber: "Am1947,10.39", title: "Inca paccha (ritual vessel) in the form of a foot plough", shortTitle: "Inca paccha", objectType: "Vessel (paccha)",
    date: "1400–1532", culture: "Inca", materials: ["pottery"], findspot: "Peru",
    dimensions: "42.3 cm high", acquisition: "Donated by Evelyn Herbert Spottiswoode, 1947",
    summary: "A ceramic vessel shaped like a foot plough with a maize cob and a small jar. Maize beer poured in at one end ran out at the tip to 'water' the earth at planting time.",
    facts: [
      ["overview", "This Inca ritual vessel, called a paccha, is shaped like an Andean foot plough (chaquitaclla)."],
      ["look", "Find the maize cob modelled along the shaft and the miniature storage jar at the top, painted with geometric and fern patterns."],
      ["context", "Each year the Inca king and provincial lords opened the earth together with foot ploughs, with singing and drinking, to start the planting season."],
      ["detail", "The vessel is hollow: maize beer (chicha) poured in at the top flowed through it and out of a small hole at the tip, symbolically watering and fertilising the earth."],
      ["context", "Together, plough, maize cob and storage jar sum up the whole cycle of maize from planting to harvest."],
    ],
    tags: ["world", "religion", "power", "craft", "science"],
    room: "24", recordLocation: "On display (Room 24 - Living and Dying, Display Case 3, Living with sea and land)", placement: "Display Case 3",
    viewMinutes: 2, imagePath: "2014_10/6_11/8e0150fe_e1ee_403b_be2b_a3bc00b6b6b6/preview_00408252_001.jpg", assetId: "408252001", gallery: "living-and-dying",
  },
  {
    id: "E_Am1950-22-1", museumNumber: "Am1950,22.1", title: "Painted wooden kero cup", shortTitle: "Kero cup", objectType: "Beaker (kero)",
    date: "1700s", culture: "Colonial Andean, Peru", materials: ["wood"], findspot: "Southern Peru",
    dimensions: "21 cm high", acquisition: "Purchased 1950",
    summary: "A carved drinking cup from colonial Peru, painted with people in both Inca and European dress — a mixed world in a single scene.",
    facts: [
      ["overview", "Kero are wooden drinking cups with a long Andean tradition. This one was made in Peru in the colonial period."],
      ["look", "The top band shows costumed people wearing a mix of Inca and European clothing. The lower band has big cats and plants."],
      ["detail", "The scene is thought to include an African figure playing a drum."],
    ],
    tags: ["world", "craft", "animals", "collecting"],
    room: "24", recordLocation: "On display (Room 24 - Living and Dying, Display Case 3, Living with sea and land)", placement: "Display Case 3",
    viewMinutes: 2, imagePath: "2014_11/10_21/e82dc9b0_7112_4326_909e_a3df0164df4a/preview_01552413_001.jpg", assetId: "1552413001", gallery: "living-and-dying",
  },
  {
    id: "H_Eu2003-05-1", museumNumber: "Eu2003,05.1", title: "Cradle to Grave, by Pharmacopoeia", shortTitle: "Cradle to Grave", objectType: "Installation",
    date: "2001–2003", culture: "British", materials: ["knitted nylon", "medicines", "paper", "photographs"],
    dimensions: "13 m long (max)",
    summary: "Two 13-metre lengths of knitted fabric filled with prescribed medicines, charting the lifetime of prescribed medicines of a typical British man and woman.",
    facts: [
      ["overview", "This installation is by Pharmacopoeia, a collaboration between textile artist Susie Freeman, GP Dr Liz Lee and video artist David Critchley."],
      ["look", "Each length of knitted nylon holds the pills prescribed over a lifetime — one for a man, one for a woman — with photographs, notes and objects alongside."],
      ["context", "The stories are based on combined medical records of eight people at different times of life."],
      ["context", "It is the centrepiece of Room 24, which looks at how people around the world deal with illness and try to stay well.", "gallery"],
    ],
    tags: ["science", "craft", "women"],
    room: "24", recordLocation: "On display (Room 24 - Living and Dying, Display Case 5)", placement: "Display Case 5",
    viewMinutes: 3, imagePath: null, assetId: null,
    imageNote: "No image on the record could be confirmed with a CC BY-NC-SA 4.0 licence page, so none is shown.", gallery: "living-and-dying",
  },

  // ═════════════ Added 12 Oct 2026 (third batch, same rooms) ═════════════

  // ───────────── Room 4: Egyptian sculpture ─────────────
  {
    id: "Y_EA2", museumNumber: "EA2", title: "Prudhoe Lion of Amenhotep III", shortTitle: "Prudhoe Lion", objectType: "Statue",
    date: "About 1390–1352 BC", culture: "18th Dynasty (later Meroitic inscription)", materials: ["red granite"], findspot: "Jebel Barkal, Sudan (originally from Soleb)",
    dimensions: "115 cm high, 225 cm long", acquisition: "Donated by Algernon Percy, Lord Prudhoe (later 4th Duke of Northumberland), 1835",
    summary: "A huge granite lion lying at rest with its paws crossed, carved for Amenhotep III. Over the following centuries several rulers added their own inscriptions to it.",
    facts: [
      ["overview", "This red granite lion is one of a pair made for Amenhotep III. Each lion is the mirror image of the other."],
      ["look", "The lion lies on its side with its forepaws crossed and its tail curled round to rest on the base. Look at the veins on the muzzle and the ribs along the flank."],
      ["look", "The mane is a stylised circle, but the body is carved realistically. The hollow eyes were probably once inlaid."],
      ["detail", "Later rulers re-inscribed it several times. One added text calls the king 'lion of rulers'; its damaged royal name may be Akhenaten's. The record also notes a Meroitic text on the chest."],
      ["provenance", "The pair were first set up at Soleb in Nubia and later moved to Jebel Barkal, in modern Sudan. Lord Prudhoe gave them to the Museum in 1835."],
    ],
    tags: ["egypt", "animals", "power", "writing", "colossal", "collecting"], highlight: true,
    room: "4", recordLocation: "On display (Room 4 - Egyptian sculpture, Bay 28)", placement: "Bay 28",
    viewMinutes: 3, imagePath: "2014_10/13_6/333ae697_2932_4772_bc0b_a3c3006a7844/preview_00775539_001.jpg", assetId: "775539001", gallery: "egyptian-sculpture",
  },
  {
    id: "Y_EA43", museumNumber: "EA43", title: "Queen Mutemwia in a sacred boat", shortTitle: "Queen Mutemwia", objectType: "Statue",
    date: "About 1400 BC", culture: "18th Dynasty", materials: ["granodiorite"], findspot: "Sanctuary of the main temple, Karnak (Thebes)",
    dimensions: "216 cm long, 82 cm high (max)",
    summary: "Queen Mutemwia, mother of Amenhotep III, shown as the goddess Mut, seated in a sacred boat and sheltered by the wings of a vulture.",
    facts: [
      ["overview", "This statue shows Mutemwia, wife of Thutmose IV and mother of Amenhotep III, in the form of the goddess Mut."],
      ["look", "She sits enthroned on a sacred boat, protected by the outspread wings of a vulture. Her upper body is lost, but her hands rested on her thighs, the right one holding an ankh."],
      ["look", "The prow is decorated with heads of the goddess Hathor. Each side of the boat has a wedjat eye and the queen's name and titles."],
      ["detail", "Cartouches on the prow carry the names of her son, Amenhotep III."],
      ["context", "It comes from the sanctuary of the main temple at Karnak."],
    ],
    tags: ["egypt", "women", "religion", "power", "animals"],
    room: "4", recordLocation: "On display (Room 4 - Egyptian sculpture, Central Saloon West)", placement: "Central Saloon West",
    viewMinutes: 3, imagePath: "2014_10/6_9/89d0e476_0186_44c9_9192_a3bc0094769a/preview_00397333_001.jpg", assetId: "397333001", gallery: "egyptian-sculpture",
  },
  {
    id: "Y_EA58", museumNumber: "EA58", title: "Fragment of the beard of the Great Sphinx", shortTitle: "Sphinx's beard", objectType: "Sculpture (fragment)",
    date: "18th Dynasty", culture: "18th Dynasty", materials: ["limestone"], findspot: "Great Sphinx, Giza",
    dimensions: "78.7 cm high", acquisition: "Donated by Giovanni Battista Caviglia, 1818",
    summary: "A piece of the Great Sphinx's beard — added around a thousand years after the Sphinx was carved, when a king repaired it after a famous dream.",
    facts: [
      ["overview", "This limestone fragment comes from the plaited beard of the Great Sphinx at Giza."],
      ["context", "The Sphinx was made for the 4th-Dynasty king Khafra. A thousand years later it was worshipped as a god called Horemakhet, 'Horus in the horizon'."],
      ["detail", "According to the story, a Prince Thutmose fell asleep in the Sphinx's shadow and dreamed that it promised him the throne if he freed it from the sand. As Thutmose IV, he cleared and repaired it."],
      ["look", "The beard was probably his addition. Its curved tip marked the wearer as a god, whereas a king's beard would be straight."],
      ["provenance", "Pieces of the broken beard were found between the Sphinx's front paws in the 19th century. Others are in the Egyptian Museum in Cairo."],
    ],
    tags: ["egypt", "religion", "colossal", "power", "collecting"],
    room: "4", recordLocation: "On display (Room 4 - Egyptian sculpture, Bay 20)", placement: "Bay 20",
    viewMinutes: 2, imagePath: "2014_10/1_6/0ece83f0_78a4_4211_a4b8_a3b7006860af/preview_00031296_001.jpg", assetId: "31296001", gallery: "egyptian-sculpture",
  },
  {
    id: "Y_EA12", museumNumber: "EA12", title: "Monument of Thutmose III with Hathor and Montu-Ra", shortTitle: "Thutmose III with Hathor", objectType: "Monument",
    date: "18th Dynasty", culture: "18th Dynasty", materials: ["red granite"], findspot: "Karnak (Thebes)",
    dimensions: "178 cm high", acquisition: "Purchased from Henry Salt, 1823",
    summary: "Six figures holding hands back-to-back around a granite block: the king between the goddess Hathor and the falcon-headed god Montu-Ra.",
    facts: [
      ["overview", "This red granite monument of Thutmose III has six figures carved almost in the round around a central block, holding hands and facing outwards."],
      ["look", "At each end stands the goddess Hathor, with a long braided wig topped by a sun disc and horns, a bead collar and a tight dress."],
      ["look", "On the sides, the king in a short pleated kilt appears with the falcon-headed god Montu-Ra."],
      ["detail", "A column of hieroglyphs is cut above each figure's shoulder."],
    ],
    tags: ["egypt", "religion", "women", "power", "sculpture"],
    room: "4", recordLocation: "On display (Room 4 - Egyptian sculpture, Central Saloon East)", placement: "Central Saloon East",
    viewMinutes: 2, imagePath: "2014_10/6_11/b35f0f51_1aa1_4268_9c5f_a3bc00bd7ef2/preview_00410003_001.jpg", assetId: "410003001", gallery: "egyptian-sculpture",
  },
  {
    id: "Y_EA111", museumNumber: "EA111", title: "Kneeling statue of Wahibra holding a shrine", shortTitle: "Wahibra with shrine", objectType: "Statue",
    date: "About 530 BC", culture: "26th Dynasty", materials: ["basalt"], findspot: "Near Lake Mareotis, Egypt (recorded 1785)",
    dimensions: "180 cm high (max)", acquisition: "Donated by E. Fletcher, 1844",
    summary: "A larger-than-life official kneels to present a small shrine holding the god Osiris, with inscriptions asking for offerings for his afterlife.",
    facts: [
      ["overview", "This black basalt statue shows the official Wahibra kneeling and holding a small shrine with a figure of Osiris inside."],
      ["look", "He wears a short kilt that, in earlier times, only kings wore. His face is calm and expressionless, typical of Late Period art."],
      ["detail", "Hieroglyphs on the shrine, base and back pillar give his names and titles, his father's name, Peftjaudineith, and ask for offerings."],
      ["provenance", "Its old record says it was found near Lake Mareotis, about 49 miles from Rosetta, in 1785."],
    ],
    tags: ["egypt", "afterlife", "religion", "writing", "colossal"],
    room: "4", recordLocation: "On display (Room 4 - Egyptian sculpture, Bay 3)", placement: "Bay 3",
    viewMinutes: 2, imagePath: "2014_10/2_21/002ef120_46f6_4383_8997_a3b801687890/preview_00337157_001.jpg", assetId: "337157001", gallery: "egyptian-sculpture",
  },

  // ───────────── Room 1: Enlightenment ─────────────
  {
    id: "H_1966-1001-1", museumNumber: "1966,1001.1", title: "Dr Dee's magic mirror", shortTitle: "Dr Dee's mirror", objectType: "Magical mirror; case",
    date: "14th–16th century (?)", culture: "Aztec (obsidian)", materials: ["obsidian", "wood", "leather"], findspot: "Made in Mexico",
    dimensions: "18.4 cm diameter", acquisition: "Purchased 1966",
    summary: "A polished black obsidian mirror made in Mexico, known as Dr Dee's magic mirror after the Tudor scholar John Dee.",
    facts: [
      ["overview", "This polished obsidian mirror is recorded as the 'Magic Mirror of Doctor Dee', linking it to the 16th-century English scholar John Dee."],
      ["context", "The obsidian was made into a mirror in Mexico. Analysis in 2019 traced the stone to the Pachuca area of Hidalgo."],
      ["look", "Its leather-covered case carries a label in the handwriting of the writer Horace Walpole, quoting a poem by Samuel Butler."],
      ["context", "It is shown in the 'Religions' section of Room 1.", "record"],
    ],
    tags: ["world", "religion", "science", "collecting", "craft"], highlight: true,
    room: "1", recordLocation: "On display (Room 1 - Enlightenment, Religions, Floor Case 20)", placement: "Religions, Floor Case 20",
    viewMinutes: 3, imagePath: "2014_10/1_6/e818b6a6_cc8f_41b6_85db_a3b7006d5ce1/preview_00032721_001.jpg", assetId: "32721001", gallery: "enlightenment",
  },
  {
    id: "E_Am-MaudC-GN-291", museumNumber: "Am,MaudC,GN.291", title: "Cast of a Maya inscription from Copán, Altar G1", shortTitle: "Maya inscription cast", objectType: "Plaster cast",
    date: "1880s (cast); original AD 800", culture: "Maya (original)", materials: ["plaster"], findspot: "Original at Copán, Honduras",
    acquisition: "Transferred from the Victoria and Albert Museum",
    summary: "A Victorian plaster cast of Maya hieroglyphs from Copán, recording a precise calendar date equivalent to AD 800.",
    facts: [
      ["overview", "This is a plaster cast, made in London in the 1880s by Lorenzo Giuntini, of an inscription on Altar G1 at the Maya city of Copán."],
      ["look", "Look for the block-like glyphs. They give a 'Long Count' date of 9.18.10.0.0, which corresponds to AD 800."],
      ["context", "Altar G1 depicts a double-headed serpent; this cast copies the inscription on its north side."],
      ["context", "It is displayed in Room 1's 'Scripts' section.", "record"],
    ],
    tags: ["world", "writing", "science", "collecting"],
    room: "1", recordLocation: "On display (Room 1 - Enlightenment, Scripts, Floor Case 17)", placement: "Scripts, Floor Case 17",
    viewMinutes: 2, imagePath: null, assetId: null,
    imageNote: "No image on the record could be confirmed with a CC BY-NC-SA 4.0 licence page, so none is shown.", gallery: "enlightenment",
  },
  {
    id: "W_K-4988", museumNumber: "K.4988", title: "Bilingual tablet from the Library of Ashurbanipal", shortTitle: "Ashurbanipal library tablet", objectType: "Tablet",
    date: "Neo-Assyrian", culture: "Neo-Assyrian", materials: ["clay"], findspot: "Kuyunjik (Nineveh)",
    dimensions: "6.4 × 5.1 cm",
    summary: "A palm-sized clay fragment from King Ashurbanipal's great library at Nineveh, written in two languages.",
    facts: [
      ["overview", "This fragment of a clay tablet belongs to the Library of Ashurbanipal, found at Kuyunjik (Nineveh)."],
      ["look", "It is small enough to hold in one hand. The cuneiform text is bilingual: 12 and 17 lines of inscription survive."],
      ["context", "It is shown in the 'Scripts' section of Room 1, alongside other early writing systems.", "record"],
      ["context", "Nineveh is also where the palace reliefs in Rooms 9 and 10 come from."],
    ],
    tags: ["mesopotamia", "writing", "science"],
    room: "1", recordLocation: "On display (Room 1 - Enlightenment, Scripts, Floor Case 15i, middle)", placement: "Scripts, Floor Case 15i",
    viewMinutes: 2, imagePath: "2014_10/9_16/d4523208_d472_41a7_a3a7_a3bf010eb420/preview_00528111_001.jpg", assetId: "528111001", gallery: "enlightenment",
  },
  {
    id: "W_1889-0426-754", museumNumber: "79457", registrationNumber: "1889,0426.754", title: "Clay cylinder of Nebuchadnezzar II", shortTitle: "Nebuchadnezzar cylinder", objectType: "Cylinder",
    date: "604–562 BC", culture: "Neo-Babylonian", materials: ["fired clay"], findspot: "Sippar, Iraq",
    dimensions: "10 cm long", acquisition: "From Sir Ernest Wallis Budge",
    summary: "A small, complete clay cylinder in which King Nebuchadnezzar II records repairing a temple in the heart of Babylon.",
    facts: [
      ["overview", "This clay cylinder is inscribed with a text of Nebuchadnezzar II, king of Babylon from 604 to 562 BC."],
      ["detail", "The inscription records the repair of the temple E-mah in the centre of Babylon."],
      ["look", "It is complete, and the cuneiform runs all the way around the barrel-shaped cylinder."],
    ],
    tags: ["mesopotamia", "writing", "power", "religion"],
    room: "1", recordLocation: "On display (Room 1 - Enlightenment, Scripts, Wall Press 71, Shelf 5)", placement: "Scripts, Wall Press 71",
    viewMinutes: 2, imagePath: "2014_11/8_2/8f839f69_bc82_4f70_b9a9_a3dd002624cd/preview_01348667_001.jpg", assetId: "1348667001", gallery: "enlightenment",
  },
  {
    id: "E_Am1825-1210-15", museumNumber: "Am1825,1210.15", title: "Alabaster vase in the shape of a monkey", shortTitle: "Monkey vase", objectType: "Vase",
    date: "Before 1521", culture: "Mexico (pre-conquest)", materials: ["alabaster"], findspot: "Mexico",
    acquisition: "Purchased from Rev. Dr William Buckland, 1825",
    summary: "A small vessel carved from alabaster in the form of a monkey, made in Mexico before the Spanish conquest.",
    facts: [
      ["overview", "This alabaster vase takes the form of a monkey. It was made in Mexico before 1521."],
      ["look", "Look at how the animal's body forms the vessel itself."],
      ["provenance", "The Museum bought it in 1825 from the Rev. Dr William Buckland."],
      ["context", "Room 1 places it in its 'Trade & Discovery' section.", "record"],
    ],
    tags: ["world", "animals", "craft", "collecting"],
    room: "1", recordLocation: "On display (Room 1 - Enlightenment, Trade & Discovery, Floor Case 21)", placement: "Trade & Discovery, Floor Case 21",
    viewMinutes: 2, imagePath: "2014_11/7_17/1b84d28c_e6b7_4a2a_8e2e_a3dc011a5e78/preview_01304109_001.jpg", assetId: "1304109001", gallery: "enlightenment",
  },
  {
    id: "E_Af1818-1114-32", museumNumber: "Af1818,1114.32", title: "Asante pottery pipe bowl with a bird", shortTitle: "Asante pipe", objectType: "Smoking pipe",
    date: "1817", culture: "Asante", materials: ["pottery"], findspot: "Asante region, Ghana",
    dimensions: "12 cm long", acquisition: "Donated by Thomas Edward Bowdich, 1818",
    summary: "A small clay pipe bowl made by Asante craftspeople, with a bird turning its head back over its body, dated 1817.",
    facts: [
      ["overview", "This pottery pipe bowl was made by Asante craftspeople in what is now Ghana, and collected in 1817."],
      ["look", "The stem bends into an L-shape. A bird stands on it, its head bent back over its body, with lines incised on its wings."],
      ["provenance", "It was given to the Museum in 1818 by Thomas Edward Bowdich."],
      ["context", "It is shown in the 'Trade & Discovery' section of Room 1.", "record"],
    ],
    tags: ["world", "animals", "craft", "collecting"],
    room: "1", recordLocation: "On display (Room 1 - Enlightenment, Trade & Discovery, Floor Case 24)", placement: "Trade & Discovery, Floor Case 24",
    viewMinutes: 2, imagePath: "2014_10/2_18/e08fa692_d3ef_469f_9914_a3b8012b64eb/preview_00321057_001.jpg", assetId: "321057001", gallery: "enlightenment",
  },
  {
    id: "E_Am-2291", museumNumber: "Am.2291", title: "Carved female figure from the North Pacific Coast", shortTitle: "North Pacific Coast figure", objectType: "Figure",
    date: "About 1858", culture: "Kwakwaka'wakw (?)", materials: ["maple wood", "paint"], findspot: "North Pacific Coast",
    acquisition: "Transferred from the Royal Botanic Gardens, Kew",
    summary: "A painted wooden figure of a woman in a robe, one of a male–female pair collected by a naturalist on the North American Boundary Commission in 1858–9.",
    facts: [
      ["overview", "This standing woman wearing a robe is carved from white maple and painted. The maker is thought to have been Kwakwaka'wakw."],
      ["provenance", "It is one of a pair (with Am.2290, a male figure) collected by John Keast Lord on the North American Boundary Commission in 1858–9."],
      ["context", "Lord's notebook described them, in the language of his time, as two figures 'carved by the Lock-qui-lillas'."],
      ["provenance", "It came to the Museum from the Royal Botanic Gardens at Kew."],
    ],
    tags: ["world", "women", "sculpture", "collecting"],
    room: "1", recordLocation: "On display (Room 1 - Enlightenment, Trade & Discovery, Wall Press 93, Shelf 1)", placement: "Trade & Discovery, Wall Press 93",
    viewMinutes: 2, imagePath: "2014_10/8_17/4e32a466_077a_4b0d_b0af_a3be01193f0c/preview_00448353_001.jpg", assetId: "448353001", gallery: "enlightenment",
  },
  {
    id: "E_Oc1878-1101-614", museumNumber: "Oc1878,1101.614", title: "Hei tiki (nephrite pendant)", shortTitle: "Hei tiki", objectType: "Pendant (hei tiki)",
    date: "Late 18th–19th century", culture: "Māori", materials: ["nephrite (pounamu)", "fibre"], findspot: "New Zealand",
    dimensions: "7.3 cm long", acquisition: "Purchased from Lt-Gen. Augustus Meyrick, 1878",
    summary: "A small green-stone pendant in human form, polished smooth by generations of wear.",
    facts: [
      ["overview", "This hei tiki is a Māori neck pendant of nephrite (greenstone), carved in human form."],
      ["look", "The head tilts to one side and the hands rest on the hips. The surface is so worn and polished that the face and body details have softened."],
      ["detail", "Two old suspension holes broke and a third was drilled — a sign of long use."],
      ["context", "Specialists date it differently: one to the late 18th century, another to the 19th."],
    ],
    tags: ["world", "craft", "religion"],
    room: "1", recordLocation: "On display (Room 1 - Enlightenment, Trade & Discovery, Wall Press 96)", placement: "Trade & Discovery, Wall Press 96",
    viewMinutes: 2, imagePath: "2014_10/4_22/b5da846c_39bc_4bee_9ccb_a3ba016f9519/preview_00267940_001.jpg", assetId: "267940001", gallery: "enlightenment",
  },
  {
    id: "E_Oc-EP-22", museumNumber: "Oc,EP.22", title: "Moai tangata figure wearing a top hat", shortTitle: "Rapa Nui figure in top hat", objectType: "Figure",
    date: "Collected 1827–8", culture: "Rapa Nui (Easter Island)", materials: ["wood"], findspot: "Easter Island (Rapa Nui)",
    dimensions: "23 cm high", acquisition: "Donated by Hugh Cuming",
    summary: "A small wooden Rapa Nui figure of a man leaning forward — wearing a European-style top hat.",
    facts: [
      ["overview", "This carved wooden male figure, a moai tangata, comes from Rapa Nui (Easter Island)."],
      ["look", "He leans forward and wears a European-style top hat."],
      ["provenance", "It was collected in 1827–8 and given to the Museum by Hugh Cuming."],
      ["context", "Compare it with Hoa Hakananai'a in Room 24, a giant basalt ancestor figure also from Rapa Nui."],
    ],
    tags: ["world", "sculpture", "collecting"],
    room: "1", recordLocation: "On display (Room 1 - Enlightenment, Trade & Discovery, Wall Press 98)", placement: "Trade & Discovery, Wall Press 98",
    viewMinutes: 2, imagePath: "2014_10/3_16/9fe45669_848a_4100_866f_a3b9011655fa/preview_00209819_001.jpg", assetId: "209819001", gallery: "enlightenment",
  },

  // ───────────── Room 24: Living and Dying ─────────────
  {
    id: "A_As1994-05-49", museumNumber: "As1994,05.49", title: "Melanau belum (healing figure) of palm leaf", shortTitle: "Melanau healing figure", objectType: "Belum figure",
    date: "1971", culture: "Melanau, Sarawak (Malaysia)", materials: ["palm leaf"], findspot: "Oya district, Sarawak",
    dimensions: "106 cm high", acquisition: "Donated by Dr George Morris, 1994",
    summary: "A woven palm-leaf figure of an air spirit, hung with tiny fish and birds, made by Seman binti Adey for a Melanau healing ceremony.",
    facts: [
      ["overview", "This belum figure was woven from palm leaf by Seman binti Adey, a Melanau maker from Sarawak, in 1971."],
      ["look", "It has a pointed 'snout', arms held out to the sides, and small woven fish and birds hanging from its body, with four long tasselled streamers."],
      ["context", "It represents the air spirit Sayag Semalayang Pek Pangay."],
      ["context", "Room 24 shows it in a case called 'Your life in their hands'.", "record"],
    ],
    tags: ["world", "religion", "science", "craft", "women", "animals"],
    room: "24", recordLocation: "On display (Room 24 - Living and Dying, Display Case 7, Your life in their hands)", placement: "Display Case 7",
    viewMinutes: 2, imagePath: "2014_10/4_17/fdf04335_3e23_4a3d_8ac1_a3ba01257c12/preview_00246725_001.jpg", assetId: "246725001", gallery: "living-and-dying",
  },
  {
    id: "A_As1972-Q-2116", museumNumber: "As1972,Q.2116", title: "Sanni healing mask with 18 demons", shortTitle: "Sanni mask", objectType: "Dance mask",
    culture: "Sri Lanka", date: "Not recorded", materials: ["wood"], findspot: "Sri Lanka",
    summary: "A large carved mask of a demon overlord surrounded by 18 smaller demon faces, used in Sri Lankan healing ceremonies.",
    facts: [
      ["overview", "This large wooden sanni mask shows a demon overlord flanked by 18 demons."],
      ["context", "The record notes it was used in healing exorcism ceremonies."],
      ["look", "Count the smaller faces arranged around the central figure — each is a separate demon."],
      ["context", "It is displayed in the case 'Your life in their hands'.", "record"],
    ],
    tags: ["world", "religion", "science", "craft"],
    room: "24", recordLocation: "On display (Room 24 - Living and Dying, Display Case 7, Your life in their hands)", placement: "Display Case 7",
    viewMinutes: 2, imagePath: "2014_10/9_8/f6ed3914_f020_4afd_8067_a3bf008eedcb/preview_00492805_001.jpg", assetId: "492805001", gallery: "living-and-dying",
  },
  {
    id: "E_Am1909-1218-28", museumNumber: "Am1909,1218.28", title: "Moche vessel in the form of a woman carrying a load", shortTitle: "Moche woman with burden", objectType: "Vase",
    date: "Moche period", culture: "Moche", materials: ["pottery"], findspot: "Cemetery near Trujillo, Peru",
    dimensions: "17 cm high", acquisition: "Donated by Henry Van den Bergh through the Art Fund, 1909",
    summary: "A small pottery vessel from ancient Peru shaped like a woman carrying a heavy load on her back.",
    facts: [
      ["overview", "This Moche pottery vessel is modelled as a woman carrying a burden."],
      ["context", "It was found in a cemetery near Trujillo on the north coast of Peru."],
      ["context", "Room 24 shows it in the case 'Life's ordinary dangers'.", "record"],
    ],
    tags: ["world", "women", "craft", "afterlife"],
    room: "24", recordLocation: "On display (Room 24 - Living and Dying, Display Case 6, Life's ordinary dangers)", placement: "Display Case 6",
    viewMinutes: 2, imagePath: "2014_10/3_18/3eafeabb_2dff_4b3f_8817_a3b9012a9d5b/preview_00214689_001.jpg", assetId: "214689001", gallery: "living-and-dying",
  },
  {
    id: "E_Am1989-13-11", museumNumber: "Am1989,13.11", title: "Day of the Dead vulture by the Linares family", shortTitle: "Day of the Dead vulture", objectType: "Figure",
    date: "1980s", culture: "Mexico City", materials: ["papier mâché", "cane"], findspot: "Made in Mexico City",
    summary: "A papier-mâché vulture with outstretched wings, made by the Linares family workshop for Mexico's Day of the Dead festival.",
    facts: [
      ["overview", "This vulture figure was made in the 1980s by the workshop of the Linares family in Mexico City."],
      ["look", "Its wings stretch out over its back. The head is red, the beak gold, and the black wings have white markings."],
      ["material", "It is papier mâché over a cane framework."],
      ["context", "The record notes it was used in the Day of the Dead festival."],
    ],
    tags: ["world", "afterlife", "animals", "craft"],
    room: "24", recordLocation: "On display (Room 24 - Living and Dying)",
    viewMinutes: 2, imagePath: null, assetId: null,
    imageNote: "No image on the record could be confirmed with a CC BY-NC-SA 4.0 licence page, so none is shown.", gallery: "living-and-dying",
  },
  {
    id: "E_2011-2008-5-a-g", museumNumber: "2011,2008.5.a-g", title: "Camp dog by Lena Yarinkura", shortTitle: "Camp dog (Yarinkura)", objectType: "Figure",
    date: "About 2011", culture: "Rembarnga (Yirritja moiety), Australia", materials: ["vegetable fibre", "wood", "paint"], findspot: "Made at Maningrida, Northern Territory",
    dimensions: "101 cm long, 62 cm high", acquisition: "Purchased 2011",
    summary: "A 'camp dog' woven from fibre by the artist Lena Yarinkura, with carved wooden legs and ears.",
    facts: [
      ["overview", "This dog figure was made around 2011 by Lena Yarinkura, a Rembarnga artist working at Maningrida in northern Australia."],
      ["look", "The body is woven from vegetable fibre and painted. Look at the four wooden legs and two wooden ears attached separately."],
      ["context", "It is displayed in the case 'Relating to Ancestors', the same case as the Pukara painting.", "record"],
    ],
    tags: ["world", "animals", "women", "craft"],
    room: "24", recordLocation: "On display (Room 24 - Living and Dying, Display Case 2, Relating to Ancestors)", placement: "Display Case 2",
    viewMinutes: 2, imagePath: null, assetId: null,
    imageNote: "No image on the record could be confirmed with a CC BY-NC-SA 4.0 licence page, so none is shown.", gallery: "living-and-dying",
  },

  // ═════════════ Added 12 Oct 2026 (fourth batch, same rooms) ═════════════

  // ───────────── Room 1: Enlightenment ─────────────
  {
    id: "A_1872-0701-129", museumNumber: "1872,0701.129", title: "Seated four-armed Ganesha", shortTitle: "Ganesha", objectType: "Sculpture",
    date: "18th century", culture: "India", materials: ["alabaster", "gold", "cinnabar (vermilion)"], findspot: "Eastern India",
    dimensions: "34 cm high", acquisition: "Donated by Mrs John Bridge, Miss Fanny Bridge and Mrs Edgar Baker, 1872",
    summary: "A small alabaster figure of the elephant-headed Hindu god Ganesha, seated, with four arms and traces of red pigment and gold.",
    facts: [
      ["overview", "This alabaster sculpture shows Ganesha, the elephant-headed Hindu deity, seated with four arms."],
      ["look", "Look closely for traces of red vermilion and gilding that once decorated the figure."],
      ["context", "It is shown in the 'Religions' section of Room 1.", "record"],
    ],
    tags: ["religion", "world", "animals", "craft"],
    room: "1", recordLocation: "On display (Room 1 - Enlightenment, Religions, Wall Press 86, Shelf 2)", placement: "Religions, Wall Press 86",
    viewMinutes: 2, imagePath: "2014_10/15_22/b942f3e7_602e_4dba_a183_a3c5016b63f5/preview_00971080_001.jpg", assetId: "971080001", gallery: "enlightenment",
  },
  {
    id: "G_1867-0508-205", museumNumber: "1867,0508.205", title: "Bronze helmet of Corinthian type", shortTitle: "Corinthian helmet", objectType: "Helmet",
    date: "600–550 BC", culture: "Archaic Greek", materials: ["bronze"],
    dimensions: "21.6 cm high", acquisition: "Acquired 1867",
    summary: "An Archaic Greek bronze helmet of the type known as 'Corinthian', from the 6th century BC.",
    facts: [
      ["overview", "This bronze helmet of Corinthian type was made in Greece between about 600 and 550 BC."],
      ["context", "It is displayed in Room 1's 'Art & Civilization' section.", "record"],
    ],
    tags: ["greece-rome", "conflict", "craft"],
    room: "1", recordLocation: "On display (Room 1 - Enlightenment, Art & Civilization, Wall Press 36, Shelf 3)", placement: "Art & Civilization, Wall Press 36",
    viewMinutes: 2, imagePath: "2014_10/15_10/6f9d738f_b971_4799_a488_a3c500a74cef/preview_00926982_001.jpg", assetId: "926982001", gallery: "enlightenment",
  },
  {
    id: "G_1805-0703-348", museumNumber: "1805,0703.348", title: "Campana relief: Aphrodite riding a goose", shortTitle: "Aphrodite on a goose", objectType: "Relief",
    date: "50 BC – AD 100", culture: "Roman", materials: ["terracotta"], findspot: "Made in Italy",
    dimensions: "45.7 × 37.5 cm", acquisition: "Purchased from Peregrine Edward Towneley, 1805",
    summary: "A Roman terracotta plaque of the goddess Aphrodite riding on a goose, once part of Charles Townley's collection.",
    facts: [
      ["overview", "This terracotta 'Campana' relief shows the goddess Aphrodite seated on a goose."],
      ["detail", "It is heavily restored. A plaque with the mirror-image scene survives in Rome."],
      ["provenance", "Charles Townley bought it from Richard Hayward. It appears in a sketch of Townley's terracotta reliefs, which helps trace his collection."],
    ],
    tags: ["greece-rome", "women", "religion", "animals", "collecting"],
    room: "1", recordLocation: "On display (Room 1 - Enlightenment, Religions, Wall Press 88, Shelf 3)", placement: "Religions, Wall Press 88",
    viewMinutes: 2, imagePath: "2014_10/14_16/f5d0ed28_b936_43d7_a094_a3c401130744/preview_00877316_001.jpg", assetId: "877316001", gallery: "enlightenment",
  },
  {
    id: "W_1953-1010-36", museumNumber: "131688", registrationNumber: "1953,1010.36", title: "Relief fragment with Neo-Hittite hieroglyphs from Carchemish", shortTitle: "Carchemish hieroglyphs", objectType: "Relief (fragment)",
    date: "About 730 BC", culture: "Neo-Hittite", materials: ["basalt"], findspot: "Carchemish (on the modern Turkey–Syria border)",
    dimensions: "About 25 × 13 cm", acquisition: "Transferred from Brighton and Hove Museum",
    summary: "A small basalt fragment from Carchemish carved with part of an inscription in Neo-Hittite hieroglyphs.",
    facts: [
      ["overview", "This basalt fragment from Carchemish carries part of an inscription in Neo-Hittite hieroglyphs, from about 730 BC."],
      ["look", "The record suggests part of a lion may be carved on it as well."],
      ["context", "It sits in Room 1's 'Scripts' section, where you can compare it with Egyptian hieroglyphs and Mesopotamian cuneiform.", "record"],
    ],
    tags: ["writing", "mesopotamia", "animals"],
    room: "1", recordLocation: "On display (Room 1 - Enlightenment, Scripts, Wall Press 72, Shelf 7)", placement: "Scripts, Wall Press 72",
    viewMinutes: 2, imagePath: "2014_10/1_14/7acb0bb1_cbbd_4f46_bcd1_a3b700edb805/preview_00073577_001.jpg", assetId: "73577001", gallery: "enlightenment",
  },
  {
    id: "Y_EA8462", museumNumber: "EA8462", title: "Painted wooden stela of Padiamunnebnesuttawy", shortTitle: "Wooden stela (Padiamun…)", objectType: "Stela",
    date: "Ptolemaic period", culture: "Ptolemaic", materials: ["sycomore fig wood", "plaster", "gold"], findspot: "Tomb of Ankhhor, Thebes",
    dimensions: "85 cm high, 53 cm wide", acquisition: "Purchased from Henry Salt, 1823",
    summary: "A wooden funerary stela showing the sun god's boat cheered by baboons, and the dead man worshipping before an altar.",
    facts: [
      ["overview", "This round-topped stela of sycomore fig wood was made for a man named Padiamunnebnesuttawy."],
      ["look", "At the top, a winged sun disc is flanked by two cobras and two reclining jackals of Anubis."],
      ["look", "Below, the ram-headed sun god stands in his boat while baboons and a ba-bird raise their arms in praise."],
      ["look", "In the next band, Padiamunnebnesuttawy, dressed in a leopard skin, raises his arms in worship before an altar."],
      ["provenance", "A watercolour of it was painted soon after its discovery in 1818. Later finds of his family's burials confirm it came from the tomb of Ankhhor at Thebes."],
    ],
    tags: ["egypt", "afterlife", "religion", "writing", "animals"],
    room: "1", recordLocation: "On display (Room 1 - Enlightenment, Scripts, Wall Press 75, Shelf 1)", placement: "Scripts, Wall Press 75",
    viewMinutes: 2, imagePath: "2014_10/6_14/818e0a15_d83e_4a2a_89d1_a3bc00ee7f1f/preview_00424296_001.jpg", assetId: "424296001", gallery: "enlightenment",
  },
  {
    id: "G_1805-0703-56", museumNumber: "1805,0703.56", title: "Bust of Athena with a bronze helmet", shortTitle: "Townley Athena", objectType: "Bust",
    date: "Roman (head); helmet 18th century", culture: "Roman", materials: ["marble", "bronze"], findspot: "Rome (recorded as Villa Casali or Villa Palombara)",
    dimensions: "68.6 cm high", acquisition: "Purchased from Peregrine Edward Towneley, 1805",
    summary: "A Roman marble head of the goddess Athena, given a new bronze helmet and drapery by an 18th-century sculptor for collector Charles Townley.",
    facts: [
      ["overview", "This marble head of Athena is a Roman version of a Greek work of the 4th century BC."],
      ["look", "The bronze helmet and drapery were added in the 18th century by the sculptor Albacini, copying a bust of Athena in the Vatican."],
      ["detail", "The eyes were originally inlaid, perhaps with precious stones or glass paste."],
      ["provenance", "It was found in Rome in the early 1780s. Townley's notes and letters disagree on exactly where and when."],
    ],
    tags: ["greece-rome", "women", "religion", "sculpture", "collecting"],
    room: "1", recordLocation: "On display (Room 1 - Enlightenment, Near Wall Press 162)", placement: "Near Wall Press 162",
    viewMinutes: 2, imagePath: "2014_10/6_8/31114295_c6ac_46b2_a2d3_a3bc0090a376/preview_00396088_001.jpg", assetId: "396088001", gallery: "enlightenment",
  },

  // ───────────── Room 18: Parthenon ─────────────
  {
    id: "G_1816-0610-94", museumNumber: "1816,0610.94", title: "Two seated goddesses from the East pediment (Demeter and Persephone?)", shortTitle: "Demeter and Persephone?", objectType: "Pediment sculpture",
    date: "438–432 BC", culture: "Classical Greek", materials: ["marble"], findspot: "Parthenon, Athens",
    acquisition: "Purchased from the 7th Earl of Elgin, 1816",
    summary: "Two women seated side by side, one resting her arm affectionately on the other's shoulder — perhaps Demeter and her daughter Persephone.",
    facts: [
      ["overview", "These two seated female figures come from the East pediment of the Parthenon, which showed the birth of Athena."],
      ["look", "The left figure rests her arm on her companion's shoulder. Both wear sleeveless dresses with mantles over their legs."],
      ["look", "Walk round the back: the drapery is carved more simply there, where it would not have been seen."],
      ["context", "They are thought to be Demeter and Persephone, though some suggest two of the Horai (Seasons)."],
      ["detail", "Small holes show where a metal bracelet and shoulder brooches were once attached."],
    ],
    tags: ["greece-rome", "women", "religion", "sculpture"],
    room: "18", recordLocation: "On display (Room 18 - Greece: Parthenon)",
    viewMinutes: 2, imagePath: "2014_10/9_11/30ce053c_9c6a_4c25_8835_a3bf00bb5fbb/preview_00507191_001.jpg", assetId: "507191001", gallery: "greece-parthenon",
  },
  {
    id: "G_1816-0610-96", museumNumber: "1816,0610.96", title: "Iris, from the West pediment of the Parthenon", shortTitle: "Iris", objectType: "Pediment sculpture",
    date: "438–432 BC", culture: "Classical Greek", materials: ["marble"], findspot: "Parthenon, Athens",
    dimensions: "About 135 cm high", acquisition: "Purchased from the 7th Earl of Elgin, 1816",
    summary: "The winged messenger goddess Iris, her thin dress pressed against her body as if by the wind of her flight.",
    facts: [
      ["overview", "This female torso from the West pediment is identified as Iris, the winged messenger goddess."],
      ["look", "Her short dress clings to her body in places and flutters elsewhere, suggesting the rush of wind as she flies."],
      ["detail", "Her arms and wings, fixed into the shoulders at the back, are lost. It has been suggested that a head in the Louvre, the 'Laborde head', may belong to her."],
      ["context", "The West pediment showed Athena and Poseidon competing for the land of Attica."],
    ],
    tags: ["greece-rome", "women", "religion", "sculpture"],
    room: "18", recordLocation: "On display (Room 18 - Greece: Parthenon)",
    viewMinutes: 2, imagePath: null, assetId: null,
    imageNote: "No image on the record could be confirmed with a CC BY-NC-SA 4.0 licence page, so none is shown.", gallery: "greece-parthenon",
  },

  // ───────────── Room 24: Living and Dying ─────────────
  {
    id: "E_Oc-2430", museumNumber: "Oc,+.2430", title: "Pearl-shell breast ornament", shortTitle: "Pearl-shell ornament", objectType: "Breast ornament",
    date: "Before 1885", culture: "Torres Strait Islander", materials: ["mother-of-pearl", "wool"], findspot: "Torres Strait Islands (?)",
    dimensions: "14.2 cm wide", acquisition: "Donated by Sir Augustus Wollaston Franks, 1885",
    summary: "A crescent of shining pearl shell, incised with lines and tied with red wool, worn on the chest.",
    facts: [
      ["overview", "This crescent-shaped breast ornament is made of pearl shell, with incised lines and red wool tied at the top."],
      ["context", "The record attributes it to Torres Strait Islanders, although an old register slip says 'New Guinea'."],
      ["context", "It is displayed in Room 24's 'Relating to Ancestors' case.", "record"],
    ],
    tags: ["world", "craft", "religion"],
    room: "24", recordLocation: "On display (Room 24 - Living and Dying, Display Case 2, Relating to Ancestors)", placement: "Display Case 2",
    viewMinutes: 2, imagePath: "2014_10/16_12/d2a553dd_e6de_477f_b06b_a3c600d25e2e/preview_01008858_001.jpg", assetId: "1008858001", gallery: "living-and-dying",
  },
  {
    id: "E_2016-2016-1", museumNumber: "2016,2016.1", title: "'There's Another One', stencil print by Andrew Qappik", shortTitle: "'There's Another One'", objectType: "Print",
    date: "2012", culture: "Inuit", materials: ["paper"], findspot: "Made in Pangnirtung, Nunavut, Canada",
    acquisition: "Purchased from the artist",
    summary: "A stencil print by Inuit artist Andrew Qappik of a woman ice-fishing with her baby in her parka hood, her dog beside her.",
    facts: [
      ["overview", "This coloured stencil print was made in 2012 by Andrew Qappik in Pangnirtung."],
      ["look", "A woman sits ice-fishing with a child in her amauti (parka hood) and a dog beside her. She holds a jigging stick and a fish spear."],
      ["look", "Three fish lie on the ice, while below the surface two more swim towards the line."],
      ["context", "It is shown in Room 24's 'Life's ordinary dangers' case.", "record"],
    ],
    tags: ["world", "women", "animals", "craft"],
    room: "24", recordLocation: "On display (Room 24 - Living and Dying, Display Case 6, Life's ordinary dangers)", placement: "Display Case 6",
    viewMinutes: 2, imagePath: null, assetId: null,
    imageNote: "No image on the record could be confirmed with a CC BY-NC-SA 4.0 licence page, so none is shown.", gallery: "living-and-dying",
  },
  {
    id: "E_2009-2008-8", museumNumber: "2009,2008.8", title: "Tāhuhu (ridgepole) by George Tamihana Nuku", shortTitle: "Nuku ridgepole", objectType: "Ridgepole (architecture)",
    date: "2009", culture: "Māori (Ngāti Kahungunu)", materials: ["polystyrene", "paint"], findspot: "Made at the British Museum",
    acquisition: "Purchased from the artist",
    summary: "A Māori house ridgepole carved by artist George Nuku — not from wood, but from polystyrene, painted with red, black and white curving patterns.",
    facts: [
      ["overview", "This tāhuhu, the ridgepole of a house, was carved in 2009 by Māori artist George Tamihana Nuku."],
      ["material", "Instead of wood, it is carved from polystyrene and painted with curvilinear patterns in red, black and white."],
      ["provenance", "The record notes it was made at the British Museum itself."],
      ["context", "It is displayed in Room 24's 'Sustaining each other' case.", "record"],
    ],
    tags: ["world", "craft", "religion"],
    room: "24", recordLocation: "On display (Room 24 - Living and Dying, Display Case 1, Sustaining each other)", placement: "Display Case 1",
    viewMinutes: 2, imagePath: null, assetId: null,
    imageNote: "No image on the record could be confirmed with a CC BY-NC-SA 4.0 licence page, so none is shown.", gallery: "living-and-dying",
  },

  // ═════════════ Added 12 Oct 2026 (fifth batch, same rooms) ═════════════

  // ───────────── Room 6: Assyrian sculpture and Balawat Gates ─────────────
  {
    id: "W_1856-0909-58", museumNumber: "118807", registrationNumber: "1856,0909.58", title: "The White Obelisk", shortTitle: "White Obelisk", objectType: "Obelisk",
    date: "About 1049–1031 BC", culture: "Assyrian", materials: ["limestone"], findspot: "Kuyunjik (Nineveh), near the Ishtar temple",
    dimensions: "285 cm high",
    summary: "A weathered limestone obelisk with eight bands of scenes — war, hunting, tribute and ceremonies — probably made for King Ashurnasirpal I, over 200 years before the Black Obelisk.",
    facts: [
      ["overview", "The White Obelisk is a tall limestone monument carved with eight registers of low-relief scenes."],
      ["look", "Look for warfare, hunts, processions of people bringing tribute, and ceremonies. The surface is now very weathered."],
      ["detail", "Cuneiform inscriptions run down two sides. Saw marks near the base show that the bottom 35 cm was once set into a socket."],
      ["context", "Scholars long debated its date. It was once given to Ashurnasirpal II, but a detailed review in 1975 concluded it belongs to the earlier king Ashurnasirpal I."],
      ["context", "Compare it with the Black Obelisk of Shalmaneser III in the same room."],
    ],
    tags: ["mesopotamia", "power", "conflict", "writing", "colossal"],
    room: "6", recordLocation: "On display (Room 6a - Assyrian sculpture)", placement: "Room 6a",
    viewMinutes: 3, imagePath: "2014_10/5_2/1b181eeb_d32a_404c_b14b_a3bb002a8935/preview_00290494_001.jpg", assetId: "290494001", gallery: "assyrian-sculpture-and-balawat-gates",
  },
  {
    id: "W_1856-0909-42", museumNumber: "124943", registrationNumber: "1856,0909.42", title: "Door sill carved like a carpet", shortTitle: "Carpet door sill", objectType: "Door sill",
    date: "668–627 BC", culture: "Neo-Assyrian", materials: ["gypsum"], findspot: "North Palace of Ashurbanipal, Nineveh",
    dimensions: "89 × 78.7 cm",
    summary: "A stone threshold from Ashurbanipal's palace, carved to look like a patterned carpet laid in the doorway.",
    facts: [
      ["overview", "This gypsum door sill comes from the North Palace of King Ashurbanipal at Nineveh."],
      ["look", "It is carved to look like a carpet, as if a rug had been turned to stone."],
      ["context", "It is shown in Room 6b, alongside the bronze bands of the Balawat Gates.", "record"],
    ],
    tags: ["mesopotamia", "craft", "power"],
    room: "6", recordLocation: "On display (Room 6b - Balawat Gates)", placement: "Room 6b",
    viewMinutes: 2, imagePath: null, assetId: null,
    imageNote: "No image on the record could be confirmed with a CC BY-NC-SA 4.0 licence page, so none is shown.", gallery: "assyrian-sculpture-and-balawat-gates",
  },

  // ───────────── Room 7: Nimrud ─────────────
  {
    id: "W_1850-1228-8", museumNumber: "124564", registrationNumber: "1850,1228.8", title: "Relief: Ashurnasirpal II offered wine, with a protective spirit", shortTitle: "Court scene with wine", objectType: "Wall panel; relief",
    date: "865–860 BC", culture: "Neo-Assyrian", materials: ["gypsum"], findspot: "North-West Palace of Ashurnasirpal II, Nimrud (Room G)",
    dimensions: "269 cm high, 203 cm wide",
    summary: "A royal attendant offers the king a bowl of wine while a four-winged spirit stands behind. Look closely at the tiny scenes embroidered on their robes.",
    facts: [
      ["overview", "This panel is part of a court scene: a royal attendant offers a bowl of wine to King Ashurnasirpal II."],
      ["look", "Behind him stands a four-winged protective spirit in a horned cap, holding objects used in a ritual of fertilising the date palm."],
      ["look", "Look at the robes: incised patterns show palms flanked by horned animals, winged spirits and even the king holding up wild bulls by their hind legs."],
      ["detail", "Traces of the original red and black paint survive on the sandals."],
      ["detail", "A cuneiform inscription runs across the panel."],
    ],
    tags: ["mesopotamia", "power", "religion", "craft", "animals"],
    room: "7", recordLocation: "On display (Room 7 - Assyria: Nimrud)",
    viewMinutes: 3, imagePath: "2014_9/30_14/6a206f34_0859_4b9f_b9ec_a3b600f2d020/preview_00015476_001.jpg", assetId: "15476001", gallery: "assyria-nimrud",
  },

  // ───────────── Room 9: Nineveh ─────────────
  {
    id: "W_1856-0909-11", museumNumber: "118932", registrationNumber: "1856,0909.11", title: "Relief: lion-headed protective spirit (Ugallu)", shortTitle: "Ugallu spirit", objectType: "Wall panel; relief",
    date: "700–692 BC", culture: "Neo-Assyrian", materials: ["gypsum"], findspot: "South-West Palace of Sennacherib, Nineveh (doorway)",
    dimensions: "263 cm high, 286 cm wide",
    summary: "A giant doorway guardian with a lion's head — an Ugallu, or 'great lion' — following a figure who may be the house god.",
    facts: [
      ["overview", "This large panel shows a pair of protective spirits: an Ugallu ('great lion') and, in front, a figure who may be the house god."],
      ["context", "It guarded a doorway in Sennacherib's South-West Palace at Nineveh."],
      ["look", "Doorway figures like these were carved in higher relief than the historical scenes along the walls — compare it with the panels nearby."],
    ],
    tags: ["mesopotamia", "religion", "animals", "colossal"],
    room: "9", recordLocation: "On display (Room 9 - Assyria: Nineveh)",
    viewMinutes: 2, imagePath: "2014_10/1_6/dd130d92_a3a4_4ba0_a82e_a3b7006c2685/preview_00032415_001.jpg", assetId: "32415001", gallery: "assyria-nineveh",
  },

  // ───────────── Room 10: Lion hunts ─────────────
  {
    id: "W_1856-0909-8", museumNumber: "124947", registrationNumber: "1856,0909.8", title: "Relief: lyre-players led by a soldier", shortTitle: "Lyre-players relief", objectType: "Wall panel; relief",
    date: "700–692 BC", culture: "Neo-Assyrian", materials: ["gypsum"], findspot: "South-West Palace of Sennacherib, Nineveh (Room XLVII)",
    dimensions: "99 × 102 cm",
    summary: "Three musicians playing lyres walk through wooded hills behind an Assyrian soldier — possibly prisoners from Judah.",
    facts: [
      ["overview", "This panel shows an Assyrian soldier leading three lyre-players through wooded, mountainous country."],
      ["context", "The musicians may be Judaean prisoners."],
      ["context", "Layard described the room it came from as showing the king in his chariot receiving captives, with harpists playing before him."],
    ],
    tags: ["mesopotamia", "conflict", "craft", "power"],
    room: "10", recordLocation: "On display (Room 10a - Assyria: Lion Hunts, Section A)", placement: "Room 10a, Section A",
    viewMinutes: 2, imagePath: "2014_10/8_14/7a841125_8da5_4ec6_ad39_a3be00f53c08/preview_00437558_001.jpg", assetId: "437558001", gallery: "assyria-lion-hunts",
  },
  {
    id: "W_1856-0909-46", museumNumber: "124871,a", registrationNumber: "1856,0909.46", title: "Relief: deer caught in a net", shortTitle: "Netting deer", objectType: "Wall panel; relief",
    date: "645–635 BC", culture: "Neo-Assyrian", materials: ["gypsum"], findspot: "North Palace of Ashurbanipal, Nineveh (Room S)",
    dimensions: "About 76 × 66 cm",
    summary: "A herd of deer, chased between two hills, runs straight into a net — a quieter hunt than the famous lion scenes nearby.",
    facts: [
      ["overview", "This relief shows deer being hunted with nets in wooded, hilly country."],
      ["look", "The herd discovers a net stretched across its escape route. A trapper holds an exhausted deer by its antlers."],
      ["context", "It is the right-hand section of a scene; its partner is 1856,0909.46.b."],
    ],
    tags: ["mesopotamia", "animals", "conflict"],
    room: "10", recordLocation: "On display (Room 10a - Assyria: Lion Hunts, Section C)", placement: "Room 10a, Section C",
    viewMinutes: 2, imagePath: "2014_10/1_6/f96eccdf_45b0_47af_8f3c_a3b7006d1481/preview_00032489_001.jpg", assetId: "32489001", gallery: "assyria-lion-hunts",
  },

  // ───────────── Room 4: Egyptian sculpture ─────────────
  {
    id: "Y_EA21", museumNumber: "EA21", title: "Horemheb with the god Amun-Ra", shortTitle: "Horemheb with Amun", objectType: "Statue",
    date: "About 1350 BC", culture: "18th Dynasty", materials: ["granodiorite"], findspot: "Probably Thebes",
    dimensions: "148 cm high", acquisition: "Purchased from Henry Salt, 1823",
    summary: "King Horemheb stands small beneath the arm of the god Amun-Ra, shown in the wrapped form of the fertility god Min.",
    facts: [
      ["overview", "This granodiorite group shows King Horemheb standing beside the god Amun-Ra, carved almost in the round from one block."],
      ["look", "The god is wrapped like a mummy, in the form of the fertility god Min. The much smaller king stands under the god's right arm."],
      ["look", "Horemheb wears a short kilt with his name on the belt and holds a roll in his right hand. His left hand touches the god's side."],
      ["detail", "Inscriptions run between the two figures and across the top of the base."],
    ],
    tags: ["egypt", "religion", "power", "sculpture"],
    room: "4", recordLocation: "On display (Room 4 - Egyptian sculpture, Bay 13)", placement: "Bay 13",
    viewMinutes: 2, imagePath: "2014_10/4_14/be376840_e438_4206_b1cb_a3ba00ef4942/preview_00237211_001.jpg", assetId: "237211001", gallery: "egyptian-sculpture",
  },
  {
    id: "Y_EA64", museumNumber: "EA64", title: "Papyrus-bundle column", shortTitle: "Papyrus column", objectType: "Column",
    date: "Middle Kingdom (column); New Kingdom (texts)", culture: "Egyptian", materials: ["granodiorite"], findspot: "Found in Cairo",
    dimensions: "420 cm high", acquisition: "Purchased from Henry Salt, 1823",
    summary: "A 4.2-metre stone column shaped like a bundle of papyrus stems, re-used and re-inscribed by three different kings.",
    facts: [
      ["overview", "This tall granodiorite column is carved in the form of a bundle of papyrus stems, with closed buds at the top."],
      ["detail", "The column was made in the Middle Kingdom, but later kings added their names: cartouches of Amenhotep III, Merenptah and Setnakht appear on the top, buds and shaft."],
      ["look", "Look up to the capital to see the papyrus buds, and search the shaft for the different royal cartouches."],
      ["material", "It stands about 4.2 metres tall."],
    ],
    tags: ["egypt", "power", "writing", "colossal", "science"],
    room: "4", recordLocation: "On display (Room 4 - Egyptian sculpture, Bay 19)", placement: "Bay 19",
    viewMinutes: 2, imagePath: "2014_10/6_9/633a1697_1c8a_4ed4_a7da_a3bc00951299/preview_00397495_001.jpg", assetId: "397495001", gallery: "egyptian-sculpture",
  },
  {
    id: "Y_EA97", museumNumber: "EA97", title: "Green siltstone head of a king", shortTitle: "Siltstone royal head", objectType: "Statue (head)",
    date: "30th Dynasty", culture: "30th Dynasty", materials: ["greywacke (siltstone)"], findspot: "Egypt",
    dimensions: "39 cm high", acquisition: "Purchased from Peregrine Edward Towneley, 1814",
    summary: "A smooth, mask-like royal head in green stone, probably Nectanebo I or Nectanebo II.",
    facts: [
      ["overview", "This green siltstone head comes from a statue of a king, probably Nectanebo I or Nectanebo II (possibly Ahmose II)."],
      ["look", "He wears the nemes head-cloth with a cobra. The cobra's hood was a separate piece, probably of gold or another metal, and is now lost."],
      ["look", "The face is very well preserved and mask-like, apart from the nose, which was further damaged by at least one attempt to repair it."],
      ["provenance", "It belonged to Charles Townley, whose 1804 catalogue says it was brought from Egypt by the Duc de Chaulnes."],
    ],
    tags: ["egypt", "power", "sculpture", "collecting"],
    room: "4", recordLocation: "On display (Room 4 - Egyptian sculpture, Bay 3)", placement: "Bay 3",
    viewMinutes: 2, imagePath: "2014_11/2_22/be59a554_41e8_4a27_bb44_a3d701700de4/preview_01096940_001.jpg", assetId: "1096940001", gallery: "egyptian-sculpture",
  },

  // ───────────── Room 1: Enlightenment ─────────────
  {
    id: "Y_EA6754", museumNumber: "EA6754", title: "Cat mummy", shortTitle: "Cat mummy", objectType: "Animal mummy",
    date: "Roman period", culture: "Roman Egypt", materials: ["cat remains", "textile"], findspot: "Egypt",
    dimensions: "44 cm long", acquisition: "Purchased from Giovanni Anastasi",
    summary: "A young cat wrapped in a tall cylinder of patterned linen, with a modelled head and painted eyes.",
    facts: [
      ["overview", "This is the mummy of a young cat from Roman-period Egypt, wrapped in textile in a cylindrical shape."],
      ["look", "The outer wrappings form a diamond pattern of contrasting strips. The head is modelled in plain cloth, with eyes and cheeks outlined in black."],
      ["detail", "X-rays confirm the remains of a young cat inside. One neck bone may be displaced."],
      ["context", "Compare it with the Gayer-Anderson Cat in Room 4."],
    ],
    tags: ["egypt", "animals", "afterlife", "religion", "science"],
    room: "1", recordLocation: "On display (Room 1 - Enlightenment, Trade & Discovery, Wall Press 118, Shelf 2)", placement: "Trade & Discovery, Wall Press 118",
    viewMinutes: 2, imagePath: "2014_10/6_12/f085191d_fc6d_446e_a992_a3bc00cfd770/preview_00415278_001.jpg", assetId: "415278001", gallery: "enlightenment",
  },
  {
    id: "E_Af1818-1114-9", museumNumber: "Af1818,1114.9", title: "Asante wooden stool", shortTitle: "Asante stool", objectType: "Stool",
    date: "Before 1817", culture: "Asante", materials: ["wood"], findspot: "Asante region, Ghana",
    dimensions: "30 cm high, 47 cm wide", acquisition: "Donated by Thomas Edward Bowdich, 1818",
    summary: "A stool carved from a single block of soft white wood, with a curved seat and pierced, serrated supports.",
    facts: [
      ["overview", "This stool was carved by Asante craftspeople in what is now Ghana, before 1817."],
      ["look", "It has a curved seat on a central round pillar and four supports edged with pierced triangles."],
      ["detail", "Bowdich wrote in 1819 that such stools were carved from one piece of soft white wood soaked in water, and sold for about three shillings locally — but would fetch twenty on the coast."],
      ["context", "It is shown with the Asante pipe in Floor Case 24.", "record"],
    ],
    tags: ["world", "craft", "power", "collecting"],
    room: "1", recordLocation: "On display (Room 1 - Enlightenment, Trade & Discovery, Floor Case 24)", placement: "Trade & Discovery, Floor Case 24",
    viewMinutes: 2, imagePath: "2014_9/30_16/94a4d3b3_0266_48eb_8fb6_a3b6010e558e/preview_00022929_001.jpg", assetId: "22929001", gallery: "enlightenment",
  },
  {
    id: "E_Am-NWC-65", museumNumber: "Am,NWC.65", title: "Halibut hook carved as a bird", shortTitle: "Tlingit halibut hook", objectType: "Fish hook (figure)",
    date: "Before 1795", culture: "Probably Tlingit", materials: ["wood"], findspot: "Made in Alaska",
    acquisition: "Donated by Sir Joseph Banks",
    summary: "The wooden shank of a halibut hook, carved as a bird wearing a conical hat and a frog-shaped shaman's cape.",
    facts: [
      ["overview", "This is the wooden shank of a fishing hook for halibut, probably made by Tlingit people in Alaska before 1795."],
      ["look", "It is carved as a bird wearing a conical cap and a shaman's cape in the form of a frog."],
      ["provenance", "It was given to the Museum by Sir Joseph Banks."],
    ],
    tags: ["world", "animals", "craft", "religion", "science"],
    room: "1", recordLocation: "On display (Room 1 - Enlightenment, Trade & Discovery, Wall Press 94, Shelf 6)", placement: "Trade & Discovery, Wall Press 94",
    viewMinutes: 2, imagePath: null, assetId: null,
    imageNote: "No image on the record could be confirmed with a CC BY-NC-SA 4.0 licence page, so none is shown.", gallery: "enlightenment",
  },

  // ───────────── Checked but NOT on display (kept to show status checking; never planned) ─────────────
  {
    id: "G_1805-0703-15", museumNumber: "1805,0703.15", title: "The Townley Venus", shortTitle: "Townley Venus", objectType: "Statue",
    date: "1st–2nd century AD", culture: "Roman", materials: ["Proconnesian marble"], findspot: "Ostia",
    summary: "A Roman marble Venus. It is featured on the Room 23 gallery page, but its record says 'Not on display'.",
    facts: [["overview", "A Roman marble statue of Venus, adapted from a lost Greek original of the 4th century BC. Its arms were restored in the 18th century."]],
    tags: ["greece-rome", "sculpture", "women", "collecting"],
    room: null, recordLocation: "Not on display",
    displayNote: "Listed as a highlight on the Room 23 gallery page, but the Collection online record gave 'Not on display' on the verification date.",
    viewMinutes: 3, imagePath: "2014_9/30_8/9f9b7b07_9ef6_4060_b1f7_a3b6008535bb/preview_00180059_001.jpg", assetId: "180059001", gallery: "greek-and-roman-sculpture",
  },
  {
    id: "W_1847-0623-12", museumNumber: "124532", registrationNumber: "1847,0623.12", title: "Relief: Ashurnasirpal II hunting a bull", shortTitle: "Royal bull hunt", objectType: "Wall panel; relief",
    date: "875–860 BC", culture: "Neo-Assyrian", materials: ["gypsum"], findspot: "North-West Palace, Nimrud",
    summary: "A royal bull-hunt relief used as the header image of the Rooms 7–8 gallery page, but recorded as not on display.",
    facts: [["overview", "A gypsum relief of Ashurnasirpal II in his chariot, turning to grab a charging bull by the horn."]],
    tags: ["mesopotamia", "animals", "conflict", "power"],
    room: null, recordLocation: "Not on display",
    viewMinutes: 3, imagePath: "2014_10/1_6/b0c51a56_a2ba_4ca6_bb2e_a3b7006c8cbb/preview_00032397_001.jpg", assetId: "32397001", gallery: "assyria-nimrud",
  },
  {
    id: "P_1897-0505-333", museumNumber: "1897,0505.333", title: "Mary Delany, 'Fragaria Vesca' (wood strawberry), paper collage", shortTitle: "Mary Delany collage", objectType: "Collage",
    date: "1777", culture: "British", materials: ["paper", "bodycolour", "watercolour"],
    summary: "A botanical collage by Mary Delany, linked from the Room 1 gallery page but recorded as not on display.",
    facts: [["overview", "A collage of coloured papers with bodycolour and watercolour on a black ink background, showing a wood strawberry, from an album dated 1777."]],
    tags: ["science", "women", "craft"],
    room: null, recordLocation: "Not on display",
    viewMinutes: 3, imagePath: "2014_10/4_23/794bdadb_7934_41e7_ae14_a3ba017bf0b2/preview_00271546_001.jpg", assetId: "271546001", gallery: "enlightenment",
  },
  {
    id: "G_1848-1020-70-74", museumNumber: "1848,1020.70-74", title: "Columns from the Nereid Monument", shortTitle: "Nereid Monument columns", objectType: "Column",
    date: "About 390–380 BC", culture: "Classical Greek", materials: ["marble"], findspot: "Nereid Monument, Xanthos",
    summary: "Column parts from the Nereid Monument. Linked from the Room 17 page, but this record says 'Not on display'.",
    facts: [["overview", "Five marble columns and column parts from the Nereid Monument, including one complete column with capital and base."]],
    tags: ["greece-rome", "afterlife"],
    room: null, recordLocation: "Not on display",
    viewMinutes: 3, imagePath: "2014_10/8_22/4035bac0_65ef_4a7a_9313_a3be016f41a6/preview_00475335_001.jpg", assetId: "475335001", gallery: "nereid-monument",
  },
];

export const OBJECTS: MuseumObject[] = RAW.map(make);
export const OBJECTS_BY_ID: Record<string, MuseumObject> = Object.fromEntries(OBJECTS.map((o) => [o.id, o]));
export const ON_DISPLAY = OBJECTS.filter((o) => o.display.status === "on-display");
export const OBJECT_IDS = new Set(OBJECTS.map((o) => o.id));

export function getObject(id: string): MuseumObject | undefined {
  return OBJECTS_BY_ID[id];
}
