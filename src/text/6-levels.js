// ===== Text v7: levels, infrastructure, wider trade routes, medals, the mentor =====
// Every string here exists in both languages. Arabic is plain Modern Standard Arabic.

const LEVEL_TITLE = [
  { en:'New president', ar:'رئيس جديد' },
  { en:'Builder', ar:'باني' },
  { en:'Decision maker', ar:'صاحب قرار' },
  { en:'Road builder', ar:'باني الطرق' },
  { en:'Trader', ar:'تاجر' },
  { en:'Negotiator', ar:'مفاوض' },
  { en:'Industrialist', ar:'صاحب صناعة' },
  { en:'Statesman', ar:'رجل دولة' },
  { en:'Reformer', ar:'مُصلِح' },
  { en:'Nation builder', ar:'باني أمّة' },
  { en:'Veteran president', ar:'رئيس مخضرم' },
  { en:'Legend', ar:'أسطورة' },
];

// The seven things a country runs on. Each one has levels, and each level costs more than the last.
const INFRA_TXT = {
  grid:{ icon:'⚡', en:['Power stations and the grid','Turbines, transformers and cables. This is the one thing almost everything else waits for: workshops, pumps, hospitals, homework.','Every level adds about 430 MW — hours of electricity in every province.'],
    ar:['محطات الكهرباء والشبكة','عنفات ومحوّلات وكابلات. هذا ما ينتظره كل شيء آخر تقريباً: الورشات والمضخّات والمشافي والدراسة.','كل مستوى يضيف نحو 430 ميغاواط — ساعات كهرباء في كل محافظة.'] },
  water:{ icon:'🚰', en:['Water and sewage','Pumps, pipes and treatment plants. Clean water is the cheapest health system there is, and a town with water in the taps stops shouting.','Health rises and anger falls in every province. Cholera stops coming back.'],
    ar:['المياه والصرف الصحي','مضخّات وأنابيب ومحطات معالجة. الماء النظيف أرخص نظام صحي موجود، والبلدة التي يجري الماء في صنابيرها تكفّ عن الصراخ.','الصحة ترتفع والغضب ينزل في كل محافظة. والكوليرا تتوقف عن العودة.'] },
  housing:{ icon:'🏘️', en:['Housing and clearing rubble','Whole districts are still rubble. Clear it, rebuild it, and hand the keys back to the families who came home to nothing.','Repairs war damage every month by itself, and calms every province.'],
    ar:['الإسكان وإزالة الأنقاض','أحياء كاملة ما زالت أنقاضاً. أزِلها وأعِد بناءها وأعِد المفاتيح للعائلات التي رجعت إلى لا شيء.','يُصلح دمار الحرب كل شهر من تلقاء نفسه، ويهدّئ كل محافظة.'] },
  roads:{ icon:'🛣️', en:['Roads and bridges','Anything you grow or make is worth nothing until it can reach a buyer. And the people who lay the roads are people with work.','More room to export, and fewer people without a job everywhere.'],
    ar:['الطرق والجسور','كل ما تزرعه أو تصنعه لا قيمة له حتى يصل إلى مشترٍ. ومن يعبّد الطرق هم أناس لديهم عمل.','قدرة تصدير أكبر، وعدد أقل من العاطلين في كل مكان.'] },
  egov:{ icon:'🖥️', en:['Digital government','One file per citizen, one tax number, one queue that actually moves. Harder to steal from, easier to pay into.','More people pay tax, and corruption falls.'],
    ar:['الحكومة الرقمية','ملف واحد لكل مواطن، ورقم ضريبي واحد، ودور واحد يتقدّم فعلاً. أصعب على السرقة، وأسهل على الدفع.','عدد أكبر ممن يدفعون الضريبة، وفساد أقل.'] },
  rail:{ icon:'🚂', en:['Railways','Expensive, and slow to lay. Then phosphate, cement and wheat move by the thousand tonnes instead of by truck, and cost less to move.','A lot more room to export, and what you sell is worth a little more.'],
    ar:['السكك الحديدية','مكلفة، وبطيئة المدّ. ثم ينتقل الفوسفات والإسمنت والقمح بآلاف الأطنان بدل الشاحنات، وبكلفة أقل.','قدرة تصدير أكبر بكثير، وما تبيعه يساوي أكثر قليلاً.'] },
  air:{ icon:'✈️', en:['Airports','Visitors, air cargo, and the diaspora coming home for the summer with money in their pockets. Dollars that arrive without a ship.','Tourism earns more, and more money comes home from abroad.'],
    ar:['المطارات','زوّار وشحن جوي ومغتربون يعودون في الصيف ومعهم مال. دولارات تصل بلا سفينة.','السياحة تكسب أكثر، ومال أكبر يعود من الخارج.'] },
};

