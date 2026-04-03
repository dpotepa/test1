import { Pool } from 'pg';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/questions_app';

const categories = [
  { name: 'Wartości i Przekonania', slug: 'wartosci-i-przekonania' },
  { name: 'Relacje i Więzi', slug: 'relacje-i-wiezi' },
  { name: 'Doświadczenia Życiowe', slug: 'doswiadczenia-zyciowe' },
  { name: 'Scenariusze i Wyobraźnia', slug: 'scenariusze-i-wyobraznia' },
  { name: 'Autorefleksja', slug: 'autorefleksja' },
  { name: 'Przyszłość', slug: 'przyszlosc' },
];

// [slug, text, depth_level]
const questions: [string, string, number][] = [
  // === Wartości i Przekonania ===
  ['wartosci-i-przekonania', 'Jakie przekonanie zmieniłeś/aś w ciągu ostatnich kilku lat?', 2],
  ['wartosci-i-przekonania', 'Gdybyś mógł/mogła zaszczepić jedną wartość w każdym człowieku na ziemi, co by to było?', 2],
  ['wartosci-i-przekonania', 'Co jest dla ciebie ważniejsze — być lubianym czy szanowanym?', 1],
  ['wartosci-i-przekonania', 'W co wierzysz, mimo że nie potrafisz tego udowodnić?', 3],
  ['wartosci-i-przekonania', 'Jaka jest najbardziej niedoceniana cnota?', 2],
  ['wartosci-i-przekonania', 'Czy uważasz, że ludzie są z natury dobrzy? Dlaczego?', 3],
  ['wartosci-i-przekonania', 'Jaka zasada moralna jest dla ciebie niepodważalna?', 2],
  ['wartosci-i-przekonania', 'Co oznacza dla ciebie wolność?', 2],
  ['wartosci-i-przekonania', 'Czy cel może uświęcać środki? Podaj przykład.', 3],
  ['wartosci-i-przekonania', 'Jaki temat potrafi cię naprawdę rozpalić w dyskusji?', 1],
  ['wartosci-i-przekonania', 'Co byś zrobił/a gdybyś wiedział/a, że nikt się nie dowie?', 3],
  ['wartosci-i-przekonania', 'Która wartość wyniesiona z domu jest ci najbliższa?', 2],
  ['wartosci-i-przekonania', 'Co jest ważniejsze — sprawiedliwość czy miłosierdzie?', 3],
  ['wartosci-i-przekonania', 'Czy pieniądze zmieniają ludzi? Jak?', 1],
  ['wartosci-i-przekonania', 'Jakiej opinii nigdy nie powiedziałeś/aś głośno?', 3],
  ['wartosci-i-przekonania', 'Co dla ciebie znaczy „dobre życie"?', 2],
  ['wartosci-i-przekonania', 'Czy kłamstwo może być etyczne? Kiedy?', 2],

  // === Relacje i Więzi ===
  ['relacje-i-wiezi', 'Co oznacza dla ciebie lojalność i gdzie są jej granice?', 2],
  ['relacje-i-wiezi', 'Opisz moment, gdy ktoś okazał ci życzliwość, o której wciąż pamiętasz.', 2],
  ['relacje-i-wiezi', 'Co jest najtrudniejsze w naprawdę głębokim poznaniu drugiej osoby?', 3],
  ['relacje-i-wiezi', 'Jaka cecha w ludziach przyciąga cię najbardziej?', 1],
  ['relacje-i-wiezi', 'Czego nauczyło cię twoje najważniejsze przyjaźń?', 2],
  ['relacje-i-wiezi', 'Jak reagujesz, gdy ktoś cię zawiedzie?', 2],
  ['relacje-i-wiezi', 'Co byś chciał/a usłyszeć od bliskiej osoby, ale nigdy tego nie słyszysz?', 3],
  ['relacje-i-wiezi', 'Jak wygląda dla ciebie idealne wsparcie w trudnym momencie?', 2],
  ['relacje-i-wiezi', 'Czy potrafisz wybaczyć zdradę zaufania?', 3],
  ['relacje-i-wiezi', 'Jaka jest twoja „love language" — jak okazujesz miłość?', 1],
  ['relacje-i-wiezi', 'Kto wywarł na ciebie największy wpływ i dlaczego?', 2],
  ['relacje-i-wiezi', 'Czego nie mówisz bliskim, a powinieneś/powinnaś?', 3],
  ['relacje-i-wiezi', 'Jak radzisz sobie z samotnością?', 3],
  ['relacje-i-wiezi', 'Czy lepiej mieć jednego bliskiego przyjaciela czy wielu znajomych?', 1],
  ['relacje-i-wiezi', 'Co jest najtrudniejsze w byciu dobrym partnerem/przyjacielem?', 2],
  ['relacje-i-wiezi', 'Jak wyglądałaby twoja idealna rozmowa z kimś bliskim?', 1],
  ['relacje-i-wiezi', 'Kiedy ostatnio czułeś/aś się naprawdę wysłuchany/a?', 2],

  // === Doświadczenia Życiowe ===
  ['doswiadczenia-zyciowe', 'Jaka porażka zmieniła twoje życie na lepsze?', 2],
  ['doswiadczenia-zyciowe', 'Opisz moment, w którym czułeś/aś się w pełni żywy/a.', 2],
  ['doswiadczenia-zyciowe', 'Jaka była najtrudniejsza decyzja w twoim życiu?', 3],
  ['doswiadczenia-zyciowe', 'Gdybyś mógł/mogła cofnąć się w czasie, co byś zmienił/a?', 2],
  ['doswiadczenia-zyciowe', 'Co było twoim największym zaskoczeniem w dorosłym życiu?', 1],
  ['doswiadczenia-zyciowe', 'Jaki moment ukształtował cię najbardziej?', 3],
  ['doswiadczenia-zyciowe', 'Czego żałujesz, że nie zrobiłeś/aś wcześniej?', 2],
  ['doswiadczenia-zyciowe', 'Opisz dzień z twojego życia, który chciałbyś przeżyć jeszcze raz.', 1],
  ['doswiadczenia-zyciowe', 'Co nauczyło cię cierpienie?', 3],
  ['doswiadczenia-zyciowe', 'Jaki był twój największy akt odwagi?', 2],
  ['doswiadczenia-zyciowe', 'Kiedy ostatnio płakałeś/aś i dlaczego?', 3],
  ['doswiadczenia-zyciowe', 'Co zrobiłeś/aś z czego jesteś naprawdę dumny/a?', 1],
  ['doswiadczenia-zyciowe', 'Jaka lekcja przyszła do ciebie za późno?', 2],
  ['doswiadczenia-zyciowe', 'Opisz moment, który zmienił twój sposób patrzenia na świat.', 3],
  ['doswiadczenia-zyciowe', 'Co jest najpiękniejszą rzeczą, jakiej doświadczyłeś/aś?', 1],
  ['doswiadczenia-zyciowe', 'Jaki błąd popełniasz wciąż na nowo?', 2],
  ['doswiadczenia-zyciowe', 'Jaki moment w życiu chciałbyś/chciałabyś zapomnieć?', 3],

  // === Scenariusze i Wyobraźnia ===
  ['scenariusze-i-wyobraznia', 'Gdybyś mógł/mogła żyć w dowolnej epoce przez rok — kiedy?', 1],
  ['scenariusze-i-wyobraznia', 'Gdybyś wiedział/a, że nie możesz ponieść porażki, co byś spróbował/a?', 1],
  ['scenariusze-i-wyobraznia', 'Kolacja z trzema dowolnymi osobami — kogo zapraszasz?', 1],
  ['scenariusze-i-wyobraznia', 'Gdybyś mógł/mogła mieć jedną supermocy, jaką?', 1],
  ['scenariusze-i-wyobraznia', 'Wyobraź sobie, że jutro budzisz się w zupełnie innym kraju. Gdzie chciałbyś się obudzić?', 1],
  ['scenariusze-i-wyobraznia', 'Gdyby twoje życie było filmem, jaki byłby jego gatunek?', 1],
  ['scenariusze-i-wyobraznia', 'Wolałbyś/wolałabyś znać datę swojej śmierci czy nie wiedzieć? Dlaczego?', 3],
  ['scenariusze-i-wyobraznia', 'Gdybyś mógł/mogła zmienić jedną rzecz w przeszłości ludzkości, co by to było?', 2],
  ['scenariusze-i-wyobraznia', 'Masz milion złotych, ale musisz wydać go w 24 godziny. Co robisz?', 1],
  ['scenariusze-i-wyobraznia', 'Gdybyś pisał/a książkę o swoim życiu, jaki byłby tytuł?', 2],
  ['scenariusze-i-wyobraznia', 'Wolisz umiejętność latania czy niewidzialność?', 1],
  ['scenariusze-i-wyobraznia', 'Gdyby twój dom się palił, jaką jedną rzecz byś uratował/a?', 2],
  ['scenariusze-i-wyobraznia', 'Wyobraź sobie, że możesz porozmawiać ze sobą z przeszłości. Co byś powiedział/a?', 3],
  ['scenariusze-i-wyobraznia', 'Gdybyś mógł/mogła zamienić się życiem z kimkolwiek na tydzień, z kim?', 1],
  ['scenariusze-i-wyobraznia', 'Jaki wynalazek chciałbyś/chciałabyś, żeby powstał?', 1],
  ['scenariusze-i-wyobraznia', 'Gdyby istniał lek na zapominanie — użyłbyś go na jakieś wspomnienie?', 3],
  ['scenariusze-i-wyobraznia', 'Wolisz żyć 200 lat w samotności czy 50 lat w otoczeniu bliskich?', 3],

  // === Autorefleksja ===
  ['autorefleksja', 'Czego najbardziej się boisz, a rzadko o tym mówisz?', 3],
  ['autorefleksja', 'Jaką część siebie ukrywasz przed większością ludzi?', 3],
  ['autorefleksja', 'Jak opisałby cię twój najbliższy przyjaciel vs jak ty opisujesz siebie?', 2],
  ['autorefleksja', 'Co jest twoim największym kompleksem?', 3],
  ['autorefleksja', 'Jaki nawyk chciałbyś/chciałabyś zmienić?', 1],
  ['autorefleksja', 'Kiedy czujesz się najbardziej sobą?', 2],
  ['autorefleksja', 'Co odkładasz od dawna i dlaczego?', 2],
  ['autorefleksja', 'Jak radzisz sobie ze stresem?', 1],
  ['autorefleksja', 'Co sprawia, że tracisz poczucie czasu?', 1],
  ['autorefleksja', 'Jaki jest twój wewnętrzny krytyk i co ci mówi?', 3],
  ['autorefleksja', 'Za co jesteś sobie wdzięczny/a?', 1],
  ['autorefleksja', 'Kiedy ostatnio zaskoczyłeś/aś sam/a siebie?', 2],
  ['autorefleksja', 'Jaka jest twoja największa siła?', 1],
  ['autorefleksja', 'Czego zazdrościsz innym?', 2],
  ['autorefleksja', 'Jak reagujesz na krytykę?', 2],
  ['autorefleksja', 'Co chciałbyś/chciałabyś, żeby ludzie o tobie wiedzieli?', 2],
  ['autorefleksja', 'Jaka jest najważniejsza rzecz, której się nauczyłeś/aś o sobie?', 3],

  // === Przyszłość ===
  ['przyszlosc', 'Jak chciałbyś/chciałabyś, żeby wyglądało twoje codzienne życie za 10 lat?', 2],
  ['przyszlosc', 'Jakie dziedzictwo chcesz po sobie zostawić?', 3],
  ['przyszlosc', 'Czego chcesz się nauczyć zanim umrzesz?', 2],
  ['przyszlosc', 'Gdybyś mógł/mogła zmienić jedną rzecz w swoim życiu jutro, co by to było?', 1],
  ['przyszlosc', 'Jaki jest twój największy cel na najbliższy rok?', 1],
  ['przyszlosc', 'Co chciałbyś powiedzieć sobie za 20 lat?', 2],
  ['przyszlosc', 'Czego się boisz w przyszłości?', 3],
  ['przyszlosc', 'Jaki zawód wybrałbyś/wybrałabyś, gdybyś zaczynał/a od nowa?', 1],
  ['przyszlosc', 'Co daje ci nadzieję?', 2],
  ['przyszlosc', 'Jak wyobrażasz sobie swoją starość?', 2],
  ['przyszlosc', 'Gdzie chciałbyś/chciałabyś mieszkać za 10 lat?', 1],
  ['przyszlosc', 'Czego chciałbyś nauczyć swoje dzieci (obecne lub przyszłe)?', 2],
  ['przyszlosc', 'Jaki masz niespełniony sen?', 2],
  ['przyszlosc', 'Gdybyś miał/a napisać list do siebie z przyszłości, o co byś zapytał/a?', 3],
  ['przyszlosc', 'Co chcesz, żeby ludzie powiedzieli na twoim pogrzebie?', 3],
  ['przyszlosc', 'Jaki jest twój plan B w życiu?', 1],
  ['przyszlosc', 'Czy wierzysz, że twoje najlepsze lata są jeszcze przed tobą?', 2],
];

async function seed() {
  const pool = new Pool({ connectionString: databaseUrl });

  try {
    console.log('Seeding database...');

    // Clear existing data
    await pool.query('TRUNCATE answers, rounds, questions, categories RESTART IDENTITY CASCADE');

    // Insert categories
    for (const cat of categories) {
      await pool.query(
        'INSERT INTO categories (name, slug) VALUES ($1, $2)',
        [cat.name, cat.slug]
      );
    }
    console.log(`  Inserted ${categories.length} categories`);

    // Get category id map
    const catResult = await pool.query('SELECT id, slug FROM categories');
    const catMap = new Map<string, number>();
    for (const row of catResult.rows) {
      catMap.set(row.slug, row.id);
    }

    // Insert questions
    for (const [slug, text, depth] of questions) {
      const categoryId = catMap.get(slug);
      if (!categoryId) {
        console.error(`  Unknown category: ${slug}`);
        continue;
      }
      await pool.query(
        'INSERT INTO questions (category_id, text, depth_level) VALUES ($1, $2, $3)',
        [categoryId, text, depth]
      );
    }
    console.log(`  Inserted ${questions.length} questions`);

    console.log('Seed complete!');
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
