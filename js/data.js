// `translations` is optional: { ru|uk|pl: { name, description } }. Missing languages
// fall back to the English `name`/`description`.
const products = [
  {
    id: 1,
    name: "Gothic Cross Statement Necklace",
    price: "20 EUR",
    image: "media/web/1000030969-01.jpg",
    images: ["media/web/1000030969-01.jpg"],
    description:
      "A dramatic swagged choker with looping chains, faceted red and clear beads, delicate spikes, and an ornate cross pendant at the center.",
    category: "Necklace",
    soldOut: false,
    translations: {
      ru: {
        name: "Готическое колье с крестом",
        description:
          "Эффектный чокер с драпированными цепочками, гранёными красными и прозрачными бусинами, тонкими шипами и узорным крестом в центре.",
      },
      uk: {
        name: "Готичне кольє з хрестом",
        description:
          "Ефектний чокер із драпірованими ланцюжками, гранованими червоними й прозорими намистинами, тонкими шипами та візерунчастим хрестом у центрі.",
      },
      pl: {
        name: "Gotycki naszyjnik z krzyżem",
        description:
          "Efektowny choker z opadającymi łańcuszkami, fasetowanymi czerwonymi i przezroczystymi koralikami, delikatnymi kolcami i ozdobnym krzyżem pośrodku.",
      },
    },
  },
  {
    id: 2,
    name: "Spike Drop Necklace",
    price: "17 EUR",
    image: "media/web/IMG_20260908_151912-01.jpg",
    images: ["media/web/IMG_20260908_151912-01.jpg"],
    description:
      "A fine chain necklace gathered into a small chainmail cluster at the front, with three slender spikes hanging below.",
    category: "Necklace",
    soldOut: false,
    translations: {
      ru: {
        name: "Колье с подвесками-шипами",
        description:
          "Тонкая цепочка, собранная спереди в небольшой узор из кольчужного плетения, с тремя тонкими шипами внизу.",
      },
      uk: {
        name: "Кольє з підвісками-шипами",
        description:
          "Тонкий ланцюжок, зібраний спереду в невеликий візерунок кольчужного плетіння, з трьома тонкими шипами внизу.",
      },
      pl: {
        name: "Naszyjnik z kolcami",
        description:
          "Delikatny łańcuszek zebrany z przodu w niewielki splot kolczugowy, z trzema smukłymi kolcami zwisającymi poniżej.",
      },
    },
  },
  {
    id: 3,
    name: "Chunky Ring-Chain Necklace",
    price: "14 EUR",
    image: "media/web/IMG_20260908_124236-01.jpg",
    images: ["media/web/IMG_20260908_124236-01.jpg"],
    description:
      "A bold necklace made of large linked rings, giving a substantial, statement-making chain look.",
    category: "Necklace",
    soldOut: false,
    translations: {
      ru: {
        name: "Массивное колье из колец",
        description:
          "Смелое колье из крупных соединённых колец — объёмная цепь, которая сразу привлекает внимание.",
      },
      uk: {
        name: "Масивне кольє з кілець",
        description:
          "Сміливе кольє з великих з'єднаних кілець — об'ємний ланцюг, що одразу привертає увагу.",
      },
      pl: {
        name: "Masywny naszyjnik z ogniw",
        description:
          "Wyrazisty naszyjnik z dużych połączonych ogniw — masywny łańcuch, który od razu przyciąga uwagę.",
      },
    },
  },
  {
    id: 4,
    name: "Ring-Chain Choker",
    price: "12 EUR",
    image: "media/web/IMG_20260908_123427-01.jpg",
    images: ["media/web/IMG_20260908_123427-01.jpg"],
    description:
      "A shorter, close-fitting version of our ring-chain design — linked rings for a clean, minimal gothic look.",
    category: "Choker",
    soldOut: false,
    translations: {
      ru: {
        name: "Чокер из колец",
        description:
          "Короткая, плотно прилегающая версия нашего дизайна из колец — соединённые кольца для лаконичного готического образа.",
      },
      uk: {
        name: "Чокер із кілець",
        description:
          "Коротка, щільно прилегла версія нашого дизайну з кілець — з'єднані кільця для лаконічного готичного образу.",
      },
      pl: {
        name: "Choker z ogniw",
        description:
          "Krótsza, dopasowana wersja naszego wzoru z ogniw — połączone kółka w czystym, minimalistycznym gotyckim stylu.",
      },
    },
  },
  {
    id: 5,
    name: "Chainmail Heart Charm",
    price: "10 EUR",
    image: "media/web/IMG_20260908_120916-01.jpg",
    images: ["media/web/IMG_20260908_120916-01.jpg"],
    description:
      "A small woven chainmail heart charm on a lobster clasp, perfect as a pendant or keychain accent.",
    category: "Charm",
    soldOut: false,
    translations: {
      ru: {
        name: "Подвеска-сердце из кольчуги",
        description:
          "Небольшое сердце в технике кольчужного плетения на карабине — подойдёт как кулон или украшение для брелока.",
      },
      uk: {
        name: "Підвіска-серце з кольчуги",
        description:
          "Невелике серце в техніці кольчужного плетіння на карабіні — підійде як кулон або прикраса для брелока.",
      },
      pl: {
        name: "Zawieszka-serce z kolczugi",
        description:
          "Małe serce splecione techniką kolczugi na karabińczyku — idealne jako wisiorek lub ozdoba breloka.",
      },
    },
  },
];

if (typeof module !== "undefined") {
  module.exports = { products };
}
