// ===== Text v5: continuous time + trade & resources (overrides earlier text) =====
const MONTHS = {
  en:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
  ar:['كانون الثاني','شباط','آذار','نيسان','أيار','حزيران','تموز','آب','أيلول','تشرين الأول','تشرين الثاني','كانون الأول'],
};
Object.assign(STR.en, {
  policyIntro:'These rules keep running every month until you change them.',
  raiseText:'Workers earn ${0} a month and expect about ${1}. A raise costs cash every month after.',
  budgetIntro:'Money in (green) and money out (red) over the next 12 months, if nothing changes.',
  comingNone:'Nothing under construction. Power stations, projects and investments take months to finish.',
  chartsEmpty:'Charts appear after your first few months.', newsEmpty:'Your decisions and news will appear here.',
  afterN:'after {0} as president', missionsTxt:'Four-year challenges. Each one teaches one system.', seasonsLeft:'{0} left', quiet:'A quiet month.',
  choices:'Your choices', monthsN:'{0} months', months1:'1 month', yearsN:'{0} years', years1:'1 year', soon:'any day now', inTime:'in {0}',
  building:'Building, ready in {0}', buildingEnd:'Building, almost done',
  fastTxt:'Ready in {0}. About ${1}M will disappear to corruption.', tenderTxt:'Ready in {0}. Honest bidding, only about ${1}M lost.',
  // time & score
  pause:'Pause', play:'Play', fast:'Faster', fastest:'Fast', slow:'Slow', normal:'Normal', soundOn:'Turn sound on', soundOff:'Turn sound off', paused:'Paused', startPrompt:'Press ▶ to start the clock',
  score:'Legacy score', scoreHelp:'Your score combines peace, living standards, rebuilding, honest government, money and independence. It changes every month based on your decisions.',
  inSixMonths:'in 6 months', perYear:'a year',
  milestoneTitle:'{0} years in office', milestoneSub:'Report card, {0}', keepPlaying:'Keep going', newYear:'{0} begins. Score {1} ({2} over the year).',
  whyNow:'What’s driving things right now',
  // trade drawer
  dTrade:'Trade', tradeSub:'Oil, gas, factories, farms, ports and deals with other countries.', subResources:'Resources', subPorts:'Ports', subPartners:'Partners',
  decHeading:'What do you want to do?', decLater:'Not now', decSkip:'Something else',
  decNone:'Nothing needs you right now. Press ▶ and let the months run.',
  decProv:'The angriest province you can still do something about',
  decPolicy:'A rule that is costing you right now', decSvc:'Not enough for this many people',
  decSector:'Nobody here is making anything to sell', decDeal:'A neighbour is offering a deal',
  decDecree:'You have the influence to do something big', decWage:'People are paid less than they expect',
  decSov:'Foreign partners have a grip on the country',
  sovBiteLong:'The people who hold Syria’s debt take a cut of everything the country sells, and nobody believes the president speaks for them. Paying the old debt down loosens their hold.',
  decSovPay:'Pay {0} off the old debt', decSovSub:'Buys back independence, and cuts the interest forever.',
  decBuildT:'Build it properly', decBuildF:'Build it fast', decLeave:'Leave it for now',
  decCost:'Costs', decOpen:'Open the panel',
  dGuide:'Guide', guideSub:'What to do next, and why things are changing.',
  guideSteps:'Your first steps', guideLeft:'{0} left', guideDone:'You know the basics. The guide will keep suggesting what to do next.',
  guideNext:'What to do next', guideWhy:'Why things just changed', guideChains:'What affects what',
  guideNothing:'Nothing has changed much yet. Press ▶ and watch.',
  calmEconEarly:'The money looks alright for now, and that will not last.',
  calmEconEarlyAct:'Tap an orange province on the map and start its project. It takes months, so start early.',
  gt_start:'Start the clock', gw_start:'Nothing happens while the game is paused. Press ▶ at the bottom. You can pause again any time — and a crisis pauses it for you.',
  gt_gloss:'Tap a number at the top', gw_gloss:'Every number on the dashboard explains itself: what it is, why it matters, and how to fix it. Tap one now.',
  gt_policy:'Change one policy', gw_policy:'Policies are rules that keep running every month. Change one and a card shows you what it does right now and over the next 3 months — before you commit to it.',
  gt_prov:'Tap a province on the map', gw_prov:'Each of the 14 provinces has its own anger, electricity and work. The colour is anger. Tap one to see what is wrong there.',
  gt_project:'Start a building project', gw_project:'Each province has one big project. It takes months and it is the main way to calm a place down and put people back to work.',
  gt_money:'Look at where the money goes', gw_money:'Open Money. You have cash in lira and dollars in the bank, and they do different jobs. Running out of dollars ends the game.',
  chain1:'Print money → the dollar costs more → salaries buy less → people get angry',
  chain2:'Electricity → workshops can run → people have work → less anger',
  chain3:'Work and fair pay → people trust you → you get influence to spend',
  chain4:'Schools and clinics → healthier, schooled people → more work, a bigger economy',
  chain5:'Factories → goods to sell → but only if the ports and trucks can move them',
  chainHelp:'Nothing in this country has only one effect. That is the whole game.',
  subFamilies:'Families', subServices:'Schools & clinics', subPop:'Population',
  svcTitle:'Schools, clinics and universities', svcSub:'A country is not only roads and factories. Educated, healthy people work more, earn more and riot less.',
  svcSchools:'Schools', svcClinics:'Clinics and hospitals', svcUnis:'Universities',
  svcSchoolsTxt:'Classrooms, teachers and books for the children who lost years of school to the war.',
  svcClinicsTxt:'Doctors, medicine and a hospital bed within reach. Costs dollars every year to keep running.',
  svcUnisTxt:'Engineers, doctors and accountants of your own, instead of importing them or losing them.',
  svcBuild:'Build more', svcCover:'{0} of {1} built', svcNeedMore:'Not enough for this many people',
  svcEnough:'Enough for now', svcRunning:'Building, ready in {0}', needsEdu:'Needs schools first (education 42+)',
  eduName:'Education', healthName:'Health',
  popTitle:'Who lives here', popNow:'{0} million people', popFalling:'People are leaving the country.', popRising:'People are coming home.',
  clsPoor:'Poor', clsMiddle:'Getting by', clsRich:'Rich',
  popSub:'Every decision you make moves this bar. Cheap bread and wages move it one way; inflation and no work move it the other.',
  advEcon:'Economy', advSec:'Security', advHealth:'Health & schools', advInd:'Industry',
  ministerHealth:'Health minister', ministerInd:'Industry minister',
  newUnlocked:'New: {0}', stageTitle:'Something new is open to you',
  stageGo:'Show me', stageLater:'Later',
  lockedYet:'Opens later', lockedHint:'You will get to this. Finish what is in front of you first.', advisorsHidden:'Advisors hidden. Tap a face to hear them again.',
  oilTitle:'Oil', oilProd:'{0} thousand barrels a day', oilAccess:'Fields you control: {0}%. Security in the east: {1}%.',
  oilUseQ:'What do we do with our oil?', oilUse:{ 0:'Sell abroad', 0.5:'Half and half', 1:'Use at home' },
  oilUseHint:'Using oil at home saves more dollars than selling it, because imported fuel is expensive. But refineries can only handle {0} thousand barrels a day, and the rest must be sold.',
  gasTitle:'Gas', gasProd:'{0} million m³ a day', gasHint:'Gas runs power plants. Every bit you produce is fuel you don’t have to import.',
  phosTitle:'Phosphate', phosHint:'Fertilizer rock from the Homs desert, sold abroad.', farmTitle:'Olive oil and cotton', farmHint:'Farm exports. Hurt by anger in farming provinces.',
  investTitle:'Invest for the future', investSub:'Pay now, earn later. Money spent here can’t be used in an emergency.',
  extractTitle:'Dig it up and sell it', extractSub:'Oil, gas and rock earn dollars fast, but a barrel employs almost nobody.',
  sectorTitle:'Build an economy', sectorSub:'Factories earn less per dollar than oil does. They also give people work, and work is what holds a country together.',
  jobsChip:'{0} jobs', jobsMade:'Puts people back to work', needsCalm:'Needs the country calmer (anger below 48)',
  barTitle:'The bar keeps rising', barLow:'People still remember the war. Anything works.', barMid:'People have stopped comparing today to the war.',
  barHigh:'People compare you to normal countries now, not to 2027.', barNow:'The bar: {0}%',
  barHelp:'Every good year raises what counts as good enough, and it never drops back. Wages that felt generous become normal, calm becomes expected, and crises hit a country that has more to lose. Winning early makes the rest harder — that is the job.',
  payback:'Pays for itself in about {0}', paybackNever:'Won’t pay back right now', running:'Under way, ready {0}', maxed:'Fully built', gamble:'50/50 gamble',
  investBtn:'Invest', needsCalmEast:'Needs the east calmer (anger below 70)',
  portsTitle:'Export capacity', portsSub:'Ports and border crossings limit how much you can sell abroad.', portsUse:'Exports want {0} a year. Ports and crossings can move {1}.',
  clogged:'Ports are jammed: {0} a year of exports can’t leave the country.', portLvl:'Berth level {0}', portState:'Run by the state', portForeign:'Run by a foreign operator',
  upgrade:'Upgrade', upgradeTxt:'{0} and 12 months. Moves more exports and earns more fees.', concession:'Hand to a foreign operator', concessionTxt:'+$100M now, and they upgrade it for free. They keep 15% of port fees. Independence −4.',
  partnersSub:'Each deal has gains, costs and conditions. If a condition breaks, the deal pauses until you fix it.',
  dealActive:'Active', dealPaused:'Paused: condition broken', dealSign:'Sign deal', needs:'Needs:',
  // score / milestones reuse
});
Object.assign(STR.ar, {
  policyIntro:'هذه القواعد تستمر كل شهر حتى تغيّرها.',
  raiseText:'يكسب الموظف {0}$ في الشهر ويتوقع حوالي {1}$. الزيادة تكلّف مالاً كل شهر بعدها.',
  budgetIntro:'المال الداخل (بالأخضر) والخارج (بالأحمر) خلال الأشهر الـ12 القادمة إذا لم يتغيّر شيء.',
  comingNone:'لا شيء قيد البناء. المحطات والمشاريع والاستثمارات تحتاج أشهراً لتكتمل.',
  chartsEmpty:'تظهر الرسوم بعد أشهرك الأولى.', newsEmpty:'قراراتك والأخبار تظهر هنا.',
  afterN:'بعد {0} في الرئاسة', missionsTxt:'تحديات من أربع سنوات، كل واحد يعلّم نظاماً واحداً.', seasonsLeft:'بقي {0}', quiet:'شهر هادئ.',
  choices:'قراراتك', monthsN:'{0} أشهر', months1:'شهر واحد', yearsN:'{0} سنوات', years1:'سنة واحدة', soon:'خلال أيام', inTime:'خلال {0}',
  building:'قيد البناء، يجهز خلال {0}', buildingEnd:'قيد البناء، على وشك الانتهاء',
  fastTxt:'يجهز خلال {0}. سيضيع حوالي {1} مليون دولار بسبب الفساد.', tenderTxt:'يجهز خلال {0}. منافسة نزيهة، يضيع حوالي {1} مليون دولار فقط.',
  pause:'إيقاف مؤقت', play:'تشغيل', fast:'أسرع', fastest:'سريع', slow:'بطيء', normal:'عادي', soundOn:'تشغيل الصوت', soundOff:'إيقاف الصوت', paused:'متوقف', startPrompt:'اضغط ▶ لتبدأ الساعة',
  score:'نقاط الإرث', scoreHelp:'نقاطك تجمع السلم ومستوى المعيشة وإعادة الإعمار ونزاهة الحكومة والمال والاستقلال. تتغيّر كل شهر حسب قراراتك.',
  inSixMonths:'خلال 6 أشهر', perYear:'سنوياً',
  milestoneTitle:'{0} سنوات في الرئاسة', milestoneSub:'بطاقة التقييم، {0}', keepPlaying:'تابع', newYear:'بدأ عام {0}. النقاط {1} ({2} خلال العام).',
  whyNow:'ما الذي يحرّك الأمور الآن',
  dTrade:'التجارة', tradeSub:'النفط والغاز والمصانع والمزارع والموانئ والاتفاقات مع الدول.', subResources:'الموارد', subPorts:'الموانئ', subPartners:'الشركاء',
  decHeading:'ماذا تريد أن تفعل؟', decLater:'ليس الآن', decSkip:'شيء آخر',
  decNone:'لا شيء يحتاجك الآن. اضغط ▶ ودع الأشهر تمضي.',
  decProv:'أكثر محافظة غاضبة تستطيع أن تفعل لها شيئاً',
  decPolicy:'قاعدة تكلّفك الآن', decSvc:'لا تكفي هذا العدد من الناس',
  decSector:'لا أحد هنا يصنع شيئاً للبيع', decDeal:'جار يعرض عليك اتفاقاً',
  decDecree:'لديك النفوذ لتفعل شيئاً كبيراً', decWage:'الناس يُدفع لهم أقل مما يتوقعون',
  decSov:'الشركاء الأجانب يمسكون بالبلاد',
  sovBiteLong:'من يحملون ديون سوريا يأخذون نصيباً من كل ما تبيعه البلاد، ولا أحد يصدق أن الرئيس يتكلم باسمهم. سداد الدين القديم يخفّف قبضتهم.',
  decSovPay:'سدّد {0} من الدين القديم', decSovSub:'يعيد الاستقلال، ويخفّض الفوائد إلى الأبد.',
  decBuildT:'ابنِه بشكل سليم', decBuildF:'ابنِه بسرعة', decLeave:'اتركه الآن',
  decCost:'يكلّف', decOpen:'افتح اللوحة',
  dGuide:'الدليل', guideSub:'ما الخطوة التالية، ولماذا تتغيّر الأمور.',
  guideSteps:'خطواتك الأولى', guideLeft:'بقي {0}', guideDone:'صرت تعرف الأساسيات. سيتابع الدليل اقتراح الخطوة التالية.',
  guideNext:'ما الخطوة التالية', guideWhy:'لماذا تغيّرت الأمور للتو', guideChains:'ما الذي يؤثّر على ماذا',
  guideNothing:'لم يتغيّر شيء يُذكر بعد. اضغط ▶ وراقب.',
  calmEconEarly:'الوضع المالي مقبول الآن، ولن يبقى كذلك.',
  calmEconEarlyAct:'اضغط على محافظة برتقالية في الخريطة وابدأ مشروعها. يحتاج أشهراً، فابدأ باكراً.',
  gt_start:'شغّل الساعة', gw_start:'لا يحدث شيء واللعبة متوقفة. اضغط ▶ في الأسفل. تستطيع الإيقاف متى شئت، والأزمة توقفها عنك.',
  gt_gloss:'اضغط على رقم في الأعلى', gw_gloss:'كل رقم في اللوحة يشرح نفسه: ما هو، ولماذا يهم، وكيف تصلحه. اضغط على واحد الآن.',
  gt_policy:'غيّر سياسة واحدة', gw_policy:'السياسات قواعد تستمر كل شهر. غيّر واحدة وستظهر بطاقة تريك ماذا تفعل الآن وخلال 3 أشهر، قبل أن تلتزم بها.',
  gt_prov:'اضغط على محافظة في الخريطة', gw_prov:'لكل محافظة من الأربع عشرة غضبها وكهرباؤها وعملها. اللون يدل على الغضب. اضغط على واحدة لترى مشكلتها.',
  gt_project:'ابدأ مشروع بناء', gw_project:'لكل محافظة مشروع كبير واحد. يحتاج أشهراً، وهو الطريق الأساسي لتهدئتها وإعادة الناس إلى العمل.',
  gt_money:'انظر أين يذهب المال', gw_money:'افتح المال. لديك نقد بالليرة ودولارات في المصرف، ولكل منهما دور مختلف. نفاد الدولارات ينهي اللعبة.',
  chain1:'طباعة النقود ← الدولار يغلو ← الرواتب تشتري أقل ← الناس يغضبون',
  chain2:'الكهرباء ← الورشات تعمل ← الناس يجدون عملاً ← غضب أقل',
  chain3:'العمل والأجر العادل ← الناس يثقون بك ← تحصل على نفوذ تنفقه',
  chain4:'المدارس والعيادات ← ناس أصحّ وأكثر تعلّماً ← عمل أكثر واقتصاد أكبر',
  chain5:'المصانع ← بضائع للبيع ← لكن فقط إذا استطاعت الموانئ والشاحنات نقلها',
  chainHelp:'لا شيء في هذا البلد له أثر واحد فقط. هذه هي اللعبة كلها.',
  subFamilies:'العائلات', subServices:'المدارس والعيادات', subPop:'السكان',
  svcTitle:'المدارس والعيادات والجامعات', svcSub:'البلد ليس طرقاً ومصانع فقط. المتعلّم والسليم يعمل أكثر ويكسب أكثر ويغضب أقل.',
  svcSchools:'المدارس', svcClinics:'العيادات والمشافي', svcUnis:'الجامعات',
  svcSchoolsTxt:'صفوف ومعلّمون وكتب لأطفال خسروا سنوات دراسة في الحرب.',
  svcClinicsTxt:'أطباء ودواء وسرير مشفى في المتناول. تكلّف دولارات كل عام لتبقى تعمل.',
  svcUnisTxt:'مهندسون وأطباء ومحاسبون من عندك، بدل استيرادهم أو خسارتهم.',
  svcBuild:'ابنِ المزيد', svcCover:'{0} من {1} أُنجزت', svcNeedMore:'لا تكفي هذا العدد من الناس',
  svcEnough:'تكفي حالياً', svcRunning:'قيد البناء، تجهز خلال {0}', needsEdu:'يحتاج مدارس أولاً (التعليم 42+)',
  eduName:'التعليم', healthName:'الصحة',
  popTitle:'من يعيش هنا', popNow:'{0} مليون نسمة', popFalling:'الناس يغادرون البلاد.', popRising:'الناس يعودون إلى بلادهم.',
  clsPoor:'فقراء', clsMiddle:'يكفيهم دخلهم', clsRich:'أغنياء',
  popSub:'كل قرار تتخذه يحرّك هذا الشريط. الخبز الرخيص والرواتب تحرّكه في اتجاه، والتضخم والبطالة في الاتجاه الآخر.',
  advEcon:'الاقتصاد', advSec:'الأمن', advHealth:'الصحة والتعليم', advInd:'الصناعة',
  ministerHealth:'وزير الصحة', ministerInd:'وزير الصناعة',
  newUnlocked:'جديد: {0}', stageTitle:'فُتح لك شيء جديد',
  stageGo:'أرِني', stageLater:'لاحقاً',
  lockedYet:'يُفتح لاحقاً', lockedHint:'ستصل إلى هذا. أنهِ ما بين يديك أولاً.', advisorsHidden:'المستشارون مخفيون. اضغط على وجه لتسمعهم من جديد.',
  oilTitle:'النفط', oilProd:'{0} ألف برميل يومياً', oilAccess:'الحقول تحت سيطرتك: {0}%. الأمن في الشرق: {1}%.',
  oilUseQ:'ماذا نفعل بنفطنا؟', oilUse:{ 0:'نبيعه للخارج', 0.5:'نصف ونصف', 1:'نستخدمه محلياً' },
  oilUseHint:'استخدام النفط محلياً يوفّر دولارات أكثر من بيعه لأن الوقود المستورد غالٍ. لكن المصافي تتسع لـ{0} ألف برميل يومياً فقط، والباقي يجب بيعه.',
  gasTitle:'الغاز', gasProd:'{0} مليون م³ يومياً', gasHint:'الغاز يشغّل محطات الكهرباء. كل ما تنتجه وقود لا تحتاج استيراده.',
  phosTitle:'الفوسفات', phosHint:'صخور الأسمدة من بادية حمص، تُباع للخارج.', farmTitle:'زيت الزيتون والقطن', farmHint:'صادرات زراعية، يضرّها الغضب في المحافظات الزراعية.',
  investTitle:'استثمر للمستقبل', investSub:'ادفع الآن واكسب لاحقاً. المال المستثمر هنا لا يمكن استخدامه في الطوارئ.',
  extractTitle:'استخرج وبِع', extractSub:'النفط والغاز والصخور تجلب الدولار بسرعة، لكن البرميل لا يوظّف أحداً تقريباً.',
  sectorTitle:'ابنِ اقتصاداً', sectorSub:'المصانع تكسب أقل من النفط مقابل كل دولار، لكنها تعطي الناس عملاً، والعمل هو ما يمسك البلد.',
  jobsChip:'{0} فرصة عمل', jobsMade:'يعيد الناس إلى العمل', needsCalm:'يحتاج بلداً أهدأ (الغضب أقل من 48)',
  barTitle:'السقف يرتفع', barLow:'الناس ما زالوا يتذكّرون الحرب. أي تحسّن يكفي.', barMid:'الناس لم يعودوا يقارنون يومهم بأيام الحرب.',
  barHigh:'الناس يقارنونك الآن بالدول الطبيعية، لا بعام 2027.', barNow:'السقف: {0}%',
  barHelp:'كل عام جيد يرفع ما يُعتبر «جيداً بما يكفي»، ولا يعود إلى الوراء أبداً. الراتب الذي بدا سخياً يصير عادياً، والهدوء يصير متوقعاً، والأزمات تضرب بلداً صار لديه ما يخسره. النجاح المبكر يجعل ما بعده أصعب، وهذه هي المهمة.',
  payback:'يسترد كلفته خلال {0} تقريباً', paybackNever:'لن يسترد كلفته حالياً', running:'جارٍ العمل، يجهز {0}', maxed:'مكتمل', gamble:'مقامرة 50/50',
  investBtn:'استثمر', needsCalmEast:'يحتاج شرقاً أهدأ (غضب أقل من 70)',
  portsTitle:'قدرة التصدير', portsSub:'الموانئ والمعابر الحدودية تحدّد كم يمكنك أن تبيع للخارج.', portsUse:'الصادرات تحتاج {0} سنوياً. الموانئ والمعابر تنقل {1}.',
  clogged:'الموانئ مزدحمة: صادرات بقيمة {0} سنوياً لا تستطيع مغادرة البلاد.', portLvl:'مستوى المرفأ {0}', portState:'تديره الدولة', portForeign:'يديره مشغّل أجنبي',
  upgrade:'طوّر', upgradeTxt:'{0} و12 شهراً. ينقل صادرات أكثر ويكسب رسوماً أكثر.', concession:'سلّمه لمشغّل أجنبي', concessionTxt:'+100 مليون$ الآن، ويطوّره مجاناً، لكنه يأخذ 15% من رسوم الميناء. الاستقلال −4.',
  partnersSub:'لكل اتفاق مكاسب وتكاليف وشروط. إذا اختلّ شرط، يتوقف الاتفاق حتى تصلحه.',
  dealActive:'فعّال', dealPaused:'متوقف: شرط مختلّ', dealSign:'وقّع الاتفاق', needs:'يحتاج:',
});

