import type { HowToPlayStep } from "@/app/components/HowToPlay";

const en = {
  // ── Site ──────────────────────────────────────────────────────────────────
  siteName: "DailyCheckmate",
  siteDescription: "Play chess puzzles and mini games online",

  // ── Nav ───────────────────────────────────────────────────────────────────
  nav: {
    menu: "Menu",
    close: "✕",
    signUp: "Sign up",
    logIn: "Log in",
    switchToLight: "Switch to light mode",
    switchToDark: "Switch to dark mode",
    language: "🇺🇸 English ▾",
  },

  // ── Sidebar ───────────────────────────────────────────────────────────────
  sidebar: {
    playChess: "Play Chess",
    miniChess: "Mini Chess",
    takes: "Takes",
    check: "Check",
    smothered: "Smothered",
    chessSolitaire: "Chess Solitaire",
    chainCapture: "Chain Capture",
    survival: "Survival",
    mateIn1: "Mate in 1",
    mateIn2: "Mate in 2",
    mateIn3: "Mate in 3",
    endgamePuzzles: "Endgame Puzzles",
    kingAndPawn: "King and Pawn",
    rookEndgame: "Rook Endgame",
    zugzwang: "Zugzwang",
    queenVsPawn: "Queen vs Pawn",
    leaderboard: "Leaderboard",
    seasonLeaders: "Season leaders",
    quests: "Quests (0)",
    arena: "Arena",
    equipment: "Equipment",
    marketplace: "Marketplace",
    events: "Events",
    championship: "Championship",
    playersOnline: "Players online (1430)",
    news: "News",
    statistics: "Statistics",
    myProfile: "My profile",
    chat: "Chat (100+)",
  },

  // ── Footer ────────────────────────────────────────────────────────────────
  footer: {
    copyright: (year: number) => `© ${year} Minichess`,
  },

  // ── User menu ─────────────────────────────────────────────────────────────
  userMenu: {
    fallbackName: "Player",
    account: "Account",
    logOut: "Log out",
  },

  // ── Home page ─────────────────────────────────────────────────────────────
  home: {
    title: "DailyCheckmate",
    subtitle: "Pick a game or puzzle to play.",
  },

  // ── Game tiles (home page grid) ───────────────────────────────────────────
  gameTiles: {
    chess:         { title: "Play Chess",      description: "Full chess against the engine — choose your difficulty, from beginner to expert." },
    minichess:     { title: "Mini Chess",      description: "A compact 5×5 chess battle against the AI. Same rules, smaller board." },
    mateIn1:       { title: "Mate in 1",       description: "Spot the single move that delivers immediate checkmate." },
    mateIn2:       { title: "Mate in 2",       description: "Force checkmate in two moves against Black's best defense." },
    mateIn3:       { title: "Mate in 3",       description: "Calculate a forced checkmate three moves deep." },
    takes:         { title: "Takes",           description: "Capture every piece on the board in the correct order." },
    check:         { title: "Check",           description: "Deliver checkmate on the mini board within the move limit." },
    smothered:     { title: "Smothered",       description: "Trap the king with its own pieces and land a smothered mate." },
    chessSolitaire:{ title: "Chess Solitaire", description: "Clear the board, capturing one piece at a time." },
    solitaire:     { title: "Chain Capture",   description: "Wipe the board in a single unbroken chain of captures." },
    survival:      { title: "Survival",        description: "Capture pawns with your knight for as long as you can." },
    kingAndPawn:   { title: "King and Pawn",   description: "Promote the pawn with your king's support, then checkmate." },
    rookEndgame:   { title: "Rook Endgame",    description: "Cut off the king with the rook and deliver mate." },
    zugzwang:      { title: "Zugzwang",        description: "Find the quiet move that leaves your opponent helpless." },
    queenVsPawn:   { title: "Queen vs Pawn",   description: "Catch the passed pawn with your queen before it promotes." },
  },

  // ── Game page headers ─────────────────────────────────────────────────────
  gamePages: {
    takes:         { title: "Takes",           subtitle: "Capture every piece — find the right order to clear the board." },
    solitaire:     { title: "Chain Capture",   subtitle: "Clear the board in one unbroken chain of captures." },
    check:         { title: "Check",           subtitle: "Deliver checkmate on the mini board within the move limit." },
    smothered:     { title: "Smothered",       subtitle: "Trap the king with its own pieces and deliver a smothered mate." },
    chessSolitaire:{ title: "Chess Solitaire", subtitle: "Capture every piece, one legal move at a time." },
    kingAndPawn:   { title: "King and Pawn",   subtitle: "Promote the pawn with your king’s support, then deliver checkmate." },
    queenVsPawn:   { title: "Queen vs Pawn",   subtitle: "A passed pawn is one step from queening. Catch it with the queen before it promotes." },
    rookEndgame:   { title: "Rook Endgame",    subtitle: "Cut off the king with the rook and bring your king up to deliver mate." },
    zugzwang:      { title: "Zugzwang",        subtitle: "Find the quiet waiting move that forces Black into a losing reply, then mate." },
    mateIn1:       { title: "Mate in 1",       subtitle: "Find the single move that delivers checkmate." },
    mateIn2:       { title: "Mate in 2",       subtitle: "Force checkmate in two moves against Black’s best defense." },
    mateIn3:       { title: "Mate in 3",       subtitle: "Calculate a forced checkmate in three moves." },
  },

  // ── How to Play ───────────────────────────────────────────────────────────
  howToPlay: {
    sectionTitle: "How to Play",

    takes: [
      { heading: "Study the board",      body: "All enemy pieces are laid out on a 4×4 grid. Every piece must be captured — none can be left standing." },
      { heading: "Pick your first capture", body: "Click any piece that can be legally captured by your attacker. The attacker moves to that square." },
      { heading: "Chain your captures",  body: "After each capture your attacker must immediately take another piece. You cannot stop mid-chain." },
      { heading: "Order matters",        body: "One specific capture order clears the board. If you get stuck, undo and try a different sequence." },
    ] as HowToPlayStep[],

    solitaire: [
      { heading: "One unbroken chain",   body: "You must capture every piece in a single continuous sequence — each capture must follow immediately from the last." },
      { heading: "Select a piece to start", body: "Click the piece you want to begin with. It becomes your active attacker for the entire chain." },
      { heading: "Capture in order",     body: "Click an enemy piece your attacker can legally take. The attacker jumps to that square and becomes the next attacker." },
      { heading: "Clear the board",      body: "Continue until every piece has been captured. If you reach a dead end, undo and try starting from a different piece." },
    ] as HowToPlayStep[],

    check: [
      { heading: "Mini chess board",     body: "The game is played on a compact 4×4 board with a reduced set of pieces. Standard chess movement rules apply." },
      { heading: "You play White",       body: "White moves first. Your goal is to deliver checkmate — put the Black king in check with no escape." },
      { heading: "Watch the move counter", body: "Each puzzle has a move limit. Checkmate must be delivered within the allowed number of moves or the puzzle is failed." },
      { heading: "Think ahead",          body: "With fewer squares available, every move counts. Look for checks that cut off the king’s escape routes before closing in." },
    ] as HowToPlayStep[],

    smothered: [
      { heading: "What is a smothered mate?", body: "A smothered mate occurs when a knight delivers checkmate to a king completely surrounded by its own pieces with no escape square." },
      { heading: "The knight is key",    body: "Only a knight can deliver smothered mate because it jumps over pieces. Position your knight to give check while the king’s own pieces block every exit." },
      { heading: "Force the king to the edge", body: "Drive the Black king toward a corner or edge where its own pieces will crowd it in and leave it no room to escape." },
      { heading: "Deliver the knight check", body: "Once the king is surrounded by its own pieces, land the knight on the mating square. The king has nowhere to run." },
    ] as HowToPlayStep[],

    chessSolitaire: [
      { heading: "Full chess rules, full board", body: "Chess Solitaire uses an 8×8 board with pieces moving by standard chess rules, including directional pawns." },
      { heading: "Pick any piece to start", body: "Click a piece to make it your active attacker. It must immediately capture an enemy piece to begin the chain." },
      { heading: "Keep the chain alive", body: "After each capture, the piece that just captured must take another enemy piece. You cannot pass or switch attackers mid-chain." },
      { heading: "Leave no piece standing", body: "Every enemy piece must be captured before the chain ends. Some starting pieces lead to dead ends — if stuck, undo and try another." },
    ] as HowToPlayStep[],

    kingAndPawn: [
      { heading: "King supports the pawn", body: "Your White king and a single pawn face the lone Black king. The pawn cannot promote safely without the king leading the way." },
      { heading: "Use the opposition",   body: "Place your king directly opposite the Black king to seize the opposition and force it backward or to the side." },
      { heading: "Advance the pawn safely", body: "Once the Black king is cut off, push the pawn. Never advance it to a square where it can be captured or blocked." },
      { heading: "Promote and checkmate", body: "Promote the pawn to a queen, then use the queen and king together to deliver checkmate in as few moves as possible." },
    ] as HowToPlayStep[],

    queenVsPawn: [
      { heading: "Stop the pawn",        body: "A Black passed pawn is racing toward promotion. Your White queen must capture it before it reaches the back rank." },
      { heading: "You move first",       body: "White always moves first. Use the queen’s long-range power to intercept the pawn’s path immediately." },
      { heading: "Watch for the Black king", body: "The Black king may be escorting the pawn. Don’t walk the queen into a square where it can be chased away." },
      { heading: "Capture within 2 moves", body: "Each puzzle requires the queen to win the pawn within 2 moves. If the pawn promotes, the puzzle is failed." },
    ] as HowToPlayStep[],

    rookEndgame: [
      { heading: "King and rook vs lone king", body: "You have a king and rook against the bare Black king. This is a fundamental endgame every chess player must master." },
      { heading: "Cut off the king with the rook", body: "Use the rook to restrict the Black king to an ever-smaller area of the board, pushing it toward an edge or corner." },
      { heading: "Bring your king in",   body: "The rook alone cannot deliver checkmate. Coordinate your king to approach and help box in the Black king." },
      { heading: "Deliver the back-rank mate", body: "Once the Black king is trapped on a rank or file, place the rook on that rank or file with your king providing support." },
    ] as HowToPlayStep[],

    zugzwang: [
      { heading: "What is zugzwang?",    body: "Zugzwang is a situation where any move the opponent makes worsens their position. Being forced to move is the disadvantage." },
      { heading: "Find the quiet move",  body: "The key move is not a check or a capture — it is a subtle waiting move that puts Black in zugzwang with no good reply." },
      { heading: "Black is forced to cooperate", body: "Whatever Black plays after your quiet move walks into a losing position. Every legal reply allows immediate checkmate." },
      { heading: "Deliver checkmate",    body: "After Black’s forced response, you have a clean forced mate. Follow through — the puzzle is complete only once mate is delivered." },
    ] as HowToPlayStep[],

    mateIn1: [
      { heading: "One move wins",        body: "There is exactly one move that delivers checkmate. The puzzle is complete the moment that move is played." },
      { heading: "Look for checks first", body: "Checkmate must put the king in check with no escape. Scan every available check and ask: can the king move, block, or capture?" },
      { heading: "Eliminate escape squares", body: "A mating move leaves the king with zero legal moves. Make sure your piece gives check and every escape square is covered." },
      { heading: "You play White",       body: "White always moves first. Black has no response — if your move is checkmate, you win immediately." },
    ] as HowToPlayStep[],

    mateIn2: [
      { heading: "Two-move forced mate", body: "White plays a move, Black plays their best reply, then White delivers checkmate. The solution must work against every Black response." },
      { heading: "Find the key first move", body: "The first move sets up an unstoppable mating threat. It may be a check, a quiet move, or even a sacrifice." },
      { heading: "Consider all of Black’s replies", body: "After your key move, Black will try to delay or escape. Your second move must deliver checkmate regardless of what Black plays." },
      { heading: "You play White",       body: "White moves first. After your move, Black responds once, then you must checkmate. The puzzle fails if mate is not delivered on move 2." },
    ] as HowToPlayStep[],

    mateIn3: [
      { heading: "Three-move forced mate", body: "White plays three moves and Black plays two. The solution must force checkmate on move 3 regardless of Black’s best defense." },
      { heading: "Start with the key move", body: "The first move creates a threat Black cannot fully neutralise — often improving a piece, opening a line, or setting up a mating net." },
      { heading: "Read Black’s defenses", body: "After each White move, consider every Black reply. Your plan must account for all of them and still deliver checkmate on move 3." },
      { heading: "Calculate, don’t guess", body: "Mate in 3 requires accurate calculation. Work through the main lines methodically — a single oversight lets Black escape." },
    ] as HowToPlayStep[],
  },
};

export default en;
