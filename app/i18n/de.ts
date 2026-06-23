import type { HowToPlayStep } from "@/app/components/HowToPlay";

const de = {
  siteName: "DailyCheckmate",
  siteDescription: "Schachpuzzle und Minispiele online spielen",

  nav: {
    menu: "Menü",
    close: "✕",
    signUp: "Registrieren",
    logIn: "Anmelden",
    switchToLight: "Zum hellen Modus wechseln",
    switchToDark: "Zum dunklen Modus wechseln",
    language: "🇩🇪 Deutsch ▾",
  },

  sidebar: {
    playChess: "Schach spielen",
    miniChess: "Mini-Schach",
    takes: "Schläge",
    check: "Schach",
    smothered: "Ersticktes Matt",
    chessSolitaire: "Schach-Solitär",
    chainCapture: "Kettenschlag",
    survival: "Überleben",
    mateIn1: "Matt in 1",
    mateIn2: "Matt in 2",
    mateIn3: "Matt in 3",
    endgamePuzzles: "Endspiel-Aufgaben",
    kingAndPawn: "König und Bauer",
    rookEndgame: "Turmendspiel",
    zugzwang: "Zugzwang",
    queenVsPawn: "Dame gegen Bauer",
    leaderboard: "Bestenliste",
    seasonLeaders: "Saisonführer",
    quests: "Quests (0)",
    arena: "Arena",
    equipment: "Ausrüstung",
    marketplace: "Marktplatz",
    events: "Events",
    championship: "Meisterschaft",
    playersOnline: "Spieler online (1430)",
    news: "Neuigkeiten",
    statistics: "Statistiken",
    myProfile: "Mein Profil",
    chat: "Chat (100+)",
  },

  footer: {
    copyright: (year: number) => `© ${year} Minichess`,
  },

  userMenu: {
    fallbackName: "Spieler",
    account: "Konto",
    logOut: "Abmelden",
  },

  home: {
    title: "DailyCheckmate",
    subtitle: "Wähle ein Spiel oder Puzzle.",
  },

  gameTiles: {
    chess:         { title: "Schach spielen",      description: "Vollständiges Schach gegen die Engine — wähle deinen Schwierigkeitsgrad, vom Anfänger bis zum Experten." },
    minichess:     { title: "Mini-Schach",          description: "Ein kompaktes 5×5-Schachgefecht gegen die KI. Gleiche Regeln, kleineres Brett." },
    mateIn1:       { title: "Matt in 1",            description: "Finde den einzigen Zug, der sofort Schachmatt liefert." },
    mateIn2:       { title: "Matt in 2",            description: "Erzwinge Schachmatt in zwei Zügen gegen die beste Verteidigung von Schwarz." },
    mateIn3:       { title: "Matt in 3",            description: "Berechne ein erzwungenes Schachmatt drei Züge tief." },
    takes:         { title: "Schläge",              description: "Schlage jede Figur auf dem Brett in der richtigen Reihenfolge." },
    check:         { title: "Schach",               description: "Setze Schachmatt auf dem Minibrett innerhalb des Zuglimits." },
    smothered:     { title: "Ersticktes Matt",      description: "Falle den König mit seinen eigenen Figuren ein und setze ihn erstickend matt." },
    chessSolitaire:{ title: "Schach-Solitär",       description: "Räume das Brett, indem du eine Figur nach der anderen schlägst." },
    solitaire:     { title: "Kettenschlag",         description: "Räume das Brett in einer einzigen ununterbrochenen Schlagkette." },
    survival:      { title: "Überleben",            description: "Schlage Bauern mit deinem Springer so lange wie möglich." },
    kingAndPawn:   { title: "König und Bauer",      description: "Promote den Bauern mit Unterstützung des Königs, dann Schachmatt." },
    rookEndgame:   { title: "Turmendspiel",         description: "Schneide den König mit dem Turm ab und setze ihn matt." },
    zugzwang:      { title: "Zugzwang",             description: "Finde den ruhigen Zug, der den Gegner hilflos macht." },
    queenVsPawn:   { title: "Dame gegen Bauer",     description: "Fange den Freibauern mit der Dame, bevor er umwandelt." },
  },

  gamePages: {
    takes:         { title: "Schläge",           subtitle: "Schlage jede Figur — finde die richtige Reihenfolge, um das Brett zu leeren." },
    solitaire:     { title: "Kettenschlag",       subtitle: "Räume das Brett in einer einzigen ununterbrochenen Schlagkette." },
    check:         { title: "Schach",             subtitle: "Setze Schachmatt auf dem Minibrett innerhalb des Zuglimits." },
    smothered:     { title: "Ersticktes Matt",    subtitle: "Falle den König mit seinen eigenen Figuren ein und setze ihn erstickend matt." },
    chessSolitaire:{ title: "Schach-Solitär",     subtitle: "Schlage jede Figur, einen legalen Zug nach dem anderen." },
    kingAndPawn:   { title: "König und Bauer",    subtitle: "Promote den Bauern mit Unterstützung deines Königs, dann setze Schachmatt." },
    queenVsPawn:   { title: "Dame gegen Bauer",   subtitle: "Ein Freibauer ist einen Schritt von der Umwandlung entfernt. Fange ihn mit der Dame." },
    rookEndgame:   { title: "Turmendspiel",       subtitle: "Schneide den König mit dem Turm ab und bringe deinen König vor, um Matt zu setzen." },
    zugzwang:      { title: "Zugzwang",           subtitle: "Finde den ruhigen Wartezug, der Schwarz zu einer verlorenen Antwort zwingt, dann Matt." },
    mateIn1:       { title: "Matt in 1",          subtitle: "Finde den einzigen Zug, der Schachmatt liefert." },
    mateIn2:       { title: "Matt in 2",          subtitle: "Erzwinge Schachmatt in zwei Zügen gegen die beste Verteidigung von Schwarz." },
    mateIn3:       { title: "Matt in 3",          subtitle: "Berechne ein erzwungenes Schachmatt in drei Zügen." },
  },

  howToPlay: {
    sectionTitle: "Spielanleitung",

    takes: [
      { heading: "Das Brett studieren",       body: "Alle feindlichen Figuren sind auf einem 4×4-Feld angeordnet. Jede Figur muss geschlagen werden — keine darf übrig bleiben." },
      { heading: "Ersten Schlag wählen",      body: "Klicke auf eine Figur, die dein Angreifer legal schlagen kann. Der Angreifer zieht auf das entsprechende Feld." },
      { heading: "Schläge verketten",         body: "Nach jedem Schlag muss dein Angreifer sofort eine weitere Figur schlagen. Du kannst nicht in der Mitte einer Kette stoppen." },
      { heading: "Die Reihenfolge zählt",     body: "Nur eine bestimmte Schlagreihenfolge leert das Brett. Wenn du feststeckst, mache den Zug rückgängig und versuche eine andere Reihenfolge." },
    ] as HowToPlayStep[],

    solitaire: [
      { heading: "Eine ununterbrochene Kette", body: "Du musst jede Figur in einer einzigen fortlaufenden Sequenz schlagen — jeder Schlag muss unmittelbar auf den letzten folgen." },
      { heading: "Startfigur auswählen",       body: "Klicke auf die Figur, mit der du beginnen möchtest. Sie wird für die gesamte Kette dein aktiver Angreifer." },
      { heading: "In Reihenfolge schlagen",    body: "Klicke auf eine feindliche Figur, die dein Angreifer legal schlagen kann. Der Angreifer springt auf das Feld und wird der nächste Angreifer." },
      { heading: "Brett leeren",               body: "Fahre fort, bis jede Figur geschlagen wurde. Wenn du in eine Sackgasse gerätst, mache den Zug rückgängig und beginne mit einer anderen Figur." },
    ] as HowToPlayStep[],

    check: [
      { heading: "Mini-Schachbrett",           body: "Das Spiel wird auf einem kompakten 4×4-Brett mit einer reduzierten Figurenanzahl gespielt. Es gelten die normalen Schachregeln." },
      { heading: "Du spielst Weiß",            body: "Weiß zieht zuerst. Dein Ziel ist es, Schachmatt zu setzen — stelle den schwarzen König schach, ohne Fluchtmöglichkeit." },
      { heading: "Zuglimit beachten",          body: "Jedes Puzzle hat ein Zuglimit. Schachmatt muss innerhalb der erlaubten Züge erreicht werden, sonst gilt das Puzzle als gescheitert." },
      { heading: "Vorausdenken",               body: "Mit weniger Feldern zählt jeder Zug. Suche nach Schachgeboten, die die Fluchtwege des Königs abschneiden, bevor du ihn einkreist." },
    ] as HowToPlayStep[],

    smothered: [
      { heading: "Was ist ein ersticktes Matt?", body: "Ein ersticktes Matt tritt auf, wenn ein Springer den König mattiert, der vollständig von eigenen Figuren umgeben ist und kein Fluchtfeld hat." },
      { heading: "Der Springer ist entscheidend", body: "Nur ein Springer kann ein ersticktes Matt setzen, da er über Figuren springen kann. Positioniere den Springer so, dass er Schach bietet, während die eigenen Figuren des Königs jeden Ausweg versperren." },
      { heading: "König an den Rand drängen",  body: "Dränge den schwarzen König in eine Ecke oder an den Rand, wo seine eigenen Figuren ihn einengen und ihm keinen Fluchtweg lassen." },
      { heading: "Springerschach geben",       body: "Sobald der König von eigenen Figuren umgeben ist, setze den Springer auf das Mattfeld. Der König hat keinen Ausweg mehr." },
    ] as HowToPlayStep[],

    chessSolitaire: [
      { heading: "Volle Schachregeln, volles Brett", body: "Schach-Solitär verwendet ein 8×8-Brett mit Figuren, die nach normalen Schachregeln ziehen, einschließlich gerichteter Bauern." },
      { heading: "Beliebige Figur zum Start",  body: "Klicke auf eine Figur, um sie zu deinem aktiven Angreifer zu machen. Sie muss sofort eine feindliche Figur schlagen, um die Kette zu beginnen." },
      { heading: "Kette aufrechterhalten",     body: "Nach jedem Schlag muss die schlagende Figur eine weitere feindliche Figur schlagen. Du kannst nicht passen oder Angreifer wechseln." },
      { heading: "Keine Figur übrig lassen",   body: "Jede feindliche Figur muss geschlagen werden, bevor die Kette endet. Manche Startfiguren führen in Sackgassen — wenn feststeckst, mache rückgängig und versuche eine andere." },
    ] as HowToPlayStep[],

    kingAndPawn: [
      { heading: "König unterstützt den Bauern", body: "Dein weißer König und ein einzelner Bauer stehen dem allein stehenden schwarzen König gegenüber. Der Bauer kann nicht sicher umwandeln, ohne dass der König vorangeht." },
      { heading: "Opposition nutzen",          body: "Stelle deinen König direkt gegenüber dem schwarzen König, um die Opposition zu gewinnen und ihn zurück oder zur Seite zu drängen." },
      { heading: "Bauer sicher vorziehen",     body: "Sobald der schwarze König abgeschnitten ist, schiebe den Bauern vor. Ziehe ihn nie auf ein Feld, wo er geschlagen oder blockiert werden kann." },
      { heading: "Umwandeln und mattsetzen",   body: "Wandle den Bauern in eine Dame um, dann setze mit Dame und König so schnell wie möglich Schachmatt." },
    ] as HowToPlayStep[],

    queenVsPawn: [
      { heading: "Bauern stoppen",             body: "Ein schwarzer Freibauer rast auf die Umwandlung zu. Deine weiße Dame muss ihn schlagen, bevor er die letzte Reihe erreicht." },
      { heading: "Du ziehst zuerst",           body: "Weiß zieht immer zuerst. Nutze die Reichweite der Dame, um den Weg des Bauern sofort zu kreuzen." },
      { heading: "Schwarzen König beachten",   body: "Der schwarze König könnte den Bauern begleiten. Bewege die Dame nicht auf ein Feld, von dem sie vertrieben werden kann." },
      { heading: "Innerhalb von 2 Zügen schlagen", body: "Jedes Puzzle erfordert, dass die Dame den Bauern innerhalb von 2 Zügen gewinnt. Wenn der Bauer umwandelt, gilt das Puzzle als gescheitert." },
    ] as HowToPlayStep[],

    rookEndgame: [
      { heading: "König und Turm gegen König", body: "Du hast König und Turm gegen den bloßen schwarzen König. Dies ist ein grundlegendes Endspiel, das jeder Schachspieler beherrschen muss." },
      { heading: "König mit Turm abschneiden", body: "Nutze den Turm, um den schwarzen König auf einen immer kleineren Bereich des Bretts zu beschränken und ihn an den Rand oder in eine Ecke zu drängen." },
      { heading: "König heranführen",          body: "Der Turm allein kann nicht mattsetzen. Koordiniere deinen König, um ihn zu nähern und den schwarzen König einzuboxen." },
      { heading: "Rückrangmatt setzen",        body: "Sobald der schwarze König in einer Reihe oder Linie gefangen ist, stelle den Turm auf diese Reihe oder Linie, während dein König Unterstützung bietet." },
    ] as HowToPlayStep[],

    zugzwang: [
      { heading: "Was ist Zugzwang?",          body: "Zugzwang ist eine Situation, in der jeder Zug des Gegners seine Position verschlechtert. Der Zwang zu ziehen ist der Nachteil." },
      { heading: "Den ruhigen Zug finden",     body: "Der Schlüsselzug ist kein Schachgebot oder Schlag — es ist ein subtiler Wartezug, der Schwarz in Zugzwang versetzt, ohne gute Antwort." },
      { heading: "Schwarz ist zum Mitmachen gezwungen", body: "Was auch immer Schwarz nach deinem ruhigen Zug spielt, führt in eine verlorene Position. Jede legale Antwort ermöglicht sofortiges Schachmatt." },
      { heading: "Schachmatt setzen",          body: "Nach Schwarz' erzwungener Antwort hast du ein klares erzwungenes Matt. Setze es um — das Puzzle ist erst abgeschlossen, wenn das Matt gesetzt wurde." },
    ] as HowToPlayStep[],

    mateIn1: [
      { heading: "Ein Zug gewinnt",            body: "Es gibt genau einen Zug, der Schachmatt liefert. Das Puzzle ist abgeschlossen, sobald dieser Zug gespielt wird." },
      { heading: "Zuerst nach Schachgeboten suchen", body: "Schachmatt muss den König schachbieten, ohne Fluchtmöglichkeit. Prüfe jedes verfügbare Schachgebot: Kann der König ziehen, decken oder schlagen?" },
      { heading: "Fluchtfelder eliminieren",   body: "Ein Mattzug lässt dem König null legale Züge. Stelle sicher, dass deine Figur Schach bietet und jedes Fluchtfeld gedeckt ist." },
      { heading: "Du spielst Weiß",            body: "Weiß zieht immer zuerst. Schwarz hat keine Antwort — wenn dein Zug Schachmatt ist, gewinnst du sofort." },
    ] as HowToPlayStep[],

    mateIn2: [
      { heading: "Erzwungenes Matt in 2",      body: "Weiß macht einen Zug, Schwarz antwortet bestmöglich, dann setzt Weiß Schachmatt. Die Lösung muss gegen jede Antwort von Schwarz funktionieren." },
      { heading: "Den Schlüsselzug finden",    body: "Der erste Zug setzt eine unaufhaltsame Mattdrohung auf. Es kann ein Schachgebot, ein ruhiger Zug oder sogar ein Opfer sein." },
      { heading: "Alle Antworten von Schwarz berücksichtigen", body: "Nach deinem Schlüsselzug wird Schwarz versuchen, zu verzögern oder zu entkommen. Dein zweiter Zug muss Schachmatt liefern, unabhängig von Schwarz' Antwort." },
      { heading: "Du spielst Weiß",            body: "Weiß zieht zuerst. Nachdem du gezogen hast, antwortet Schwarz einmal, dann musst du mattsetzen. Das Puzzle scheitert, wenn Matt nicht im 2. Zug geliefert wird." },
    ] as HowToPlayStep[],

    mateIn3: [
      { heading: "Erzwungenes Matt in 3",      body: "Weiß macht drei Züge und Schwarz zwei. Die Lösung muss Schachmatt im 3. Zug erzwingen, unabhängig von Schwarz' bester Verteidigung." },
      { heading: "Mit dem Schlüsselzug beginnen", body: "Der erste Zug erzeugt eine Bedrohung, die Schwarz nicht vollständig neutralisieren kann — oft durch Verbesserung einer Figur, Öffnen einer Linie oder Aufbau eines Mattnetzes." },
      { heading: "Schwarz' Verteidigungen lesen", body: "Nach jedem weißen Zug bedenke jede Antwort von Schwarz. Dein Plan muss alle berücksichtigen und trotzdem Schachmatt im 3. Zug liefern." },
      { heading: "Berechnen, nicht raten",     body: "Matt in 3 erfordert genaue Berechnung. Arbeite die Hauptvarianten methodisch durch — ein einziger Fehler lässt Schwarz entkommen." },
    ] as HowToPlayStep[],
  },
};

export default de;