// time-based rewrites of earlier text
GLOSS.pc.en.fix = 'It grows every month, faster when people trust you. Cash gifts can buy some.';
GLOSS.pc.ar.fix = 'يزداد كل شهر، وأسرع عندما يثق بك الناس. المنح النقدية تشتري بعضه.';
GLOSS.power.en.fix = 'Invest in power stations (Policies). New power arrives 12 months later. A growing economy needs more electricity.';
GLOSS.power.ar.fix = 'استثمر في محطات الكهرباء (السياسات). الكهرباء الجديدة تصل بعد 12 شهراً. الاقتصاد النامي يحتاج كهرباء أكثر.';
GLOSS.score = { icon:'🏆', en:{ name:'Legacy score', short:'Score', what:'One number for how well the country is doing, from 0 to 100.', why:'It’s how history will judge you. It changes every month.', fix:'Keep the peace, raise living standards, rebuild, fight corruption, keep money in the bank, and don’t give away too much independence.' },
  ar:{ name:'نقاط الإرث', short:'النقاط', what:'رقم واحد يقيس حال البلاد، من 0 إلى 100.', why:'هكذا سيحكم عليك التاريخ. يتغيّر كل شهر.', fix:'حافظ على السلم، ارفع مستوى المعيشة، أعد الإعمار، حارب الفساد، احتفظ بالمال، ولا تتنازل عن استقلال كثير.' } };
