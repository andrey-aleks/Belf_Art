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
  },
];

if (typeof module !== "undefined") {
  module.exports = { products };
}
