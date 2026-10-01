// Gallery photos.
//
// Any image in src/assets/gallery/ (JPEG, PNG or WebP, ideally ~2000px on
// the long side and under ~400 KB) is shown automatically, sorted by file
// name: prefix names with 01-, 02-… to choose the order. Descriptive,
// hyphenated names help image search ("03-chateau-de-voltaire-charmilles.jpg").
//
// Give each photo a title and a legend in every language below. The title
// is the alt text, and both appear under the photo and in the full-screen
// view. Photos without an entry get a title made from the file name
// ("03-les-charmilles.jpg" → "Les charmilles") until one is written.
//
// While there are fewer than six photos, placeholder frames fill the grid.

import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const details = {
  "02-chateau-de-voltaire-chambre-toilette.webp": {
    title: {
      fr: "La table de toilette d’une chambre du château",
      en: "The dressing table of a bedroom in the château",
      de: "Der Toilettentisch eines Schlafzimmers im Schloss",
      ru: "Туалетный столик в спальне замка",
    },
    legend: {
      fr: "Soieries jaunes à motifs pourpres, cheminée de marbre surmontée d’un trumeau, fauteuils assortis et tapis fleuri : la toilette, avec son miroir et ses pots de porcelaine, évoque les rituels du matin au XVIIIe siècle.",
      en: "Yellow silks patterned in crimson, a marble fireplace beneath a tall mirror, matching armchairs and a floral carpet: the dressing table, with its mirror and porcelain pots, recalls the morning rituals of the 18th century.",
      de: "Gelbe Seide mit purpurroten Mustern, ein Marmorkamin unter einem hohen Spiegel, passende Sessel und ein geblümter Teppich: Der Toilettentisch mit Spiegel und Porzellandosen erinnert an die Morgenrituale des 18. Jahrhunderts.",
      ru: "Жёлтые шелка с пурпурным узором, мраморный камин под высоким зеркалом, кресла в тон и цветочный ковёр: туалетный столик с зеркалом и фарфоровыми баночками напоминает об утренних ритуалах XVIII века.",
    },
  },
  "01-chateau-de-voltaire-salon.jpg": {
    title: {
      fr: "Le salon du Château de Voltaire",
      en: "The salon of the Château de Voltaire",
      de: "Der Salon im Schloss Voltaire",
      ru: "Салон в замке Вольтера",
    },
    legend: {
      fr: "Tentures rayées rouge et vert, portrait de Voltaire jeune dans son cadre ovale, cheminée de marbre et tables de jeu dressées : c’est dans ce décor que l’on recevait les visiteurs du château.",
      en: "Red-and-green striped hangings, a portrait of the young Voltaire in its oval frame, a marble fireplace and game tables laid out: the setting in which the château’s visitors were received.",
      de: "Rot-grün gestreifte Wandbespannungen, ein Porträt des jungen Voltaire im ovalen Rahmen, ein Marmorkamin und gedeckte Spieltische: In diesem Rahmen empfing man die Gäste des Schlosses.",
      ru: "Красно-зелёные полосатые обивки стен, портрет молодого Вольтера в овальной раме, мраморный камин и накрытые игровые столики — в этой обстановке принимали гостей замка.",
    },
  },
  "03-chateau-de-voltaire-salon-tables-de-jeu.jpg": {
    title: {
      fr: "Les tables de jeu du salon et le portrait de Frédéric II",
      en: "The salon’s game tables and the portrait of Frederick II",
      de: "Die Spieltische des Salons und das Bildnis Friedrichs II.",
      ru: "Игровые столики салона и портрет Фридриха II",
    },
    legend: {
      fr: "Cartes, éventail et tasses sur la table de jeu, damier marqueté, canapé de velours cramoisi et pendule de bronze doré sur la cheminée de marbre. Au mur, Frédéric II de Prusse, ami et correspondant de Voltaire.",
      en: "Cards, a fan and cups on the game table, an inlaid chessboard, a crimson velvet sofa and a gilt-bronze clock on the marble fireplace. On the wall, Frederick II of Prussia, Voltaire’s friend and correspondent.",
      de: "Karten, Fächer und Tassen auf dem Spieltisch, ein eingelegtes Schachbrett, ein karmesinrotes Samtsofa und eine vergoldete Bronzeuhr auf dem Marmorkamin. An der Wand Friedrich II. von Preußen, Voltaires Freund und Briefpartner.",
      ru: "Карты, веер и чашки на игровом столе, инкрустированная шахматная доска, малиновый бархатный диван и часы из золочёной бронзы на мраморном камине. На стене — Фридрих II Прусский, друг и корреспондент Вольтера.",
    },
  },
  "04-chateau-de-voltaire-eglise-deo-erexit-voltaire.jpg": {
    title: {
      fr: "L’église « Deo erexit Voltaire » dans le parc",
      en: "The “Deo erexit Voltaire” church in the park",
      de: "Die Kirche „Deo erexit Voltaire“ im Park",
      ru: "Церковь «Deo erexit Voltaire» в парке",
    },
    legend: {
      fr: "Au bout des allées de gravier et des haies taillées, la petite église que Voltaire fit rebâtir en 1761 : son fronton porte la célèbre dédicace « Deo erexit Voltaire », « Voltaire l’a élevée à Dieu ».",
      en: "Beyond the gravel paths and clipped hedges stands the little church Voltaire had rebuilt in 1761. Its pediment bears the famous dedication “Deo erexit Voltaire”, “Voltaire raised it to God”.",
      de: "Hinter Kieswegen und geschnittenen Hecken steht die kleine Kirche, die Voltaire 1761 neu errichten ließ. Ihr Giebel trägt die berühmte Widmung „Deo erexit Voltaire“ – „Voltaire hat sie Gott errichtet“.",
      ru: "За гравийными дорожками и стрижеными живыми изгородями — небольшая церковь, перестроенная Вольтером в 1761 году. На её фронтоне знаменитое посвящение «Deo erexit Voltaire» — «Богу воздвиг Вольтер».",
    },
  },
  "05-chateau-de-voltaire-chambre-alcove.jpg": {
    title: {
      fr: "Une chambre à alcôve du château",
      en: "An alcove bedroom in the château",
      de: "Ein Alkovenzimmer im Schloss",
      ru: "Спальня с альковом в замке",
    },
    legend: {
      fr: "Lit en alcôve tendu de soie jaune à grands motifs, rideaux assortis, faïence peinte et table de toilette : l’intimité d’une chambre du XVIIIe siècle.",
      en: "An alcove bed hung with richly patterned yellow silk, matching curtains, painted faience and a dressing table: the intimacy of an 18th-century bedroom.",
      de: "Ein Alkovenbett mit gelber, reich gemusterter Seide, passende Vorhänge, bemalte Fayence und ein Toilettentisch: die Intimität eines Schlafzimmers des 18. Jahrhunderts.",
      ru: "Кровать в алькове, обтянутая жёлтым узорчатым шёлком, такие же занавеси, расписной фаянс и туалетный столик — уют спальни XVIII века.",
    },
  },
};