POL.capex.en = { name:'Build power stations', q:'How many dollars go into electricity? New power arrives 12 months later.', opts:{ 0:'$0', 20:'$40M/yr', 40:'$80M/yr', 60:'$120M/yr' }, hint:{ 0:'Nothing. The grid slowly breaks down.', 20:'Steady progress. New power starts arriving in 12 months.', 40:'Fast progress. The best long-term move, but you wait a year to see it.', 60:'All-out. A country full of working factories needs this much and uses all of it.' } };
POL.capex.ar = { name:'بناء محطات الكهرباء', q:'كم دولاراً يذهب إلى الكهرباء؟ الكهرباء الجديدة تصل بعد 12 شهراً.', opts:{ 0:'0$', 20:'40 مليون$/سنة', 40:'80 مليون$/سنة', 60:'120 مليون$/سنة' }, hint:{ 0:'لا شيء. الشبكة تتهالك ببطء.', 20:'تقدّم ثابت. الكهرباء الجديدة تبدأ بالوصول بعد 12 شهراً.', 40:'تقدّم سريع. أفضل خطوة للمستقبل، لكنك تنتظر سنة لترى النتيجة.', 60:'أقصى ما يمكن. بلد مليء بالمصانع العاملة يحتاج هذا القدر ويستهلكه كله.' } };
POL.recon.en.q = 'How much cash goes to rebuilding?'; POL.recon.en.opts = { 0:'None', 5:'10bn/yr', 10:'20bn/yr', 20:'40bn/yr' };
POL.recon.ar.q = 'كم من النقد يذهب لإعادة الإعمار؟'; POL.recon.ar.opts = { 0:'لا شيء', 5:'10 مليار/سنة', 10:'20 مليار/سنة', 20:'40 مليار/سنة' };
POL.print.en.opts = { 0:'None', 5:'10bn/yr', 15:'30bn/yr', 30:'60bn/yr' }; POL.print.ar.opts = { 0:'لا', 5:'10 مليار/سنة', 15:'30 مليار/سنة', 30:'60 مليار/سنة' };
POL.intervene.en.opts = { 0:'None', 25:'$50M/yr', 50:'$100M/yr' }; POL.intervene.ar.opts = { 0:'لا', 25:'50 مليون$/سنة', 50:'100 مليون$/سنة' };
POL.intervene.en.hint = { 0:'Let the market decide.', 25:'Sell $50M a year to hold the dollar price down.', 50:'Sell $100M a year. Works, but burns your dollars.' };
POL.intervene.ar.hint = { 0:'دع السوق يقرّر.', 25:'بِع 50 مليون$ سنوياً لكبح سعر الدولار.', 50:'بِع 100 مليون$ سنوياً. ينجح لكنه يستنزف دولاراتك.' };
DEC_TXT.integrity.en[2] = 'Corruption falls every month. Costs a little influence to keep alive.'; DEC_TXT.integrity.ar[2] = 'الفساد ينخفض كل شهر. تكلّف قليلاً من النفوذ لتستمر.';
DEC_TXT.tribal.en[2] = 'Opens more eastern oil fields to you. Anger drops in Deir ez-Zor and Raqqa. Independence −3.'; DEC_TXT.tribal.ar[2] = 'يفتح لك حقول نفط شرقية أكثر. الغضب ينخفض في دير الزور والرقة. الاستقلال −3.';
DEC_TXT.northeast.en[2] = 'Opens the northeast oil fields. Anger drops in Hasakeh and Raqqa. Independence +5.'; DEC_TXT.northeast.ar[2] = 'يفتح حقول نفط الشمال الشرقي. الغضب ينخفض في الحسكة والرقة. الاستقلال +5.';
DEC_TXT.braingain.en[2] = 'The economy grows a little faster every month, and more people pay tax.'; DEC_TXT.braingain.ar[2] = 'الاقتصاد ينمو أسرع قليلاً كل شهر، ويدفع ضرائب أكثر من الناس.';
DEC_TXT.vocational.en[2] = 'Unemployment falls a little every month, everywhere. Costs $20M a year.'; DEC_TXT.vocational.ar[2] = 'البطالة تنخفض قليلاً كل شهر في كل مكان. تكلّف 20 مليون$ سنوياً.';
FAC_TXT.wb.en[1] = 'Money that goes straight into power stations. It arrives as electricity 12 months later.'; FAC_TXT.wb.ar[1] = 'أموال تذهب مباشرة إلى محطات الكهرباء، وتصل كهرباءً بعد 12 شهراً.';
NOTE.en.wbGrid = 'World Bank money is building {0} MW of power (ready in 12 months).'; NOTE.ar.wbGrid = 'أموال البنك الدولي تبني {0} ميغاواط (جاهزة بعد 12 شهراً).';
Object.assign(NOTE.en, { svcStart:'Started building {0}. Ready in {1}.', svcDone:'{0} opened. That is {1} built so far.',
  portDone:'{0} port reached level {1}.', dealOn:'Deal with {0} is active again.', dealOff:'Deal with {0} paused: a condition broke.', dealSign:'Signed a deal with {0}.',
  investStart:'Investment started: {0}. Ready in {1}.', investDone:'Investment finished: {0}.', offshoreHit:'Offshore drilling struck gas! +10 million m³ a day.', offshoreDry:'Offshore well came up dry. The $150M is gone.',
  portStart:'Upgrading {0} port. Ready in 12 months.', portConcession:'{0} port handed to a foreign operator. +$100M.', projStartShort:'Construction started in {0}.' });