const MEDAL_TXT = {
  firstProject:{ icon:'🏗️', en:'Your first project', ar:'أول مشروع لك' },
  fiveProjects:{ icon:'🧱', en:'Five provinces rebuilt', ar:'خمس محافظات أُعيد بناؤها' },
  allProjects:{ icon:'🗺️', en:'Every province rebuilt', ar:'كل محافظة أُعيد بناؤها' },
  firstFactory:{ icon:'🏭', en:'Your first factory', ar:'أول مصنع لك' },
  tenFactories:{ icon:'⚙️', en:'Ten factories running', ar:'عشرة مصانع تعمل' },
  lights12:{ icon:'💡', en:'12 hours of electricity', ar:'١٢ ساعة كهرباء' },
  lights18:{ icon:'🔆', en:'18 hours of electricity', ar:'١٨ ساعة كهرباء' },
  schooled:{ icon:'🏫', en:'A school place for every child', ar:'مقعد دراسي لكل طفل' },
  healthy:{ icon:'🏥', en:'A clinic within reach of everyone', ar:'عيادة في متناول الجميع' },
  educated:{ icon:'🎓', en:'Education above 60', ar:'التعليم فوق ٦٠' },
  work35:{ icon:'💼', en:'Joblessness under 35%', ar:'العاطلون أقل من ٣٥٪' },
  work25:{ icon:'👷', en:'Joblessness under 25%', ar:'العاطلون أقل من ٢٥٪' },
  trusted:{ icon:'🤝', en:'Trust above 60', ar:'الثقة فوق ٦٠' },
  honest:{ icon:'⚖️', en:'Corruption down to 35', ar:'الفساد نزل إلى ٣٥' },
  saver:{ icon:'🏦', en:'$2bn in the bank', ar:'ملياران دولار في البنك' },
  twoRoutes:{ icon:'🚚', en:'Two trade routes open', ar:'طريقان تجاريان مفتوحان' },
  fiveRoutes:{ icon:'🌐', en:'Five trade routes open', ar:'خمسة طرق تجارية مفتوحة' },
  wideRoute:{ icon:'🛳️', en:'A route widened to the top', ar:'طريق وُسِّع إلى أقصاه' },
  firstBuild:{ icon:'🔨', en:'Your first upgrade', ar:'أول تطوير لك' },
  deepBuild:{ icon:'🏗️', en:'Something at level 3', ar:'شيء وصل المستوى ٣' },
  wholeCountry:{ icon:'🇸🇾', en:'All seven networks started', ar:'الشبكات السبع كلها بدأت' },
  bothPorts:{ icon:'⚓', en:'Both ports at level 3', ar:'الميناءان في المستوى ٣' },
  gradeB:{ icon:'🥈', en:'Score of B', ar:'تقدير B' },
  gradeA:{ icon:'🥇', en:'Score of A', ar:'تقدير A' },
};