const dir = join(dirname(fileURLToPath(import.meta.url)), "assets", "gallery");

const fromFileName = (file) => {
  const words = file.replace(/\.[^.]+$/, "").replace(/^\d+[-_ ]*/, "").replace(/[-_]+/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

// Pixel size from the file header (JPEG, PNG, WebP), so pages can reserve
// the space before the image loads and structured data can state it.
function imageSize(file) {
  const b = readFileSync(join(dir, file));
  if (b[0] === 0x89 && b.toString("ascii", 1, 4) === "PNG") return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
  if (b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") {
    const kind = b.toString("ascii", 12, 16);
    if (kind === "VP8X") return { width: 1 + b.readUIntLE(24, 3), height: 1 + b.readUIntLE(27, 3) };
    if (kind === "VP8 ") return { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
    if (kind === "VP8L") { const n = b.readUInt32LE(21); return { width: 1 + (n & 0x3fff), height: 1 + ((n >> 14) & 0x3fff) }; }
  }
  if (b[0] === 0xff && b[1] === 0xd8) {
    for (let i = 2; i < b.length - 9; ) {
      if (b[i] !== 0xff) { i++; continue; }
      const marker = b[i + 1];
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { width: b.readUInt16BE(i + 7), height: b.readUInt16BE(i + 5) };
      }
      i += 2 + b.readUInt16BE(i + 2);
    }
  }
  return {};
}

export const photos = readdirSync(dir)
  .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  .map((file) => ({
    file,
    ...imageSize(file),
    title: details[file]?.title || { fr: fromFileName(file) },
    legend: details[file]?.legend || {},
  }));