Object.assign(NOTE.ar, { svcStart:'بدأ بناء {0}. يجهز خلال {1}.', svcDone:'افتُتحت {0}. صار المبني {1} حتى الآن.',
  portDone:'وصل ميناء {0} إلى المستوى {1}.', dealOn:'عاد الاتفاق مع {0} للعمل.', dealOff:'توقف الاتفاق مع {0}: اختلّ أحد الشروط.', dealSign:'وُقّع اتفاق مع {0}.',
  investStart:'بدأ الاستثمار: {0}. يجهز خلال {1}.', investDone:'اكتمل الاستثمار: {0}.', offshoreHit:'الحفر البحري وجد غازاً! +10 مليون م³ يومياً.', offshoreDry:'البئر البحرية جافة. ضاعت الـ150 مليون$.',
  portStart:'تطوير ميناء {0}. يجهز خلال 12 شهراً.', portConcession:'سُلّم ميناء {0} لمشغّل أجنبي. +100 مليون$.', projStartShort:'بدأ البناء في {0}.' });
Object.assign(LEDGER.en, { industry:'Factory exports', tourism:'Visitors', vocational:'Trade schools', oilExport:'Oil sold abroad', farm:'Olive oil and cotton exports', fdi:'Gulf investment', euGrant:'EU grants', homeEnergy:'Own oil and gas (imports saved)', powerImport:'Electricity from Iraq', phos:'Phosphate exports' });
Object.assign(LEDGER.ar, { industry:'صادرات المصانع', tourism:'الزوّار', vocational:'المعاهد المهنية', oilExport:'نفط يُباع للخارج', farm:'صادرات الزيتون والقطن', fdi:'استثمار خليجي', euGrant:'منح أوروبية', homeEnergy:'نفطنا وغازنا (استيراد موفَّر)', powerImport:'كهرباء من العراق', phos:'صادرات الفوسفات' });
Object.assign(ADV.en, {
  health:'Clinics cannot cover this many people. Illness is costing you working days.', healthAct:'Build clinics under People → Schools & clinics.',
  school:'A generation is growing up without school. You will feel it in ten years, and so will they.', schoolAct:'Build schools under People → Schools & clinics.',
  uni:'You have schools but no universities. Your best students leave and do not come back.', uniAct:'Build universities under People → Schools & clinics.',
  calmHealth:'Schools and clinics are keeping up with the population.', calmHealthAct:'Universities are the next step up.',
  clogNow:'The ports cannot move what the factories are making. We are losing money at the dock.', clogNowAct:'Build trucks and warehouses, or upgrade a port.',
  noInd:'We sell what we dig up and buy everything else. That is not an economy.', noIndAct:'Build a factory — textiles and food are the cheapest way in.',
  jobsBad:'Too many people have no work. That is where anger comes from.', jobsBadAct:'Factories hire. So do the province projects.',
  calmInd:'Factories are running and the goods are getting out.', calmIndAct:'Keep an eye on the ports as you build more.',
  usd:'Dollars will run out in about {0} months. That’s game over.', payAct:'A 10% raise in the Money panel. It costs cash every month after.', gridAct:'Put $40M or $80M a year into power stations. It pays off in a year.', calmEcon:'The money looks okay right now.', calmEconAct:'Look at Trade: oil, ports and deals can bring in dollars.',
  clog:'Our ports are jammed. We’re losing export money.', clogAct:'Upgrade Latakia or Tartus, or sign a border trade deal.' });
