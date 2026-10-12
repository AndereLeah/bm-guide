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
