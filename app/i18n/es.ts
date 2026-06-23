import type { HowToPlayStep } from "@/app/components/HowToPlay";

const es = {
  siteName: "DailyCheckmate",
  siteDescription: "Juega puzzles de ajedrez y minijuegos en línea",

  nav: {
    menu: "Menú",
    close: "✕",
    signUp: "Registrarse",
    logIn: "Iniciar sesión",
    switchToLight: "Cambiar al modo claro",
    switchToDark: "Cambiar al modo oscuro",
    language: "🇪🇸 Español ▾",
  },

  sidebar: {
    playChess: "Jugar al ajedrez",
    miniChess: "Mini ajedrez",
    takes: "Capturas",
    check: "Jaque",
    smothered: "Mate ahogado",
    chessSolitaire: "Solitario de ajedrez",
    chainCapture: "Captura en cadena",
    survival: "Supervivencia",
    mateIn1: "Mate en 1",
    mateIn2: "Mate en 2",
    mateIn3: "Mate en 3",
    endgamePuzzles: "Finales",
    kingAndPawn: "Rey y peón",
    rookEndgame: "Final de torre",
    zugzwang: "Zugzwang",
    queenVsPawn: "Dama contra peón",
    leaderboard: "Clasificación",
    seasonLeaders: "Líderes de temporada",
    quests: "Misiones (0)",
    arena: "Arena",
    equipment: "Equipamiento",
    marketplace: "Mercado",
    events: "Eventos",
    championship: "Campeonato",
    playersOnline: "Jugadores en línea (1430)",
    news: "Noticias",
    statistics: "Estadísticas",
    myProfile: "Mi perfil",
    chat: "Chat (100+)",
    blog: "Blog",
  },

  footer: {
    copyright: (year: number) => `© ${year} Minichess`,
  },

  userMenu: {
    fallbackName: "Jugador",
    account: "Cuenta",
    logOut: "Cerrar sesión",
  },

  home: {
    title: "DailyCheckmate",
    subtitle: "Elige un juego o puzzle.",
  },

  gameTiles: {
    chess:         { title: "Jugar al ajedrez",    description: "Ajedrez completo contra el motor — elige tu nivel de dificultad, desde principiante hasta experto." },
    minichess:     { title: "Mini ajedrez",         description: "Una batalla de ajedrez compacta 5x5 contra la IA. Las mismas reglas, un tablero más pequeño." },
    mateIn1:       { title: "Mate en 1",            description: "Encuentra el único movimiento que da jaque mate de inmediato." },
    mateIn2:       { title: "Mate en 2",            description: "Fuerza el jaque mate en dos movimientos contra la mejor defensa de negras." },
    mateIn3:       { title: "Mate en 3",            description: "Calcula un jaque mate forzado a tres movimientos de profundidad." },
    takes:         { title: "Capturas",             description: "Captura cada pieza del tablero en el orden correcto." },
    check:         { title: "Jaque",                description: "Da jaque mate en el mini tablero dentro del límite de movimientos." },
    smothered:     { title: "Mate ahogado",         description: "Atrapa al rey con sus propias piezas y dale mate ahogado." },
    chessSolitaire:{ title: "Solitario de ajedrez", description: "Despeja el tablero capturando una pieza tras otra." },
    solitaire:     { title: "Captura en cadena",    description: "Despeja el tablero en una única cadena de capturas ininterrumpida." },
    survival:      { title: "Supervivencia",        description: "Captura peones con tu caballo el mayor tiempo posible." },
    kingAndPawn:   { title: "Rey y peón",           description: "Promociona el peón con apoyo del rey, luego da jaque mate." },
    rookEndgame:   { title: "Final de torre",       description: "Corta al rey con la torre y da jaque mate." },
    zugzwang:      { title: "Zugzwang",             description: "Encuentra el movimiento silencioso que deja al oponente indefenso." },
    queenVsPawn:   { title: "Dama contra peón",     description: "Atrapa al peón pasado con la dama antes de que corone." },
  },

  gamePages: {
    takes:         { title: "Capturas",            subtitle: "Captura cada pieza — encuentra el orden correcto para vaciar el tablero." },
    solitaire:     { title: "Captura en cadena",   subtitle: "Vacía el tablero en una única cadena de capturas ininterrumpida." },
    check:         { title: "Jaque",               subtitle: "Da jaque mate en el mini tablero dentro del límite de movimientos." },
    smothered:     { title: "Mate ahogado",        subtitle: "Atrapa al rey con sus propias piezas y dale mate ahogado." },
    chessSolitaire:{ title: "Solitario de ajedrez",subtitle: "Captura cada pieza, un movimiento legal a la vez." },
    kingAndPawn:   { title: "Rey y peón",          subtitle: "Promociona el peón con el apoyo de tu rey, luego da jaque mate." },
    queenVsPawn:   { title: "Dama contra peón",    subtitle: "Un peón pasado está a un paso de coronar. Atrápalo con la dama." },
    rookEndgame:   { title: "Final de torre",      subtitle: "Corta al rey con la torre y avanza tu rey para dar mate." },
    zugzwang:      { title: "Zugzwang",            subtitle: "Encuentra el movimiento de espera silencioso que fuerza a negras a una respuesta perdedora, luego da mate." },
    mateIn1:       { title: "Mate en 1",           subtitle: "Encuentra el único movimiento que da jaque mate." },
    mateIn2:       { title: "Mate en 2",           subtitle: "Fuerza el jaque mate en dos movimientos contra la mejor defensa de negras." },
    mateIn3:       { title: "Mate en 3",           subtitle: "Calcula un jaque mate forzado en tres movimientos." },
  },

  howToPlay: {
    sectionTitle: "Cómo jugar",

    takes: [
      { heading: "Estudia el tablero",         body: "Todas las piezas enemigas están dispuestas en un campo 4x4. Cada pieza debe ser capturada — no puede quedar ninguna." },
      { heading: "Elige tu primera captura",   body: "Haz clic en una pieza que tu atacante pueda capturar legalmente. El atacante se mueve a esa casilla." },
      { heading: "Encadena las capturas",      body: "Tras cada captura, tu atacante debe capturar inmediatamente otra pieza. No puedes detenerte a mitad de una cadena." },
      { heading: "El orden importa",           body: "Solo un orden de capturas vaciará el tablero. Si te quedas atascado, deshaz el movimiento y prueba un camino diferente." },
    ] as HowToPlayStep[],

    solitaire: [
      { heading: "Una cadena ininterrumpida",  body: "Debes capturar cada pieza en una secuencia continua — cada captura debe seguir inmediatamente a la anterior." },
      { heading: "Elige tu pieza inicial",     body: "Haz clic en la pieza con la que deseas comenzar. Será tu atacante activo durante toda la cadena." },
      { heading: "Captura en orden",           body: "Haz clic en una pieza enemiga que tu atacante pueda capturar legalmente. El atacante salta a esa casilla y se convierte en el nuevo atacante." },
      { heading: "Vacía el tablero",           body: "Continúa hasta que todas las piezas hayan sido capturadas. Si llegas a un callejón sin salida, deshaz e intenta con una pieza de inicio diferente." },
    ] as HowToPlayStep[],

    check: [
      { heading: "Mini tablero de ajedrez",    body: "El juego se disputa en un tablero compacto 4x4 con un conjunto reducido de piezas. Se aplican las reglas normales del ajedrez." },
      { heading: "Juegas con blancas",         body: "Las blancas mueven primero. Tu objetivo es dar jaque mate — poner al rey negro en jaque sin posibilidad de escape." },
      { heading: "Respeta el límite de movimientos", body: "Cada puzzle tiene un límite de movimientos. El jaque mate debe lograrse dentro de los movimientos permitidos o el puzzle se considera fallido." },
      { heading: "Piensa con antelación",      body: "Con menos casillas, cada movimiento cuenta. Busca jaques que corten las vías de escape del rey antes de rodearlo." },
    ] as HowToPlayStep[],

    smothered: [
      { heading: "¿Qué es el mate ahogado?",  body: "El mate ahogado ocurre cuando un caballo da jaque mate al rey completamente rodeado por sus propias piezas sin casilla de escape." },
      { heading: "El caballo es clave",        body: "Solo un caballo puede dar mate ahogado, ya que puede saltar sobre piezas. Posiciona el caballo para dar jaque mientras las propias piezas del rey bloquean toda salida." },
      { heading: "Acorrala al rey",            body: "Empuja al rey negro hacia una esquina o el borde, donde sus propias piezas lo asfixien sin dejarle escapatoria." },
      { heading: "Da jaque con el caballo",    body: "Una vez que el rey esté rodeado por sus propias piezas, lleva el caballo a la casilla de mate. El rey no tiene a donde ir." },
    ] as HowToPlayStep[],

    chessSolitaire: [
      { heading: "Reglas completas, tablero completo", body: "El solitario de ajedrez usa un tablero 8x8 con piezas que se mueven según las reglas normales del ajedrez, incluidos los peones con su dirección." },
      { heading: "Cualquier pieza para empezar", body: "Haz clic en una pieza para convertirla en tu atacante activo. Debe capturar inmediatamente una pieza enemiga para comenzar la cadena." },
      { heading: "Mantén la cadena",           body: "Tras cada captura, la pieza que captura debe capturar otra pieza enemiga. No puedes pasar ni cambiar de atacante." },
      { heading: "No dejes ninguna pieza",     body: "Cada pieza enemiga debe ser capturada antes de que termine la cadena. Algunos puntos de inicio llevan a callejones sin salida — si te atascas, deshaz e intenta con otra." },
    ] as HowToPlayStep[],

    kingAndPawn: [
      { heading: "El rey apoya al peón",       body: "Tu rey blanco y un peón solitario se enfrentan al rey negro solo. El peón no puede coronar con seguridad sin que el rey abra camino." },
      { heading: "Usa la oposición",           body: "Coloca tu rey directamente frente al rey negro para ganar la oposición y empujarlo hacia atrás o hacia un lado." },
      { heading: "Avanza el peón con seguridad", body: "Una vez que el rey negro esté cortado, avanza el peón. Nunca lo lleves a una casilla donde pueda ser capturado o bloqueado." },
      { heading: "Corona y da jaque mate",     body: "Promociona el peón a dama, luego da jaque mate con dama y rey lo antes posible." },
    ] as HowToPlayStep[],

    queenVsPawn: [
      { heading: "Para al peón",               body: "Un peón pasado negro corre hacia la coronación. Tu dama blanca debe interceptarlo antes de que llegue a la última fila." },
      { heading: "Mueves primero",             body: "Las blancas siempre mueven primero. Usa el alcance de la dama para cruzar el camino del peón de inmediato." },
      { heading: "Vigila al rey negro",        body: "El rey negro podría estar escoltando al peón. No muevas la dama a una casilla desde la que pueda ser ahuyentada." },
      { heading: "Captura en 2 movimientos",   body: "Cada puzzle requiere que la dama gane el peón en 2 movimientos. Si el peón corona, el puzzle se considera fallido." },
    ] as HowToPlayStep[],

    rookEndgame: [
      { heading: "Rey y torre contra rey",     body: "Tienes rey y torre contra el rey negro solo. Este es un final básico que todo ajedrecista debe dominar." },
      { heading: "Corta al rey con la torre",  body: "Usa la torre para confinar al rey negro a un área cada vez más pequeña del tablero, empujándolo al borde o a una esquina." },
      { heading: "Acerca tu rey",              body: "La torre sola no puede dar mate. Coordina tu rey para acercarlo y encajonar al rey negro." },
      { heading: "Da mate en la última fila",  body: "Una vez que el rey negro esté atrapado en una fila o columna, coloca la torre en esa fila o columna mientras tu rey da apoyo." },
    ] as HowToPlayStep[],

    zugzwang: [
      { heading: "¿Qué es el zugzwang?",      body: "El zugzwang es una situación en la que cualquier movimiento del oponente empeora su posición. La obligación de mover es la desventaja." },
      { heading: "Encuentra el movimiento silencioso", body: "El movimiento clave no es un jaque ni una captura — es un sutil movimiento de espera que pone a negras en zugzwang sin buena respuesta." },
      { heading: "Negras se ve obligada a cooperar", body: "Sea lo que sea que juegue negras tras tu movimiento silencioso, conduce a una posición perdedora. Cualquier respuesta legal permite jaque mate inmediato." },
      { heading: "Da jaque mate",              body: "Tras la respuesta forzada de negras, tienes un mate forzado claro. Ejecútalo — el puzzle no se completa hasta que se dé el mate." },
    ] as HowToPlayStep[],

    mateIn1: [
      { heading: "Un movimiento gana",         body: "Hay exactamente un movimiento que da jaque mate. El puzzle se completa en cuanto se juega ese movimiento." },
      { heading: "Busca jaques primero",       body: "El jaque mate debe dar jaque al rey sin posibilidad de escape. Comprueba cada jaque disponible: ¿puede el rey moverse, cubrir o capturar?" },
      { heading: "Elimina las casillas de escape", body: "Un movimiento de mate deja al rey sin movimientos legales. Asegúrate de que tu pieza dé jaque y de que todas las casillas de escape estén controladas." },
      { heading: "Juegas con blancas",         body: "Las blancas siempre mueven primero. Negras no tiene respuesta — si tu movimiento da jaque mate, ganas de inmediato." },
    ] as HowToPlayStep[],

    mateIn2: [
      { heading: "Mate forzado en 2",          body: "Blancas hacen un movimiento, negras responde lo mejor que puede, luego blancas dan jaque mate. La solución debe funcionar contra cualquier respuesta de negras." },
      { heading: "Encuentra el movimiento clave", body: "El primer movimiento establece una amenaza de mate imparable. Puede ser un jaque, un movimiento silencioso o incluso un sacrificio." },
      { heading: "Considera todas las respuestas de negras", body: "Tras tu movimiento clave, negras intentará retrasarlo o escapar. Tu segundo movimiento debe dar jaque mate independientemente de la respuesta de negras." },
      { heading: "Juegas con blancas",         body: "Las blancas mueven primero. Tras tu movimiento, negras responde una vez y luego debes dar mate. El puzzle falla si no se da mate en el 2o movimiento." },
    ] as HowToPlayStep[],

    mateIn3: [
      { heading: "Mate forzado en 3",          body: "Blancas hace tres movimientos y negras dos. La solución debe forzar jaque mate en el 3er movimiento independientemente de la mejor defensa de negras." },
      { heading: "Empieza con el movimiento clave", body: "El primer movimiento crea una amenaza que negras no puede neutralizar por completo — a menudo mejorando una pieza, abriendo una línea o construyendo una red de mate." },
      { heading: "Lee las defensas de negras", body: "Tras cada movimiento blanco, considera cada respuesta de negras. Tu plan debe tenerlas todas en cuenta y aun así dar mate en el 3er movimiento." },
      { heading: "Calcula, no adivines",       body: "El mate en 3 requiere cálculo preciso. Trabaja las variantes principales metódicamente — un solo error deja escapar a negras." },
    ] as HowToPlayStep[],
  },

  blog: {
    title: "Blog",
    subtitle: "Consejos de ajedrez, guías de puzzles y novedades.",
    backToAll: "Todos los artículos",
    emptyHeading: "Todavía no hay artículos.",
    emptyBody: "Vuelve pronto para encontrar consejos de ajedrez, guías de puzzles y actualizaciones.",
  },
};

export default es;