Object.assign(ADV.ar, {
  health:'العيادات لا تكفي هذا العدد من الناس. المرض يكلّفك أيام عمل.', healthAct:'ابنِ عيادات من الناس ← المدارس والعيادات.',
  school:'جيل يكبر بلا مدرسة. ستشعر بذلك بعد عشر سنوات، وسيشعرون هم أكثر.', schoolAct:'ابنِ مدارس من الناس ← المدارس والعيادات.',
  uni:'لديك مدارس ولا جامعات. أفضل طلابك يغادرون ولا يعودون.', uniAct:'ابنِ جامعات من الناس ← المدارس والعيادات.',
  calmHealth:'المدارس والعيادات تواكب عدد السكان.', calmHealthAct:'الجامعات هي الخطوة التالية.',
  clogNow:'الموانئ لا تستطيع نقل ما تنتجه المصانع. نخسر المال على الرصيف.', clogNowAct:'ابنِ شاحنات ومستودعات، أو طوّر ميناءً.',
  noInd:'نبيع ما نستخرجه ونشتري كل شيء آخر. هذا ليس اقتصاداً.', noIndAct:'ابنِ مصنعاً — النسيج والغذاء أرخص بداية.',
  jobsBad:'عدد كبير جداً بلا عمل. من هنا يأتي الغضب.', jobsBadAct:'المصانع توظّف، ومشاريع المحافظات كذلك.',
  calmInd:'المصانع تعمل والبضائع تخرج.', calmIndAct:'راقب الموانئ كلما بنيت أكثر.',
  usd:'ستنفد الدولارات خلال {0} أشهر تقريباً. عندها تنتهي اللعبة.', payAct:'زيادة 10% من لوحة المال. تكلّف نقداً كل شهر بعدها.', gridAct:'خصّص 40 أو 80 مليون$ سنوياً للمحطات. تُثمر خلال سنة.', calmEcon:'الوضع المالي مقبول الآن.', calmEconAct:'انظر إلى التجارة: النفط والموانئ والاتفاقات تجلب الدولار.',
  clog:'موانئنا مزدحمة، ونخسر أموال التصدير.', clogAct:'طوّر اللاذقية أو طرطوس، أو وقّع اتفاق تجارة حدودية.' });
WHY.en.noneYet = 'Nothing dramatic right now. Small changes add up, though.'; WHY.ar.noneYet = 'لا شيء دراماتيكي الآن، لكن التغييرات الصغيرة تتراكم.';
Object.assign(WHY.en, { clogged:'Ports jammed', lostExports:'Lost exports {0}/yr', oilSold:'Oil sold abroad', oilHome:'Oil used at home' });
Object.assign(WHY.ar, { clogged:'الموانئ مزدحمة', lostExports:'صادرات ضائعة {0} سنوياً', oilSold:'النفط يُباع للخارج', oilHome:'النفط يُستخدم محلياً' });