Object.assign(STR.en, {
  // levels
  levelN:'Level {0}', monthNo:'Month {0}', levelUp:'Level {0} reached', levelMax:'Top level. Nothing left to unlock — only medals.',
  xpToNext:'{0} experience to the next level', xpHave:'{0} experience', medalsHave:'{0} of {1} medals',
  levelNoGift:'No new panel this time. The medals are still out there, and every one of them is experience.',
  needsLevel:'Opens at level {0}', lockBtn:'Locked',
  lockedTitle:'Still to come', lockedSub:'You are level {0}. These open as you go — nothing here is missing, it just has not arrived yet.',
  lockedNone:'Nothing is locked. The whole country is yours to run.',
  lockedHow:'Levels come from months in office and from experience for getting things done, whichever arrives first. Build something and you get there sooner.',
  lockSupply:'Trucks, cold chain and packaging', lockRoutes:'Widening trade routes',
  veteran:'nothing new — you have the whole country now', mentorOff:'the game stops suggesting and lets you run it',
  routesGift:'widening trade routes', moreRoutes:'two more countries to trade with',
  infraRoads:'Roads and bridges', infraEgov:'Digital government', infraAir:'Airports',
  // build drawer
  dBuild:'Build', buildSub:'The seven networks a country runs on. Each level costs more than the last and takes longer.',
  infraLvl:'Level {0} of {1}', infraNextCost:'Next level', infraUpTo:'{0} → level {1}', infraUpgrade:'Upgrade',
  infraBuilding:'Building, ready in {0}', infraMaxed:'Fully built', infraNone:'Nothing here is open to you yet.',
  infraReadyBadge:'{0} ready to upgrade',
  // medals
  subWhy:'Why now', hide:'Hide', layerBuild:'Networks',
  subMedals:'Medals', medalsTitle:'Medals', medalsSub:'Every medal is earned once and pays in experience, never in money. Experience is what raises your level.',
  medalGot:'Earned', medalXp:'+{0} XP', medalsCount:'{0} of {1}',
  // trade routes
  routeLvl:'Route {0} of {1}', routeWidenBtn:'Widen the route', routeWiden:'Widen the route with {0}',
  routeWiderGives:'Everything this deal gives, again.', routeMax:'As wide as it goes',
  // the mentor
  mentorTitle:'How much should the game suggest?', mentorAuto:'Automatic',
  mentorSub:'The game asks you fewer questions as you show you know what you are doing. You can also decide yourself.',
  mentorNow:'Right now: {0}', mentor0:'Ask me often', mentor1:'Ask me less', mentor2:'Only when it matters', mentor3:'Never ask — I will decide',
  mentorWhy0:'You are new. The game will keep offering you questions with two or three answers.',
  mentorWhy1:'You have found your way around. Only the bigger questions come to you now.',
  mentorWhy2:'You mostly run the country from the panels yourself. The game only interrupts for something serious.',
  mentorWhy3:'You are running this on your own. Nothing will be suggested unless the country is on fire.',
  // new decision-card headings
  decBudgetTitle:'The treasury is empty', decBudgetText:'You are {0} short. Something has to give, and every one of these hurts someone.',
  decInfra:'Something the whole country waits on could be bigger',
  decRoute:'A trade route could carry more than it does',
  decPort:'The docks are the bottleneck, not the factories',
});

Object.assign(STR.ar, {
  levelN:'المستوى {0}', monthNo:'الشهر {0}', levelUp:'وصلت إلى المستوى {0}', levelMax:'أعلى مستوى. لا يتبقى ما يُفتح — إلا الأوسمة.',
  xpToNext:'{0} خبرة حتى المستوى التالي', xpHave:'{0} خبرة', medalsHave:'{0} من {1} وسام',
  levelNoGift:'لا لوحة جديدة هذه المرة. الأوسمة ما زالت موجودة، وكل وسام منها خبرة.',
  needsLevel:'يُفتح في المستوى {0}', lockBtn:'مُقفل',
  lockedTitle:'ما زال قادماً', lockedSub:'أنت في المستوى {0}. هذه تُفتح مع تقدّمك — لا شيء هنا ناقص، لكنه لم يصل بعد.',
  lockedNone:'لا شيء مقفل. البلد كله بين يديك.',
  lockedHow:'المستويات تأتي من أشهر الرئاسة ومن الخبرة التي تكسبها بإنجاز الأمور، أيهما يسبق. ابنِ شيئاً وتصل أسرع.',
  lockSupply:'الشاحنات والتبريد والتعبئة', lockRoutes:'توسيع الطرق التجارية',
  veteran:'لا شيء جديد — البلد كله بين يديك الآن', mentorOff:'اللعبة تتوقف عن الاقتراح وتتركك تدير',
  routesGift:'توسيع الطرق التجارية', moreRoutes:'بلدان إضافيان للتجارة',
  infraRoads:'الطرق والجسور', infraEgov:'الحكومة الرقمية', infraAir:'المطارات',
  dBuild:'البناء', buildSub:'الشبكات السبع التي يقوم عليها البلد. كل مستوى أغلى من الذي قبله ويأخذ وقتاً أطول.',
  infraLvl:'المستوى {0} من {1}', infraNextCost:'المستوى التالي', infraUpTo:'{0} → المستوى {1}', infraUpgrade:'طوّر',
  infraBuilding:'قيد البناء، يجهز خلال {0}', infraMaxed:'مكتمل', infraNone:'لا شيء هنا مفتوح لك بعد.',
  infraReadyBadge:'{0} جاهز للتطوير',
  subWhy:'لماذا الآن', hide:'إخفاء', layerBuild:'الشبكات',
  subMedals:'الأوسمة', medalsTitle:'الأوسمة', medalsSub:'كل وسام يُنال مرة واحدة ويُدفع خبرةً لا مالاً. والخبرة هي ما يرفع مستواك.',
  medalGot:'نِلته', medalXp:'+{0} خبرة', medalsCount:'{0} من {1}',
  routeLvl:'الطريق {0} من {1}', routeWidenBtn:'وسّع الطريق', routeWiden:'توسيع الطريق مع {0}',
  routeWiderGives:'كل ما يقدّمه هذا الاتفاق، مرة أخرى.', routeMax:'أوسع ما يمكن',
  mentorTitle:'كم تقترح عليك اللعبة؟', mentorAuto:'تلقائي',
  mentorSub:'تسألك اللعبة أسئلة أقل كلما أظهرت أنك تعرف ما تفعل. ويمكنك أن تقرر بنفسك أيضاً.',
  mentorNow:'الآن: {0}', mentor0:'اسألني كثيراً', mentor1:'اسألني أقل', mentor2:'فقط عند الأمور المهمة', mentor3:'لا تسألني — أنا أقرر',
  mentorWhy0:'أنت جديد. ستستمر اللعبة في طرح أسئلة عليك مع جوابين أو ثلاثة.',
  mentorWhy1:'صرتَ تعرف طريقك. الأسئلة الكبيرة وحدها تأتيك الآن.',
  mentorWhy2:'أنت تدير البلد من اللوحات بنفسك في الغالب. لن تقاطعك اللعبة إلا لأمر جدي.',
  mentorWhy3:'أنت تدير هذا وحدك. لن يُقترح عليك شيء إلا إذا كان البلد يحترق.',
  decBudgetTitle:'الخزينة فارغة', decBudgetText:'ينقصك {0}. لا بد من تنازل، وكل خيار من هذه يؤلم أحداً.',
  decInfra:'شيء ينتظره البلد كله يمكن أن يكون أكبر',
  decRoute:'طريق تجاري يمكن أن يحمل أكثر مما يحمل',
  decPort:'الأرصفة هي عنق الزجاجة، لا المصانع',
});

