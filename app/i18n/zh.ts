import type { HowToPlayStep } from "@/app/components/HowToPlay";

const zh = {
  siteName: "DailyCheckmate",
  siteDescription: "在线玩国际象棋谜题和小游戏",

  nav: {
    menu: "菜单",
    close: "✕",
    signUp: "注册",
    logIn: "登录",
    switchToLight: "切换到浅色模式",
    switchToDark: "切换到深色模式",
    language: "🇨🇳 中文 ▾",
  },

  sidebar: {
    playChess: "下棋",
    miniChess: "迷你象棋",
    takes: "吃子",
    check: "将军",
    smothered: "窒息将死",
    chessSolitaire: "象棋接龙",
    chainCapture: "连续吃子",
    survival: "生存模式",
    mateIn1: "一步将死",
    mateIn2: "两步将死",
    mateIn3: "三步将死",
    endgamePuzzles: "残局谜题",
    kingAndPawn: "王与兵",
    rookEndgame: "车残局",
    zugzwang: "迫走困境",
    queenVsPawn: "后对兵",
    leaderboard: "排行榜",
    seasonLeaders: "赛季领先者",
    quests: "任务 (0)",
    arena: "竞技场",
    equipment: "装备",
    marketplace: "市场",
    events: "赛事",
    championship: "锦标赛",
    playersOnline: "在线玩家 (1430)",
    news: "新闻",
    statistics: "统计",
    myProfile: "我的主页",
    chat: "聊天 (100+)",
    blog: "博客",
  },

  footer: {
    copyright: (year: number) => `© ${year} Minichess`,
    privacy: "隐私政策",
  },

  userMenu: {
    fallbackName: "玩家",
    account: "账户",
    logOut: "退出登录",
  },

  home: {
    title: "DailyCheckmate",
    subtitle: "选择一个游戏或谜题。",
  },

  gameTiles: {
    chess:         { title: "下棋",          description: "对抗引擎的完整国际象棋——从初学者到专家，选择你的难度等级。" },
    minichess:     { title: "迷你象棋",       description: "在5×5棋盘上与AI进行紧凑的象棋对弈。规则相同，棋盘更小。" },
    mateIn1:       { title: "一步将死",       description: "找到那唯一能立即将死的棋步。" },
    mateIn2:       { title: "两步将死",       description: "应对黑方最佳防御，在两步内强制将死。" },
    mateIn3:       { title: "三步将死",       description: "计算三步深度的强制将死。" },
    takes:         { title: "吃子",           description: "按正确顺序吃掉棋盘上的每一枚棋子。" },
    check:         { title: "将军",           description: "在步数限制内在迷你棋盘上将死对方。" },
    smothered:     { title: "窒息将死",       description: "用对方自己的棋子围困国王，然后将死。" },
    chessSolitaire:{ title: "象棋接龙",       description: "一次吃一枚棋子，清空棋盘。" },
    solitaire:     { title: "连续吃子",       description: "用一条连续不断的吃子链清空棋盘。" },
    survival:      { title: "生存模式",       description: "用你的马尽可能长时间地吃掉兵。" },
    kingAndPawn:   { title: "王与兵",         description: "在王的配合下将兵升变，然后将死。" },
    rookEndgame:   { title: "车残局",         description: "用车切断国王，然后将死。" },
    zugzwang:      { title: "迫走困境",       description: "找到那步无声的棋，让对手陷入无计可施的困境。" },
    queenVsPawn:   { title: "后对兵",         description: "在过路兵升变前用后将其捕获。" },
  },

  gamePages: {
    takes:         { title: "吃子",          subtitle: "吃掉每一枚棋子——找到清空棋盘的正确顺序。" },
    solitaire:     { title: "连续吃子",       subtitle: "用一条连续不断的吃子链清空棋盘。" },
    check:         { title: "将军",           subtitle: "在步数限制内在迷你棋盘上将死对方。" },
    smothered:     { title: "窒息将死",       subtitle: "用对方自己的棋子围困国王，然后将死。" },
    chessSolitaire:{ title: "象棋接龙",       subtitle: "每次走一步合法棋，吃掉每一枚棋子。" },
    kingAndPawn:   { title: "王与兵",         subtitle: "在你的王的配合下将兵升变，然后将死。" },
    queenVsPawn:   { title: "后对兵",         subtitle: "一枚过路兵即将升变。用后将其截获。" },
    rookEndgame:   { title: "车残局",         subtitle: "用车切断国王，推进你的王将死对方。" },
    zugzwang:      { title: "迫走困境",       subtitle: "找到那步无声的等待棋，迫使黑方走出败招，然后将死。" },
    mateIn1:       { title: "一步将死",       subtitle: "找到那唯一能将死对方的棋步。" },
    mateIn2:       { title: "两步将死",       subtitle: "应对黑方最佳防御，在两步内强制将死。" },
    mateIn3:       { title: "三步将死",       subtitle: "计算三步内的强制将死。" },
  },

  howToPlay: {
    sectionTitle: "游戏说明",

    takes: [
      { heading: "研究棋盘",         body: "所有敌方棋子排列在4×4范围内。每枚棋子都必须被吃掉——不能有任何遗漏。" },
      { heading: "选择第一步吃子",   body: "点击你的进攻棋子可以合法吃掉的那枚棋子。进攻方移动到那个格子。" },
      { heading: "连续吃子",         body: "每次吃子后，你的进攻方必须立即再吃一枚棋子。不能在链条中途停下。" },
      { heading: "顺序很重要",       body: "只有特定的吃子顺序才能清空棋盘。如果陷入僵局，撤销棋步并尝试不同路径。" },
    ] as HowToPlayStep[],

    solitaire: [
      { heading: "一条连续不断的链",  body: "你必须用一个连续的序列吃掉每一枚棋子——每次吃子必须紧接在上一次之后。" },
      { heading: "选择起始棋子",      body: "点击你想开始的棋子。它将成为整条链的活跃进攻方。" },
      { heading: "按顺序吃子",        body: "点击你的进攻方可以合法吃掉的敌方棋子。进攻方跳到那个格子，成为下一个进攻方。" },
      { heading: "清空棋盘",          body: "继续直到每枚棋子都被吃掉。如果遇到死路，撤销并从不同棋子开始。" },
    ] as HowToPlayStep[],

    check: [
      { heading: "迷你象棋棋盘",     body: "游戏在紧凑的4×4棋盘上进行，棋子数量减少。遵循正常国际象棋规则。" },
      { heading: "你执白棋",         body: "白方先走。你的目标是将死对方——让黑方国王处于被将的状态，且无处可逃。" },
      { heading: "注意步数限制",     body: "每道谜题都有步数限制。必须在允许的步数内实现将死，否则谜题视为失败。" },
      { heading: "提前谋划",         body: "格子更少，每步棋都至关重要。在包围国王之前，寻找能切断其逃路的将军路线。" },
    ] as HowToPlayStep[],

    smothered: [
      { heading: "什么是窒息将死？", body: "窒息将死发生在马将死国王，而国王被自己的棋子完全包围、无处可逃时。" },
      { heading: "马是关键",         body: "只有马能实现窒息将死，因为它能越过棋子移动。将马定位在可以将军的格子，同时国王自己的棋子封堵所有出口。" },
      { heading: "将国王逼至边角",   body: "将黑方国王推向角落或边缘，在那里它自己的棋子会将其窒息，不留任何逃路。" },
      { heading: "用马将军",         body: "一旦国王被自己的棋子包围，将马移动到将死格子。国王无处可逃。" },
    ] as HowToPlayStep[],

    chessSolitaire: [
      { heading: "完整规则，完整棋盘", body: "象棋接龙使用8×8棋盘，棋子按正常国际象棋规则移动，包括有方向的兵。" },
      { heading: "任选棋子开始",     body: "点击一枚棋子将其设为活跃进攻方。它必须立即吃一枚敌方棋子才能开始链条。" },
      { heading: "保持链条",         body: "每次吃子后，吃子的棋子必须再吃一枚敌方棋子。不能跳过或更换进攻方。" },
      { heading: "不留任何棋子",     body: "链条结束前必须吃掉每一枚敌方棋子。某些起点会导致死局——陷入僵局时撤销并换一枚棋子。" },
    ] as HowToPlayStep[],

    kingAndPawn: [
      { heading: "王护送兵",         body: "你的白方国王和一枚孤兵对抗孤立的黑方国王。没有王开路，兵无法安全升变。" },
      { heading: "运用对立",         body: "将你的王直接面对黑方国王以获得对立优势，迫使其后退或侧移。" },
      { heading: "安全推进兵",       body: "一旦黑方国王被切断，推进兵。绝不把兵走到可能被吃掉或阻挡的格子。" },
      { heading: "升变后将死",       body: "将兵升变为后，然后尽快用后和王将死对方。" },
    ] as HowToPlayStep[],

    queenVsPawn: [
      { heading: "阻止兵升变",       body: "一枚黑方过路兵正奔向升变。你的白方后必须在它到达最后一排之前截获它。" },
      { heading: "你先走",           body: "白方总是先走。用后的大范围移动能力立即横截兵的前进路线。" },
      { heading: "注意黑方国王",     body: "黑方国王可能在护送那枚兵。不要把后走到可能被驱逐的格子。" },
      { heading: "两步内吃掉兵",     body: "每道谜题要求后在2步内赢得那枚兵。如果兵升变，谜题视为失败。" },
    ] as HowToPlayStep[],

    rookEndgame: [
      { heading: "王和车对王",       body: "你有王和车对抗孤立的黑方国王。这是每位棋手必须掌握的基本残局。" },
      { heading: "用车切断国王",     body: "用车将黑方国王限制在棋盘上越来越小的区域，将其逼向边缘或角落。" },
      { heading: "推进你的王",       body: "车单独无法将死。协调你的王靠近，将黑方国王困住。" },
      { heading: "在边线将死",       body: "一旦黑方国王被困在某一行或列，在你的王支援的情况下将车移到那一行或列。" },
    ] as HowToPlayStep[],

    zugzwang: [
      { heading: "什么是迫走困境？", body: "迫走困境是一种局面，对手的每一步棋都会恶化自身处境。被迫走棋本身就是一种不利。" },
      { heading: "找到那步无声的棋", body: "关键棋步既非将军也非吃子——而是一步微妙的等待棋，将黑方置于迫走困境，令其无好棋可走。" },
      { heading: "黑方被迫配合",     body: "你走出那步无声的棋后，无论黑方走什么都会导致败势。任何合法应对都允许立即将死。" },
      { heading: "将死对方",         body: "黑方被迫走棋后，你有明确的强制将死。执行它——谜题直到实现将死才算完成。" },
    ] as HowToPlayStep[],

    mateIn1: [
      { heading: "一步制胜",         body: "有且仅有一步棋能将死对方。那步棋一旦走出，谜题即告完成。" },
      { heading: "先寻找将军",       body: "将死必须对国王形成将军且无处可逃。检查每个可用的将军：国王能移动、阻挡还是吃掉将军棋子？" },
      { heading: "消除逃跑格",       body: "将死棋步让国王零合法走法。确保你的棋子形成将军，并且所有逃跑格都被控制。" },
      { heading: "你执白棋",         body: "白方总是先走。黑方无法应对——如果你的棋步造成将死，你立即获胜。" },
    ] as HowToPlayStep[],

    mateIn2: [
      { heading: "两步强制将死",     body: "白方走一步，黑方尽力应对，然后白方将死。解法必须应对黑方的任何回应有效。" },
      { heading: "找到关键棋步",     body: "第一步建立一个无法阻挡的将死威胁。可以是将军、无声棋步甚至弃子。" },
      { heading: "考虑黑方所有回应", body: "你走出关键棋步后，黑方会试图拖延或逃脱。无论黑方如何应对，你的第二步都必须将死。" },
      { heading: "你执白棋",         body: "白方先走。你走棋后黑方应对一次，然后你必须将死。如果第2步未能将死，谜题失败。" },
    ] as HowToPlayStep[],

    mateIn3: [
      { heading: "三步强制将死",     body: "白方走三步，黑方走两步。无论黑方最佳防守如何，解法都必须在第3步强制将死。" },
      { heading: "从关键棋步开始",   body: "第一步制造一个黑方无法完全化解的威胁——通常是改善一枚棋子的位置、打开线路或构建将死网络。" },
      { heading: "读懂黑方防守",     body: "每次白方走棋后，考虑黑方的每个应对。你的计划必须涵盖所有情况，并仍在第3步实现将死。" },
      { heading: "计算而非猜测",     body: "三步将死需要精确计算。系统地研究主要变化——一个错误就会让黑方逃脱。" },
    ] as HowToPlayStep[],
  },

  blog: {
    title: "博客",
    subtitle: "国际象棋技巧、谜题指南和最新动态。",
    backToAll: "所有文章",
    emptyHeading: "暂无文章。",
    emptyBody: "敬请期待尽快带来的象棋技巧、谜题指南和更新。",
  },
};

export default zh;
