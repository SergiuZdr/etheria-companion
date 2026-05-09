import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const animuses = [
  { name: "Airon", element: "Reason", rarity: "SSR" },
  { name: "Andrew [Odd]", element: "Odd", rarity: "R" },
  { name: "Andrew [Reason]", element: "Reason", rarity: "R" },
  { name: "Asal", element: "Hollow", rarity: "SSR" },
  { name: "Asshu", element: "Hollow", rarity: "R" },
  { name: "Batsby", element: "Odd", rarity: "SSR" },
  { name: "Beyontin", element: "Reason", rarity: "SSR" },
  { name: "Borgne", element: "Odd", rarity: "SSR" },
  { name: "Bornova", element: "Hollow", rarity: "SSR" },
  { name: "Cachi", element: "Reason", rarity: "R" },
  { name: "Cachi [The Guard]", element: "Disorder", rarity: "SR" },
  { name: "Celince", element: "Hollow", rarity: "SSR" },
  { name: "Chiaki", element: "Reason", rarity: "SR" },
  { name: "Chiaki [The Echo]", element: "Hollow", rarity: "SR" },
  { name: "Dinah", element: "Reason", rarity: "SR" },
  { name: "Diting", element: "Disorder", rarity: "SR" },
  { name: "DokiDoki", element: "Constant", rarity: "SSR" },
  { name: "Dorothy", element: "Constant", rarity: "SR" },
  { name: "Dorothy [The Wisher]", element: "Reason", rarity: "SR" },
  { name: "Fangus", element: "Reason", rarity: "SR" },
  { name: "Fiamelia", element: "Constant", rarity: "SSR" },
  { name: "Freya", element: "Hollow", rarity: "SSR" },
  { name: "Fuqiu", element: "Hollow", rarity: "SSR" },
  { name: "Gianc", element: "Odd", rarity: "SSR" },
  { name: "Gray", element: "Hollow", rarity: "SR" },
  { name: "Heinrich", element: "Disorder", rarity: "SSR" },
  { name: "Helkid", element: "Reason", rarity: "SSR" },
  { name: "Hizuki Mari", element: "Disorder", rarity: "SR" },
  { name: "Holden", element: "Reason", rarity: "SSR" },
  { name: "Hoyan", element: "Hollow", rarity: "SSR" },
  { name: "Kazami Kazuyo", element: "Reason", rarity: "SR" },
  { name: "Kazuyo [The Reverie]", element: "Hollow", rarity: "SR" },
  { name: "Kethos", element: "Reason", rarity: "SSR" },
  { name: "Khloros", element: "Reason", rarity: "SSR" },
  { name: "Kloss", element: "Hollow", rarity: "SSR" },
  { name: "Kokardi", element: "Reason", rarity: "SSR" },
  { name: "Kraken", element: "Odd", rarity: "SR" },
  { name: "Lian", element: "Reason", rarity: "SSR" },
  { name: "Liliam", element: "Disorder", rarity: "SSR" },
  { name: "Lilith", element: "Hollow", rarity: "SSR" },
  { name: "Lily", element: "Disorder", rarity: "SSR" },
  { name: "Lingluo", element: "Odd", rarity: "SSR" },
  { name: "Lowan", element: "Disorder", rarity: "SSR" },
  { name: "Luvia", element: "Odd", rarity: "SSR" },
  { name: "Marvell", element: "Constant", rarity: "SR" },
  { name: "Massiah", element: "Constant", rarity: "SSR" },
  { name: "Mia", element: "Reason", rarity: "SSR" },
  { name: "Mio", element: "Constant", rarity: "SSR" },
  { name: "Mizuki Makoto", element: "Hollow", rarity: "SR" },
  { name: "Mizusumi Aya", element: "Hollow", rarity: "SSR" },
  { name: "Nahor", element: "Odd", rarity: "SSR" },
  { name: "Nell", element: "Disorder", rarity: "SR" },
  { name: "Nevette", element: "Hollow", rarity: "SSR" },
  { name: "Ninfoniel", element: "Odd", rarity: "SSR" },
  { name: "No. 41", element: "Constant", rarity: "R" },
  { name: "Obol", element: "Odd", rarity: "SR" },
  { name: "Oboro", element: "Odd", rarity: "SR" },
  { name: "Palin", element: "Odd", rarity: "SSR" },
  { name: "Plume", element: "Disorder", rarity: "SSR" },
  { name: "Qano", element: "Odd", rarity: "SSR" },
  { name: "RC-77", element: "Odd", rarity: "SR" },
  { name: "Rahu", element: "Hollow", rarity: "SSR" },
  { name: "Raymerry", element: "Constant", rarity: "SSR" },
  { name: "Rilmocha", element: "Hollow", rarity: "SSR" },
  { name: "Rin", element: "Reason", rarity: "SR" },
  { name: "Rin [The Unbowed]", element: "Odd", rarity: "SR" },
  { name: "Rosa", element: "Odd", rarity: "SSR" },
  { name: "Sania", element: "Hollow", rarity: "SR" },
  { name: "Sania [Vengeful Thorn]", element: "Disorder", rarity: "SSR" },
  { name: "Santik", element: "Reason", rarity: "SSR" },
  { name: "Senyu", element: "Reason", rarity: "SSR" },
  { name: "Steelheart Dinah", element: "Constant", rarity: "SR" },
  { name: "Sybil", element: "Odd", rarity: "R" },
  { name: "Sylph", element: "Odd", rarity: "SR" },
  { name: "The Lumiwarden Diting", element: "Reason", rarity: "SSR" },
  { name: "Tiamat", element: "Odd", rarity: "SSR" },
  { name: "Tsukiyo Mi", element: "Odd", rarity: "SSR" },
  { name: "Tsutomu", element: "Hollow", rarity: "SR" },
  { name: "Turandot", element: "Reason", rarity: "SR" },
  { name: "Valerian", element: "Constant", rarity: "SR" },
  { name: "Veronika", element: "Reason", rarity: "SSR" },
  { name: "Vice", element: "Constant", rarity: "R" },
  { name: "Victor", element: "Disorder", rarity: "SR" },
  { name: "Viper", element: "Odd", rarity: "SR" },
  { name: "Xiada", element: "Odd", rarity: "SSR" },
  { name: "Xuan Chi", element: "Constant", rarity: "SSR" },
  { name: "Xuan Li", element: "Disorder", rarity: "SSR" },
  { name: "Yang", element: "Odd", rarity: "SR" },
  { name: "Yeli", element: "Constant", rarity: "SSR" },
];

async function main() {
  console.log("Seeding animuses...");

  // Delete old incorrect data
  await prisma.userAnimus.deleteMany();
  await prisma.userBuild.deleteMany();
  await prisma.draftPickStat.deleteMany();
  await prisma.animus.deleteMany();

  for (const animus of animuses) {
    await prisma.animus.create({ data: animus });
  }

  console.log(`✓ Seeded ${animuses.length} animuses`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