TUT.en = [
  ['🏛️','You are the new president of Syria','The war is over. Cities are damaged, most people get four hours of electricity a day, and the money is almost worthless. Your job: rebuild the country, for as long as you can.'],
  ['⏱️','Time keeps moving','Press ▶ and the months start ticking. Speed up or pause any time. Every choice you make takes effect right away, and your legacy score changes every month.'],
  ['🗺️','The map shows each province','Colors show how angry people are. Tap a province to see its problems and its big project.'],
  ['🚢','Trade can make or break you','Oil, gas, phosphate, farms, ports and deals with neighbors bring in dollars. But ports have limits, and every deal has a price.'],
  ['🔗','Everything is connected','Printing money makes the dollar pricier, which shrinks salaries, which makes people angry. The “Why?” panel always shows you the chain.'],
  ['⚠️','How you lose','You run out of dollars. Four provinces revolt at once. The army takes over. Or Suwayda and the east break away. Crises pause the clock so you can think.'],
  ['🧭','You are not on your own','The Guide panel is always open at the bottom left. It lists your first steps, tells you the single most useful thing to do next, and explains why the numbers just moved. Start there whenever you are stuck.'],
];
TUT.ar = [
  ['🏛️','أنت رئيس سوريا الجديد','انتهت الحرب. المدن مدمّرة، ومعظم الناس يحصلون على أربع ساعات كهرباء، والعملة شبه بلا قيمة. مهمتك: أن تعيد بناء البلاد لأطول مدة ممكنة.'],
  ['⏱️','الوقت لا يتوقف','اضغط ▶ فتبدأ الأشهر بالمرور. سرّع أو أوقف متى شئت. كل قرار تتخذه ينفَّذ فوراً، ونقاط إرثك تتغيّر كل شهر.'],
  ['🗺️','الخريطة تُظهر كل محافظة','الألوان تُظهر مدى غضب الناس. اضغط على محافظة لترى مشاكلها ومشروعها الكبير.'],
  ['🚢','التجارة قد تنقذك أو تغرقك','النفط والغاز والفوسفات والمزارع والموانئ والاتفاقات مع الجيران تجلب الدولار. لكن للموانئ حدود، ولكل اتفاق ثمن.'],
  ['🔗','كل شيء مترابط','طباعة النقود ترفع سعر الدولار، فتنكمش الرواتب، فيغضب الناس. لوحة «لماذا؟» تُظهر لك السلسلة دائماً.'],
  ['⚠️','كيف تخسر','تنفد دولاراتك. أربع محافظات تتمرّد معاً. الجيش يستولي على الحكم. أو تنفصل السويداء والشرق. الأزمات توقف الساعة لتفكّر.'],
  ['🧭','لستَ وحدك','لوحة «الدليل» متاحة دائماً في الأسفل. فيها خطواتك الأولى، وأهم شيء تفعله الآن، وشرح لسبب تغيّر الأرقام للتو. ابدأ منها كلما توقفت حائراً.'],
];
MISSION_TXT.winter.en[1] = 'The grid is failing. Reach 7 hours of electricity a day within 4 years, with no province in revolt.';
MISSION_TXT.winter.ar[1] = 'الشبكة تنهار. اوصل إلى 7 ساعات كهرباء يومياً خلال 4 سنوات دون تمرّد أي محافظة.';
MISSION_TXT.lira.en[1] = 'The last government printed money like crazy. A dollar costs 260 lira and prices rise 90% a year. Within 4 years, get the dollar under 340 and yearly price rises under 30%.';
MISSION_TXT.lira.ar[1] = 'الحكومة السابقة طبعت النقود بجنون. الدولار بـ260 ليرة والأسعار ترتفع 90% سنوياً. خلال 4 سنوات، اجعل الدولار تحت 340 والتضخم تحت 30%.';
MISSION_TXT.bread.en[1] = 'Drought has hit the northeast. Wheat imports cost double for 4 years. Finish with trust at 40+, at least $250M in the bank, and Hasakeh’s anger below 55.';
MISSION_TXT.bread.ar[1] = 'ضرب الجفاف الشمال الشرقي. استيراد القمح يكلّف الضعف لأربع سنوات. أنهِ المهمة بثقة 40+ و250 مليون$ على الأقل وغضب الحسكة تحت 55.';
MISSION_TXT.capital.en[1] = 'Rural Damascus is close to revolt and the city is restless. Within 4 years, get Rural Damascus under 50 and Damascus city under 45.';
MISSION_TXT.capital.ar[1] = 'ريف دمشق على وشك التمرّد والمدينة متوترة. خلال 4 سنوات، اجعل غضب ريف دمشق تحت 50 ومدينة دمشق تحت 45.';
MISSION_TXT.trade = { icon:'🚢', en:['Open for business','Syria earns about $120M a year from exports, transit and investment. Within 4 years, get it to $250M a year.','Lesson: selling abroad needs things to sell, ports to ship them, and partners to buy them.'],
  ar:['البلد مفتوح للأعمال','تكسب سوريا حوالي 120 مليون$ سنوياً من الصادرات والعبور والاستثمار. خلال 4 سنوات، اوصل بها إلى 250 مليون$.','الدرس: البيع للخارج يحتاج بضاعة تبيعها، وموانئ تشحنها، وشركاء يشترونها.'] };

// investments, ports, partners
const INV_TXT = {
  oilwells:{ icon:'🛢️', en:['Repair oil wells','+25 thousand barrels a day of capacity. Only helps if you control the fields and the east is calm.'], ar:['إصلاح آبار النفط','+25 ألف برميل يومياً من القدرة. يفيد فقط إذا سيطرت على الحقول وكان الشرق هادئاً.'] },
  refinery:{ icon:'🏭', en:['Expand the refineries','Refine 20 thousand more barrels a day at home. Refined fuel is worth far more than crude — but only if the oil policy says to use it at home.'], ar:['توسيع المصافي','تكرير 20 ألف برميل إضافية يومياً محلياً. الوقود المكرّر أغلى بكثير من الخام — لكن فقط إذا كانت سياسة النفط تقول باستخدامه محلياً.'] },
  gasfield:{ icon:'🔥', en:['Develop a gas field','+3 million m³ a day of gas for power plants. Ready in 18 months.'], ar:['تطوير حقل غاز','+3 مليون م³ يومياً من الغاز لمحطات الكهرباء. يجهز خلال 18 شهراً.'] },
  offshore:{ icon:'🌊', en:['Drill for offshore gas','A 50/50 bet. In 3 years you find a big gas field under the sea, or nothing.'], ar:['التنقيب عن الغاز البحري','مقامرة 50/50. خلال 3 سنوات تجد حقل غاز كبيراً تحت البحر، أو لا شيء.'] },
  phosphate:{ icon:'⛏️', en:['Expand phosphate mines','Mining exports +35%.'], ar:['توسيع مناجم الفوسفات','صادرات التعدين +35%.'] },
  farm:{ icon:'🫒', en:['Olive oil and cotton program','Seeds, presses and buyers abroad. Farm exports grow.'], ar:['برنامج الزيتون والقطن','بذار ومعاصر ومشترون في الخارج. تنمو الصادرات الزراعية.'] },
};
Object.assign(INV_TXT, {
  textiles:{ icon:'🧵', en:['Textile mills and garment workshops','Syria used to clothe the region. Cheap to restart, and it hires more people per dollar than anything else you can build.'],
    ar:['مصانع النسيج وورشات الألبسة','كانت سوريا تكسو المنطقة. إعادة تشغيلها رخيصة، وتوظّف عدداً من الناس أكبر من أي شيء آخر مقابل كل دولار.'] },
  food:{ icon:'🥫', en:['Food processing and canning','Turn the harvest into something that keeps. Jobs in the farming provinces, and a smaller wheat bill every year.'],
    ar:['تصنيع الأغذية والتعليب','حوّل المحصول إلى شيء يُخزَّن. وظائف في محافظات الزراعة، وفاتورة قمح أقل كل عام.'] },
  pharma:{ icon:'💊', en:['Medicine factories','Syria made most of its own medicine before the war. Skilled work, steady exports, and hospitals that stop begging.'],
    ar:['معامل الأدوية','كانت سوريا تصنع معظم دوائها قبل الحرب. عمل يحتاج مهارة، وصادرات ثابتة، ومشافٍ تكفّ عن الاستجداء.'] },
  cement:{ icon:'🧱', en:['Cement and building materials','Every lira you spend on rebuilding goes further when the cement is made here instead of imported.'],
    ar:['الإسمنت ومواد البناء','كل ليرة تنفقها على الإعمار تمتدّ أكثر عندما يُصنع الإسمنت هنا بدل استيراده.'] },
  telecom:{ icon:'📡', en:['Phone and internet network','Expensive, and it earns little directly. But taxes get collected, businesses find customers, and the whole economy speeds up.'],
    ar:['شبكة الهاتف والإنترنت','مكلفة، ولا تكسب كثيراً بنفسها. لكن الضرائب تُجبى، والتجار يجدون زبائن، ويتسارع الاقتصاد كله.'] },
  logistics:{ icon:'🚚', en:['Trucks, roads and warehouses','Nothing you make is worth anything until it can reach a buyer. This is what unjams the ports.'],
    ar:['الشاحنات والطرق والمستودعات','لا قيمة لما تصنعه حتى يصل إلى مشترٍ. هذا ما يفكّ ازدحام الموانئ.'] },
  coldchain:{ icon:'❄️', en:['Cold storage and refrigerated transport','Right now a share of every harvest rots between the field and the ship. This stops that.'],
    ar:['التبريد والنقل المبرّد','اليوم يتلف جزء من كل محصول بين الحقل والسفينة. هذا يوقف ذلك.'] },
  packaging:{ icon:'📦', en:['Packaging and grading','The same olive oil in a proper bottle with a label is worth more abroad. Cheap, and it lifts everything you sell.'],
    ar:['التعبئة والفرز','زيت الزيتون نفسه في عبوة لائقة بعلامة يساوي أكثر في الخارج. رخيص، ويرفع قيمة كل ما تبيعه.'] },
  tourism:{ icon:'🏛️', en:['Hotels and the old cities','Damascus, Palmyra, the coast. Visitors pay in dollars and need no ship, but nobody comes to a country that is angry or dark.'],
    ar:['الفنادق والمدن القديمة','دمشق وتدمر والساحل. الزوّار يدفعون بالدولار ولا يحتاجون سفينة، لكن لا أحد يزور بلداً غاضباً أو مظلماً.'] },
});
const PORT_NAME = { en:{ latakia:'Latakia', tartus:'Tartus' }, ar:{ latakia:'اللاذقية', tartus:'طرطوس' } };
const PART_TXT = {
  turkey:{ en:['Turkey','Northern trade corridor','Open the northern crossings for factory and farm exports.','Export room +$60M/yr, factory exports +15%.','Aleppo and Idlib anger below 65'],
    ar:['تركيا','ممر التجارة الشمالي','فتح المعابر الشمالية لصادرات المصانع والمزارع.','قدرة تصدير +60 مليون$/سنة، صادرات المصانع +15%.','غضب حلب وإدلب أقل من 65'] },
  jordan:{ en:['Jordan','Southern route to the Gulf','Trucks carry goods through Nassib to Gulf markets.','Transit +$40M/yr, export room +$50M/yr.','Daraa anger below 65'],
    ar:['الأردن','الطريق الجنوبي إلى الخليج','شاحنات تنقل البضائع عبر نصيب إلى أسواق الخليج.','عبور +40 مليون$/سنة، قدرة تصدير +50 مليون$/سنة.','غضب درعا أقل من 65'] },
  iraq:{ en:['Iraq','Oil and electricity link','Iraq sells you electricity and crude oil for your refineries.','+300 MW of power, fuel savings $20M/yr. Costs $30M/yr.','Deir ez-Zor anger below 65'],
    ar:['العراق','ربط النفط والكهرباء','العراق يبيعك الكهرباء والنفط الخام لمصافيك.','+300 ميغاواط، توفير وقود 20 مليون$/سنة. يكلّف 30 مليون$/سنة.','غضب دير الزور أقل من 65'] },
  lebanon:{ en:['Lebanon','Gas and power transit','Repair the Arab Gas Pipeline so gas and electricity can cross Syria to Lebanon.','Transit fees +$24M/yr. Pipeline repair costs $40M.','Homs anger below 70'],
    ar:['لبنان','عبور الغاز والكهرباء','أصلِح خط الغاز العربي ليعبر الغاز والكهرباء سوريا إلى لبنان.','رسوم عبور +24 مليون$/سنة. إصلاح الخط يكلّف 40 مليون$.','غضب حمص أقل من 70'] },
  gulf:{ en:['Gulf states','Investment partnership','Gulf funds invest in hotels, factories and farms.','+$80M/yr of investment, faster growth. Independence −2.','Corruption below 55'],
    ar:['دول الخليج','شراكة استثمارية','صناديق خليجية تستثمر في الفنادق والمصانع والمزارع.','+80 مليون$/سنة استثمار، ونمو أسرع. الاستقلال −2.','فساد أقل من 55'] },
  eu:{ en:['European Union','Market access and rebuilding','Syrian goods enter European markets, plus reconstruction grants.','Exports earn 25% more, +$60M/yr in grants.','Trust 45+ and corruption below 50'],
    ar:['الاتحاد الأوروبي','دخول الأسواق وإعادة الإعمار','البضائع السورية تدخل الأسواق الأوروبية، مع منح لإعادة الإعمار.','الصادرات تكسب 25% أكثر، +60 مليون$/سنة منحاً.','ثقة 45+ وفساد أقل من 50'] },
  china:{ en:['China','Ports-for-phosphate','A Chinese company upgrades both ports for free, and takes 30% of phosphate income in return.','Both ports +1 level in 12 months. Phosphate income −30%. Independence −5.','No conditions'],
    ar:['الصين','الموانئ مقابل الفوسفات','شركة صينية تطوّر الميناءين مجاناً، وتأخذ مقابل ذلك 30% من دخل الفوسفات.','الميناءان +1 مستوى خلال 12 شهراً. دخل الفوسفات −30%. الاستقلال −5.','بلا شروط'] },
  russia:{ en:['Russia','Wheat supply deal','Cheaper wheat, in exchange for a long lease on part of Tartus port.','Wheat imports cost 25% less. Independence −5.','No conditions'],
    ar:['روسيا','اتفاق توريد القمح','قمح أرخص مقابل تأجير طويل لجزء من ميناء طرطوس.','استيراد القمح أرخص بـ25%. الاستقلال −5.','بلا شروط'] },
};