const PART_TXT_NEW = {
  egypt:{ en:['Egypt','Power line and farm market','An electricity interconnection through Jordan, and Egyptian buyers for Syrian produce.','+180 MW of power per route level, farm exports +12%.','Damascus anger below 65'],
    ar:['مصر','خط كهرباء وسوق زراعية','ربط كهربائي عبر الأردن، ومشترون مصريون للمنتجات السورية.','+180 ميغاواط لكل مستوى طريق، صادرات زراعية +12%.','غضب دمشق أقل من 65'] },
  india:{ en:['India','Medicine and generics','Cheap ingredients for your medicine factories, and Indian buyers for what they make.','Medicine for clinics costs 18% less per level, pharma exports +25%.','Corruption below 62'],
    ar:['الهند','الدواء والجنيسات','مواد أولية رخيصة لمعامل الأدوية، ومشترون هنود لما تنتجه.','دواء العيادات أرخص بـ18% لكل مستوى، صادرات الأدوية +25%.','فساد أقل من 62'] },
  africa:{ en:['African markets','Cement, cloth and canned food','Growing markets that buy exactly what Syria can make cheaply. Needs ports that can load the ships.','Export room +$40M/yr per level, factory exports +8%.','Ports at level 3 between them'],
    ar:['الأسواق الإفريقية','الإسمنت والأقمشة والمعلّبات','أسواق نامية تشتري تحديداً ما تستطيع سوريا صنعه بثمن رخيص. تحتاج موانئ قادرة على تحميل السفن.','قدرة تصدير +40 مليون$/سنة لكل مستوى، صادرات المصانع +8%.','مجموع مستويات الميناءين 3'] },
};
Object.assign(PART_TXT, PART_TXT_NEW);
Object.assign(LEDGER.en, { upkeep:'Keeping the networks running' });
Object.assign(LEDGER.ar, { upkeep:'تشغيل الشبكات وصيانتها' });
Object.assign(NOTE.en, {
  infraStart:'{0}: level {1} started, ready in {2}.', infraDone:'{0} is now level {1}.',
  dealWiden:'The route with {0} is now level {1}.', medal:'🏅 Medal: {0} (+{1} experience)',
});
Object.assign(NOTE.ar, {
  infraStart:'{0}: بدأ المستوى {1}، يجهز خلال {2}.', infraDone:'{0} صار في المستوى {1}.',
  dealWiden:'الطريق مع {0} صار في المستوى {1}.', medal:'🏅 وسام: {0} (+{1} خبرة)',
});
