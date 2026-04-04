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
  { name: 'Impreza i Grupa', slug: 'impreza-i-grupa' },
];

// [slug, text, depth_level, mode]
const questions: [string, string, number, string][] = [
  // === Wartości i Przekonania ===
  ['wartosci-i-przekonania', 'Jakie przekonanie zmieniłeś/aś w ciągu ostatnich kilku lat?', 2, 'both'],
  ['wartosci-i-przekonania', 'Gdybyś mógł/mogła zaszczepić jedną wartość w każdym człowieku na Ziemi, co by to było?', 2, 'both'],
  ['wartosci-i-przekonania', 'Co jest dla ciebie ważniejsze — być lubianym czy szanowanym?', 1, 'both'],
  ['wartosci-i-przekonania', 'W co wierzysz, mimo że nie potrafisz tego udowodnić?', 3, 'both'],
  ['wartosci-i-przekonania', 'Jaka jest najbardziej niedoceniana cnota?', 2, 'both'],
  ['wartosci-i-przekonania', 'Czy uważasz, że ludzie są z natury dobrzy? Dlaczego?', 3, 'both'],
  ['wartosci-i-przekonania', 'Jaka zasada moralna jest dla ciebie niepodważalna?', 2, 'both'],
  ['wartosci-i-przekonania', 'Co oznacza dla ciebie wolność?', 2, 'both'],
  ['wartosci-i-przekonania', 'Czy cel może uświęcać środki? Podaj przykład.', 3, 'both'],
  ['wartosci-i-przekonania', 'Jaki temat potrafi cię naprawdę rozpalić w dyskusji?', 1, 'both'],
  ['wartosci-i-przekonania', 'Co byś zrobił/a, gdybyś wiedział/a, że nikt się nie dowie?', 3, 'both'],
  ['wartosci-i-przekonania', 'Która wartość wyniesiona z domu jest ci najbliższa?', 2, 'both'],
  ['wartosci-i-przekonania', 'Co jest ważniejsze — sprawiedliwość czy miłosierdzie?', 3, 'both'],
  ['wartosci-i-przekonania', 'Czy pieniądze zmieniają ludzi? Jak?', 1, 'both'],
  ['wartosci-i-przekonania', 'Jakiej opinii nigdy nie powiedziałeś/aś głośno?', 3, 'both'],
  ['wartosci-i-przekonania', 'Co dla ciebie znaczy „dobre życie"?', 2, 'both'],
  ['wartosci-i-przekonania', 'Czy kłamstwo może być etyczne? Kiedy?', 2, 'both'],

  // === Relacje i Więzi ===
  ['relacje-i-wiezi', 'Co oznacza dla ciebie lojalność i gdzie są jej granice?', 2, 'both'],
  ['relacje-i-wiezi', 'Opisz moment, gdy ktoś okazał ci życzliwość, o której wciąż pamiętasz.', 2, 'both'],
  ['relacje-i-wiezi', 'Co jest najtrudniejsze w naprawdę głębokim poznaniu drugiej osoby?', 3, 'both'],
  ['relacje-i-wiezi', 'Jaka cecha w ludziach przyciąga cię najbardziej?', 1, 'both'],
  ['relacje-i-wiezi', 'Czego nauczyła cię twoja najważniejsza przyjaźń?', 2, 'both'],
  ['relacje-i-wiezi', 'Jak reagujesz, gdy ktoś cię zawiedzie?', 2, 'both'],
  ['relacje-i-wiezi', 'Co chciałbyś/chciałabyś usłyszeć od bliskiej osoby, ale nigdy tego nie słyszysz?', 3, 'both'],
  ['relacje-i-wiezi', 'Jak wygląda dla ciebie idealne wsparcie w trudnym momencie?', 2, 'both'],
  ['relacje-i-wiezi', 'Czy potrafisz wybaczyć zdradę zaufania?', 3, 'both'],
  ['relacje-i-wiezi', 'Jaka jest twoja „love language" — jak okazujesz miłość?', 1, 'duo'],
  ['relacje-i-wiezi', 'Kto wywarł na ciebie największy wpływ i dlaczego?', 2, 'both'],
  ['relacje-i-wiezi', 'Czego nie mówisz bliskim, a powinieneś/powinnaś?', 3, 'both'],
  ['relacje-i-wiezi', 'Jak radzisz sobie z samotnością?', 3, 'both'],
  ['relacje-i-wiezi', 'Czy lepiej mieć jednego bliskiego przyjaciela czy wielu znajomych?', 1, 'both'],
  ['relacje-i-wiezi', 'Co jest najtrudniejsze w byciu dobrym partnerem lub przyjacielem?', 2, 'both'],
  ['relacje-i-wiezi', 'Jak wyglądałaby twoja idealna rozmowa z kimś bliskim?', 1, 'duo'],
  ['relacje-i-wiezi', 'Kiedy ostatnio czułeś/aś się naprawdę wysłuchany/a?', 2, 'both'],

  // === Doświadczenia Życiowe ===
  ['doswiadczenia-zyciowe', 'Jaka porażka zmieniła twoje życie na lepsze?', 2, 'both'],
  ['doswiadczenia-zyciowe', 'Opisz moment, w którym czułeś/aś się w pełni żywy/a.', 2, 'both'],
  ['doswiadczenia-zyciowe', 'Jaka była najtrudniejsza decyzja w twoim życiu?', 3, 'both'],
  ['doswiadczenia-zyciowe', 'Gdybyś mógł/mogła cofnąć się w czasie, co byś zmienił/a?', 2, 'both'],
  ['doswiadczenia-zyciowe', 'Co było twoim największym zaskoczeniem w dorosłym życiu?', 1, 'both'],
  ['doswiadczenia-zyciowe', 'Jaki moment ukształtował cię najbardziej?', 3, 'both'],
  ['doswiadczenia-zyciowe', 'Czego żałujesz, że nie zrobiłeś/aś wcześniej?', 2, 'both'],
  ['doswiadczenia-zyciowe', 'Opisz dzień z twojego życia, który chciałbyś/chciałabyś przeżyć jeszcze raz.', 1, 'both'],
  ['doswiadczenia-zyciowe', 'Czego nauczyło cię cierpienie?', 3, 'both'],
  ['doswiadczenia-zyciowe', 'Jaki był twój największy akt odwagi?', 2, 'both'],
  ['doswiadczenia-zyciowe', 'Kiedy ostatnio płakałeś/aś i dlaczego?', 3, 'both'],
  ['doswiadczenia-zyciowe', 'Co zrobiłeś/aś, z czego jesteś naprawdę dumny/a?', 1, 'both'],
  ['doswiadczenia-zyciowe', 'Jaka lekcja przyszła do ciebie za późno?', 2, 'both'],
  ['doswiadczenia-zyciowe', 'Opisz moment, który zmienił twój sposób patrzenia na świat.', 3, 'both'],
  ['doswiadczenia-zyciowe', 'Co jest najpiękniejszą rzeczą, jakiej doświadczyłeś/aś?', 1, 'both'],
  ['doswiadczenia-zyciowe', 'Jaki błąd popełniasz wciąż na nowo?', 2, 'both'],
  ['doswiadczenia-zyciowe', 'Jaki moment w życiu chciałbyś/chciałabyś zapomnieć?', 3, 'both'],

  // === Scenariusze i Wyobraźnia ===
  ['scenariusze-i-wyobraznia', 'Gdybyś mógł/mogła żyć w dowolnej epoce przez rok — kiedy?', 1, 'both'],
  ['scenariusze-i-wyobraznia', 'Gdybyś wiedział/a, że nie możesz ponieść porażki, co byś spróbował/a?', 1, 'both'],
  ['scenariusze-i-wyobraznia', 'Kolacja z trzema dowolnymi osobami — kogo zapraszasz?', 1, 'both'],
  ['scenariusze-i-wyobraznia', 'Gdybyś mógł/mogła mieć jedną supermoc, jaką byś wybrał/a?', 1, 'both'],
  ['scenariusze-i-wyobraznia', 'Jutro budzisz się w zupełnie innym kraju. Gdzie chciałbyś/chciałabyś się obudzić?', 1, 'both'],
  ['scenariusze-i-wyobraznia', 'Gdyby twoje życie było filmem, jaki byłby jego gatunek?', 1, 'both'],
  ['scenariusze-i-wyobraznia', 'Wolałbyś/wolałabyś znać datę swojej śmierci czy nie wiedzieć? Dlaczego?', 3, 'both'],
  ['scenariusze-i-wyobraznia', 'Gdybyś mógł/mogła zmienić jedną rzecz w przeszłości ludzkości, co by to było?', 2, 'both'],
  ['scenariusze-i-wyobraznia', 'Masz milion złotych, ale musisz wydać go w 24 godziny. Co robisz?', 1, 'both'],
  ['scenariusze-i-wyobraznia', 'Gdybyś pisał/a książkę o swoim życiu, jaki byłby tytuł?', 2, 'both'],
  ['scenariusze-i-wyobraznia', 'Wolisz umiejętność latania czy niewidzialność?', 1, 'both'],
  ['scenariusze-i-wyobraznia', 'Gdyby twój dom się palił, jaką jedną rzecz byś uratował/a?', 2, 'both'],
  ['scenariusze-i-wyobraznia', 'Wyobraź sobie, że możesz porozmawiać ze sobą z przeszłości. Co byś powiedział/a?', 3, 'both'],
  ['scenariusze-i-wyobraznia', 'Gdybyś mógł/mogła zamienić się życiem z kimkolwiek na tydzień — z kim?', 1, 'both'],
  ['scenariusze-i-wyobraznia', 'Jaki wynalazek chciałbyś/chciałabyś, żeby powstał?', 1, 'both'],
  ['scenariusze-i-wyobraznia', 'Gdyby istniał lek na zapominanie — użyłbyś/użyłabyś go na jakieś wspomnienie?', 3, 'both'],
  ['scenariusze-i-wyobraznia', 'Wolisz żyć 200 lat w samotności czy 50 lat w otoczeniu bliskich?', 3, 'both'],

  // === Autorefleksja ===
  ['autorefleksja', 'Czego najbardziej się boisz, a rzadko o tym mówisz?', 3, 'both'],
  ['autorefleksja', 'Jaką część siebie ukrywasz przed większością ludzi?', 3, 'both'],
  ['autorefleksja', 'Jak opisałby cię twój najbliższy przyjaciel, a jak ty opisujesz siebie?', 2, 'both'],
  ['autorefleksja', 'Co jest twoim największym kompleksem?', 3, 'duo'],
  ['autorefleksja', 'Jaki nawyk chciałbyś/chciałabyś zmienić?', 1, 'both'],
  ['autorefleksja', 'Kiedy czujesz się najbardziej sobą?', 2, 'both'],
  ['autorefleksja', 'Co odkładasz od dawna i dlaczego?', 2, 'both'],
  ['autorefleksja', 'Jak radzisz sobie ze stresem?', 1, 'both'],
  ['autorefleksja', 'Co sprawia, że tracisz poczucie czasu?', 1, 'both'],
  ['autorefleksja', 'Jaki jest twój wewnętrzny krytyk i co ci mówi?', 3, 'both'],
  ['autorefleksja', 'Za co jesteś sobie wdzięczny/a?', 1, 'both'],
  ['autorefleksja', 'Kiedy ostatnio zaskoczyłeś/aś sam/a siebie?', 2, 'both'],
  ['autorefleksja', 'Jaka jest twoja największa siła?', 1, 'both'],
  ['autorefleksja', 'Czego zazdrościsz innym?', 2, 'both'],
  ['autorefleksja', 'Jak reagujesz na krytykę?', 2, 'both'],
  ['autorefleksja', 'Co chciałbyś/chciałabyś, żeby ludzie o tobie wiedzieli?', 2, 'both'],
  ['autorefleksja', 'Jaka jest najważniejsza rzecz, której nauczyłeś/aś się o sobie?', 3, 'both'],

  // === Przyszłość ===
  ['przyszlosc', 'Jak chciałbyś/chciałabyś, żeby wyglądało twoje codzienne życie za 10 lat?', 2, 'both'],
  ['przyszlosc', 'Jakie dziedzictwo chcesz po sobie zostawić?', 3, 'both'],
  ['przyszlosc', 'Czego chcesz się nauczyć, zanim umrzesz?', 2, 'both'],
  ['przyszlosc', 'Gdybyś mógł/mogła zmienić jedną rzecz w swoim życiu jutro, co by to było?', 1, 'both'],
  ['przyszlosc', 'Jaki jest twój największy cel na najbliższy rok?', 1, 'both'],
  ['przyszlosc', 'Co chciałbyś/chciałabyś powiedzieć sobie za 20 lat?', 2, 'both'],
  ['przyszlosc', 'Czego boisz się w przyszłości?', 3, 'both'],
  ['przyszlosc', 'Jaki zawód wybrałbyś/wybrałabyś, gdybyś zaczynał/a od nowa?', 1, 'both'],
  ['przyszlosc', 'Co daje ci nadzieję?', 2, 'both'],
  ['przyszlosc', 'Jak wyobrażasz sobie swoją starość?', 2, 'both'],
  ['przyszlosc', 'Gdzie chciałbyś/chciałabyś mieszkać za 10 lat?', 1, 'both'],
  ['przyszlosc', 'Czego chciałbyś/chciałabyś nauczyć swoje dzieci (obecne lub przyszłe)?', 2, 'both'],
  ['przyszlosc', 'Jaki masz niespełniony sen?', 2, 'both'],
  ['przyszlosc', 'Gdybyś miał/a napisać list do siebie z przyszłości, o co byś zapytał/a?', 3, 'both'],
  ['przyszlosc', 'Co chcesz, żeby ludzie powiedzieli na twoim pogrzebie?', 3, 'both'],
  ['przyszlosc', 'Jaki jest twój plan B w życiu?', 1, 'both'],
  ['przyszlosc', 'Czy wierzysz, że twoje najlepsze lata są jeszcze przed tobą?', 2, 'both'],

  // === Impreza i Grupa (party-only) ===
  ['impreza-i-grupa', 'Kto z grupy byłby najlepszym towarzyszem podróży i dlaczego?', 1, 'party'],
  ['impreza-i-grupa', 'Gdybyście mogli razem pojechać gdziekolwiek na świecie, gdzie by to było?', 1, 'party'],
  ['impreza-i-grupa', 'Kto z grupy najbardziej pasowałby do roli w filmie akcji?', 1, 'party'],
  ['impreza-i-grupa', 'Opowiedz o czymś, czego nikt z grupy o tobie nie wie.', 2, 'party'],
  ['impreza-i-grupa', 'Jaka piosenka najlepiej opisuje twój obecny etap życia?', 1, 'party'],
  ['impreza-i-grupa', 'Gdybyście mieli razem założyć firmę, czym by się zajmowała?', 1, 'party'],
  ['impreza-i-grupa', 'Kto z grupy przetrwałby najdłużej na bezludnej wyspie?', 1, 'party'],
  ['impreza-i-grupa', 'Co jest twoją guilty pleasure, o której nie mówisz na co dzień?', 1, 'party'],
  ['impreza-i-grupa', 'Gdybyś mógł/mogła wybrać supermoc dla kogoś z grupy — komu i jaką?', 1, 'party'],
  ['impreza-i-grupa', 'Jaki jest najdziwniejszy talent, jaki posiadasz?', 1, 'party'],
  ['impreza-i-grupa', 'Opowiedz najzabawniejszą historię ze swojego życia w 30 sekund.', 1, 'party'],
  ['impreza-i-grupa', 'Kto z grupy byłby najlepszym nauczycielem? Czego by uczył?', 1, 'party'],
  ['impreza-i-grupa', 'Gdyby ta grupa miała swój hymn, jaki by to był utwór?', 1, 'party'],
  ['impreza-i-grupa', 'Jaka jest najodważniejsza rzecz, jaką kiedykolwiek zrobiłeś/aś?', 2, 'party'],
  ['impreza-i-grupa', 'Kogo z grupy zabrałbyś/zabrałabyś na rozmowę kwalifikacyjną jako wsparcie moralne?', 1, 'party'],
  ['impreza-i-grupa', 'Gdybyście musieli razem przeżyć apokalipsę, kto pełniłby jaką rolę?', 1, 'party'],
  ['impreza-i-grupa', 'Jakie jest twoje najgorsze wspomnienie z imprezy?', 2, 'party'],
  ['impreza-i-grupa', 'Kto z grupy ma najlepsze poczucie humoru? Uzasadnij.', 1, 'party'],
  ['impreza-i-grupa', 'Powiedz każdej osobie z grupy jedną rzecz, którą w niej podziwiasz.', 2, 'party'],
  ['impreza-i-grupa', 'Gdybyś miał/a opisać tę grupę jednemu zdaniem, co byś powiedział/a?', 1, 'party'],
];

async function seed() {
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('localhost') ? false : { rejectUnauthorized: false },
  });

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

    // Insert questions with mode
    for (const [slug, text, depth, mode] of questions) {
      const categoryId = catMap.get(slug);
      if (!categoryId) {
        console.error(`  Unknown category: ${slug}`);
        continue;
      }
      await pool.query(
        'INSERT INTO questions (category_id, text, depth_level, mode) VALUES ($1, $2, $3, $4)',
        [categoryId, text, depth, mode]
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