// ---------- trading with another player's Syria ----------
const PACT_TXT = {
  en:{ power:'electricity', oil:'fuel', food:'food', ports:'port space', money:'investment' },
  ar:{ power:'\u0627\u0644\u0643\u0647\u0631\u0628\u0627\u0621', oil:'\u0627\u0644\u0648\u0642\u0648\u062f', food:'\u0627\u0644\u063a\u0630\u0627\u0621', ports:'\u0645\u0633\u0627\u062d\u0629 \u0627\u0644\u0645\u0648\u0627\u0646\u0626', money:'\u0627\u0644\u0627\u0633\u062a\u062b\u0645\u0627\u0631' },
};
STR.en.pactCan = 'They have {0}, you have {1}';
STR.en.pactOffer = 'Offer';
STR.en.pactWait = 'Waiting for them to agree: their {0} for your {1}';
STR.en.pactLive = 'Trading: their {0} for your {1}';
STR.en.pactEnd = 'End';
STR.en.pactNone = 'Nothing to trade right now \u2014 you both need the same things.';
STR.ar.pactCan = '\u0644\u062f\u064a\u0647\u0645 {0}\u060c \u0648\u0644\u062f\u064a\u0643 {1}';
STR.ar.pactOffer = '\u0627\u0639\u0631\u0636';
STR.ar.pactWait = '\u0628\u0627\u0646\u062a\u0638\u0627\u0631 \u0645\u0648\u0627\u0641\u0642\u062a\u0647\u0645: {0} \u0639\u0646\u062f\u0647\u0645 \u0645\u0642\u0627\u0628\u0644 {1} \u0639\u0646\u062f\u0643';
STR.ar.pactLive = '\u062a\u0628\u0627\u062f\u0644 \u0642\u0627\u0626\u0645: {0} \u0639\u0646\u062f\u0647\u0645 \u0645\u0642\u0627\u0628\u0644 {1} \u0639\u0646\u062f\u0643';
STR.ar.pactEnd = '\u0625\u0646\u0647\u0627\u0621';
STR.ar.pactNone = '\u0644\u0627 \u0634\u064a\u0621 \u0644\u0644\u062a\u0628\u0627\u062f\u0644 \u0627\u0644\u0622\u0646 \u2014 \u0643\u0644\u0627\u0643\u0645\u0627 \u064a\u062d\u062a\u0627\u062c \u0627\u0644\u0623\u0634\u064a\u0627\u0621 \u0646\u0641\u0633\u0647\u0627.';


// ---------- multinationals ----------
// name, what they are here for, and what they are waiting on when they will not come
const FIRM_TXT = {
  gulfco:{ en:['Gulf holding group','Al-Khaleej Development','Waiting for a bigger economy and less corruption.'],
    ar:['\u0645\u062c\u0645\u0648\u0639\u0629 \u062e\u0644\u064a\u062c\u064a\u0629','\u0627\u0644\u062e\u0644\u064a\u062c \u0644\u0644\u062a\u0646\u0645\u064a\u0629','\u064a\u0646\u062a\u0638\u0631\u0648\u0646 \u0627\u0642\u062a\u0635\u0627\u062f\u0627\u064b \u0623\u0643\u0628\u0631 \u0648\u0641\u0633\u0627\u062f\u0627\u064b \u0623\u0642\u0644.'] },
  anadolu:{ en:['Turkish manufacturer','Anadolu Industries','Waiting for calmer streets, especially in Aleppo.'],
    ar:['\u0645\u0635\u0646\u0651\u0639 \u062a\u0631\u0643\u064a','\u0635\u0646\u0627\u0639\u0627\u062a \u0627\u0644\u0623\u0646\u0627\u0636\u0648\u0644','\u064a\u0646\u062a\u0638\u0631\u0648\u0646 \u0647\u062f\u0648\u0621\u0627\u064b \u0641\u064a \u0627\u0644\u0634\u0627\u0631\u0639\u060c \u0648\u062e\u0627\u0635\u0629 \u0641\u064a \u062d\u0644\u0628.'] },
  hanjin:{ en:['Chinese state-backed group','Silk Road Engineering','They will come to anyone.'],
    ar:['\u0645\u062c\u0645\u0648\u0639\u0629 \u0635\u064a\u0646\u064a\u0629 \u0645\u062f\u0639\u0648\u0645\u0629 \u0645\u0646 \u0627\u0644\u062f\u0648\u0644\u0629','\u0637\u0631\u064a\u0642 \u0627\u0644\u062d\u0631\u064a\u0631 \u0644\u0644\u0647\u0646\u062f\u0633\u0629','\u064a\u0623\u062a\u0648\u0646 \u0625\u0644\u0649 \u0623\u064a \u0623\u062d\u062f.'] },
  meridian:{ en:['European pharmaceutical group','Meridian Pharma','Waiting for honest government and schools that work.'],
    ar:['\u0645\u062c\u0645\u0648\u0639\u0629 \u062f\u0648\u0627\u0626\u064a\u0629 \u0623\u0648\u0631\u0648\u0628\u064a\u0629','\u0645\u064a\u0631\u064a\u062f\u064a\u0627\u0646 \u0641\u0627\u0631\u0645\u0627','\u064a\u0646\u062a\u0638\u0631\u0648\u0646 \u062d\u0643\u0648\u0645\u0629 \u0646\u0632\u064a\u0647\u0629 \u0648\u0645\u062f\u0627\u0631\u0633 \u062a\u0639\u0645\u0644.'] },
  levant:{ en:['Syrian diaspora fund','Levant Partners','Waiting for Syrians abroad to trust the government again.'],
    ar:['\u0635\u0646\u062f\u0648\u0642 \u0627\u0644\u0645\u063a\u062a\u0631\u0628\u064a\u0646 \u0627\u0644\u0633\u0648\u0631\u064a\u064a\u0646','\u0634\u0631\u0643\u0627\u0621 \u0627\u0644\u0634\u0627\u0645','\u064a\u0646\u062a\u0638\u0631\u0648\u0646 \u0623\u0646 \u064a\u0639\u0648\u062f \u0633\u0648\u0631\u064a\u0648 \u0627\u0644\u062e\u0627\u0631\u062c \u0644\u0644\u062b\u0642\u0629 \u0628\u0627\u0644\u062d\u0643\u0648\u0645\u0629.'] },
};
STR.en.subFirms = 'Companies';
STR.en.firmsSub = 'Foreign companies will build factories here with their own money. You choose the sector. They keep a share of what it earns abroad, for good.';
STR.en.firmBuilds = 'Builds {0} levels at their own cost, ready in {1}.';
STR.en.firmSov = 'Independence \u2212{0}.';
STR.en.firmNoSov = 'Syrian-owned, so no cost to independence.';
STR.en.firmShare = 'Then they keep {0}% of everything that sector ever earns abroad \u2014 including the parts you build yourself later.';
STR.en.firmPick = 'Where do you want their money?';
STR.en.firmIn = 'Building in {0}';
STR.en.firmTakes = 'Takes {0} a year out of the country';
STR.en.yr = 'yr';
STR.ar.subFirms = '\u0627\u0644\u0634\u0631\u0643\u0627\u062a';
STR.ar.firmsSub = '\u0634\u0631\u0643\u0627\u062a \u0623\u062c\u0646\u0628\u064a\u0629 \u062a\u0628\u0646\u064a \u0645\u0635\u0627\u0646\u0639 \u0647\u0646\u0627 \u0628\u0645\u0627\u0644\u0647\u0627. \u0623\u0646\u062a \u062a\u062e\u062a\u0627\u0631 \u0627\u0644\u0642\u0637\u0627\u0639. \u0648\u062a\u062d\u062a\u0641\u0638 \u0647\u064a \u0628\u062d\u0635\u0629 \u0645\u0645\u0627 \u064a\u0643\u0633\u0628\u0647 \u0641\u064a \u0627\u0644\u062e\u0627\u0631\u062c\u060c \u0625\u0644\u0649 \u0627\u0644\u0623\u0628\u062f.';
STR.ar.firmBuilds = '\u062a\u0628\u0646\u064a {0} \u0645\u0633\u062a\u0648\u064a\u0627\u062a \u0639\u0644\u0649 \u062d\u0633\u0627\u0628\u0647\u0627\u060c \u062c\u0627\u0647\u0632\u0629 \u062e\u0644\u0627\u0644 {1}.';
STR.ar.firmSov = '\u0627\u0644\u0627\u0633\u062a\u0642\u0644\u0627\u0644 \u2212{0}.';
STR.ar.firmNoSov = '\u0645\u0644\u0643\u064a\u0629 \u0633\u0648\u0631\u064a\u0629\u060c \u0641\u0644\u0627 \u0643\u0644\u0641\u0629 \u0639\u0644\u0649 \u0627\u0644\u0627\u0633\u062a\u0642\u0644\u0627\u0644.';
STR.ar.firmShare = '\u062b\u0645 \u062a\u062d\u062a\u0641\u0638 \u0628\u0640 {0}% \u0645\u0646 \u0643\u0644 \u0645\u0627 \u064a\u0643\u0633\u0628\u0647 \u0630\u0644\u0643 \u0627\u0644\u0642\u0637\u0627\u0639 \u0641\u064a \u0627\u0644\u062e\u0627\u0631\u062c \u2014 \u0628\u0645\u0627 \u0641\u064a\u0647 \u0645\u0627 \u062a\u0628\u0646\u064a\u0647 \u0623\u0646\u062a \u0644\u0627\u062d\u0642\u0627\u064b.';
STR.ar.firmPick = '\u0623\u064a\u0646 \u062a\u0631\u064a\u062f \u0623\u0645\u0648\u0627\u0644\u0647\u0645\u061f';
STR.ar.firmIn = '\u062a\u0628\u0646\u064a \u0641\u064a {0}';
STR.ar.firmTakes = '\u062a\u062e\u0631\u062c {0} \u0633\u0646\u0648\u064a\u0627\u064b \u0645\u0646 \u0627\u0644\u0628\u0644\u0627\u062f';
STR.ar.yr = '\u0633\u0646\u0629';
NOTE.en.firmSigned = '{0} will build in {1}.';
NOTE.en.firmDone = '{0} opened its plants in {1}.';
NOTE.ar.firmSigned = '{0} \u0633\u062a\u0628\u0646\u064a \u0641\u064a {1}.';
NOTE.ar.firmDone = '{0} \u0627\u0641\u062a\u062a\u062d\u062a \u0645\u0635\u0627\u0646\u0639\u0647\u0627 \u0641\u064a {1}.';
LEDGER.en.profitsOut = 'Profits leaving with foreign owners';
LEDGER.ar.profitsOut = '\u0623\u0631\u0628\u0627\u062d \u062a\u062e\u0631\u062c \u0645\u0639 \u0627\u0644\u0645\u0644\u0627\u0643 \u0627\u0644\u0623\u062c\u0627\u0646\u0628';
